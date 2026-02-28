import { arr } from './arr.js';
import { MountEvent, DismountEvent, DisconnectEvent, LoadEvent, } from './Events.js';
import { registerSharedObserver, unregisterSharedObserver } from './SharedMutationObserver.js';
import { withScopePerimeter } from './withScopePerimeter.js';
export class MountObserver extends EventTarget {
    // Static registry for registered handlers
    static #handlerRegistry = new Map();
    static define(name, handler) {
        if (this.#handlerRegistry.has(name)) {
            throw new Error(`${name} already in use`);
        }
        this.#handlerRegistry.set(name, handler);
    }
    #init;
    #options;
    #abortController;
    #modules = [];
    #mountedElements = {
        weakSet: new WeakSet(),
        setWeak: new Set()
    };
    #processedDoForElement = new WeakSet();
    #processedEventsForElement = new WeakMap();
    #mutationCallback;
    #rootNode;
    #importsLoaded = false;
    #mediaQueryCleanup;
    #rootSizeCleanup;
    #intersectionCleanup;
    #connectionCleanup;
    #intersectionObserver;
    #mediaMatches = true;
    #rootSizeMatches = true;
    #connectionMatches = true;
    #asgMtSource;
    #asgDisMtSource;
    #stageMtSource;
    #stageReversals = new WeakMap();
    #assignTentatively;
    #elementNotifiers = new WeakMap();
    #notifierMountedElements = new WeakSet();
    #mergeHandlerDefaults(config) {
        const doValue = config.do;
        // Only process if do is a string (single handler reference)
        if (typeof doValue !== 'string') {
            return config;
        }
        // Look up the handler class
        const HandlerClass = MountObserver.#handlerRegistry.get(doValue);
        if (!HandlerClass) {
            // Validation will catch this later
            return config;
        }
        // Extract static properties from the handler class
        const handlerDefaults = {};
        const proto = HandlerClass;
        // Get all static properties
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key !== 'prototype' && key !== 'length' && key !== 'name') {
                handlerDefaults[key] = proto[key];
            }
        }
        // Merge: handler defaults first, then inline config (inline trumps)
        // Using object spread - inline config overwrites handler defaults
        return { ...handlerDefaults, ...config };
    }
    constructor(config, options = {}) {
        super();
        // Merge handler defaults if do is a string reference
        const mergedConfig = this.#mergeHandlerDefaults(config);
        this.#init = mergedConfig;
        this.#options = options;
        this.#abortController = new AbortController();
        const { assignOnMount, assignOnDismount, stageOnMount, do: doValue, reference, loadingEagerness, import: imp } = mergedConfig;
        // Make a copy of assignOnMount config using structuredClone
        if (assignOnMount !== undefined) {
            this.#asgMtSource = structuredClone(assignOnMount);
        }
        if (assignOnDismount !== undefined) {
            this.#asgDisMtSource = structuredClone(assignOnDismount);
        }
        if (stageOnMount !== undefined) {
            this.#stageMtSource = structuredClone(stageOnMount);
        }
        if (options.disconnectedSignal) {
            options.disconnectedSignal.addEventListener('abort', () => {
                this.disconnect();
            });
        }
        // Validate do property if it contains string references
        if (doValue !== undefined) {
            this.#validateDoHandlers();
        }
        // Validate reference property if present
        if (reference !== undefined) {
            this.#validateReference();
        }
        // Start loading imports if eager
        if (loadingEagerness === 'eager' && imp) {
            this.#loadImports();
        }
    }
    #validateDoHandlers() {
        const doValue = this.#init.do;
        if (doValue === undefined)
            return;
        const handlers = Array.isArray(doValue) ? doValue : [doValue];
        for (const handler of handlers) {
            if (typeof handler === 'string') {
                if (!MountObserver.#handlerRegistry.has(handler)) {
                    throw new Error(`No handler defined for ${handler}`);
                }
            }
        }
    }
    #validateReference() {
        if (!this.#init.import) {
            throw new Error('reference property requires import to be defined');
        }
        // Normalize import to array
        const imports = Array.isArray(this.#init.import)
            ? this.#init.import
            : [this.#init.import];
        // Normalize reference to array
        const references = arr(this.#init.reference);
        // Validate each reference index
        for (const index of references) {
            // Check if index is within bounds
            if (index < 0 || index >= imports.length) {
                throw new Error(`reference index ${index} is out of bounds (import array length: ${imports.length})`);
            }
            const importItem = imports[index];
            // Check if it's a JS module (not a 2D array with type option)
            if (Array.isArray(importItem)) {
                throw new Error(`reference index ${index} points to a non-JS module import (array with type option)`);
            }
        }
    }
    async #setupMediaQuery() {
        if (!this.#rootNode) {
            throw new Error('Cannot setup media query before observe() is called');
        }
        const { setupMediaQuery } = await import('./mediaQuery.js');
        const result = setupMediaQuery(this.#init, this.#rootNode, this.#mountedElements, this.#modules, this, (node) => this.#processNode(node));
        this.#mediaMatches = result.mediaMatches;
        this.#mediaQueryCleanup = result.cleanup;
    }
    async #setupRootSizeObserver() {
        if (!this.#rootNode) {
            throw new Error('Cannot setup root size observer before observe() is called');
        }
        const { setupRootSizeObserver } = await import('./rootSizeObserver.js');
        const result = setupRootSizeObserver(this.#init, this.#rootNode, this.#mountedElements, this.#modules, this, (node) => this.#processNode(node));
        this.#rootSizeMatches = result.conditionMatches;
        this.#rootSizeCleanup = result.cleanup;
    }
    async #setupElementIntersection() {
        if (!this.#rootNode) {
            throw new Error('Cannot setup element intersection before observe() is called');
        }
        const { setupElementIntersection } = await import('./elementIntersection.js');
        const result = setupElementIntersection(this.#init, this.#rootNode, this.#mountedElements, this.#modules, this, (element) => this.#matchesSelector(element), (element) => this.#handleMatch(element));
        this.#intersectionObserver = result.intersectionObserver;
        this.#intersectionCleanup = result.cleanup;
    }
    async #setupConnectionMonitor() {
        if (!this.#rootNode) {
            throw new Error('Cannot setup connection monitor before observe() is called');
        }
        const { setupConnectionMonitor } = await import('./connectionMonitor.js');
        const result = setupConnectionMonitor(this.#init, this.#rootNode, this.#mountedElements, this.#modules, this, (node) => this.#processNode(node));
        this.#connectionMatches = result.conditionMatches;
        this.#connectionCleanup = result.cleanup;
    }
    get disconnectedSignal() {
        return this.#abortController.signal;
    }
    getNotifier(element) {
        // Return cached notifier if it exists
        let notifier = this.#elementNotifiers.get(element);
        if (notifier) {
            return notifier;
        }
        // Create new EventTarget for this element
        notifier = new EventTarget();
        this.#elementNotifiers.set(element, notifier);
        return notifier;
    }
    /**
     * Begins observing elements within the scope determined by the provided node.
     *
     * @param anchorNode - The node that anchors the observation scope. Depending on the
     *                     configured scope option (when using element.mount()), this may observe:
     *                     - The node itself ('self')
     *                     - The node's registry root ('registryRoot')
     *                     - All islands sharing the node's registry ('registry')
     *                     - The node's shadow root ('shadow')
     *                     - The node's root node ('root')
     *
     *                     When called directly (not via element.mount()), this is the actual
     *                     node that will be observed for matching elements.
     */
    async observe(anchorNode) {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }
        if (this.#asgMtSource || this.#asgDisMtSource) {
            await import('assign-gingerly/object-extension.js');
        }
        if (this.#stageMtSource) {
            const { assignTentatively } = await import('assign-gingerly/assignTentatively.js');
            this.#assignTentatively = assignTentatively;
        }
        this.#rootNode = new WeakRef(anchorNode);
        // Set up media query if specified (needs rootNode to be set first)
        if (this.#init.withMediaMatching) {
            await this.#setupMediaQuery();
        }
        // Set up root size observer if specified (needs rootNode to be set first)
        if (this.#init.whereObservedRootSizeMatches) {
            await this.#setupRootSizeObserver();
        }
        // Set up element intersection observer if specified (needs rootNode to be set first)
        if (this.#init.whereElementIntersectsWith) {
            await this.#setupElementIntersection();
        }
        // Set up connection monitor if specified (needs rootNode to be set first)
        if (this.#init.whereConnectionHas) {
            await this.#setupConnectionMonitor();
        }
        // Wait for eager imports to complete if they were started in constructor
        if (this.#init.loadingEagerness === 'eager' && this.#init.import && !this.#importsLoaded) {
            await this.#loadImports();
        }
        // Process existing elements only if all conditions match
        if (this.#mediaMatches && this.#rootSizeMatches && this.#connectionMatches) {
            this.#processNode(anchorNode);
        }
        // Create mutation callback
        this.#mutationCallback = (mutations) => {
            // Skip processing if any condition doesn't match
            if (!this.#mediaMatches || !this.#rootSizeMatches || !this.#connectionMatches) {
                return;
            }
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.#processNode(node);
                        }
                    }
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.#handleRemoval(node);
                        }
                    });
                }
            }
        };
        const observerConfig = {
            childList: true,
            subtree: true
        };
        // Register with shared mutation observer
        registerSharedObserver(anchorNode, this.#mutationCallback, observerConfig);
    }
    disconnect() {
        const rootNode = this.#rootNode?.deref();
        // Unregister from shared mutation observer
        if (rootNode && this.#mutationCallback) {
            unregisterSharedObserver(rootNode, this.#mutationCallback);
            this.#mutationCallback = undefined;
        }
        // Remove media query listener
        if (this.#mediaQueryCleanup) {
            this.#mediaQueryCleanup();
            this.#mediaQueryCleanup = undefined;
        }
        // Remove root size observer
        if (this.#rootSizeCleanup) {
            this.#rootSizeCleanup();
            this.#rootSizeCleanup = undefined;
        }
        // Remove intersection observer
        if (this.#intersectionCleanup) {
            this.#intersectionCleanup();
            this.#intersectionCleanup = undefined;
        }
        // Remove connection monitor
        if (this.#connectionCleanup) {
            this.#connectionCleanup();
            this.#connectionCleanup = undefined;
        }
        this.#abortController.abort();
        this.#rootNode = undefined;
    }
    async #loadImports() {
        if (this.#importsLoaded || !this.#init.import) {
            return;
        }
        // Dynamically load the import utilities only when needed
        const { loadImports } = await import('./loadImports.js');
        this.#modules = await loadImports(this.#init.import);
        this.#importsLoaded = true;
        // Validate referenced whereInstanceOf if reference is specified
        if (this.#init.reference !== undefined) {
            const references = arr(this.#init.reference);
            for (const index of references) {
                const module = this.#modules[index];
                if (module && module.whereInstanceOf !== undefined) {
                    // Validate that it's a Constructor or array of Constructors
                    const whereInstanceOf = module.whereInstanceOf;
                    const constructors = arr(whereInstanceOf);
                    for (const constructor of constructors) {
                        if (typeof constructor !== 'function') {
                            throw new Error(`Referenced module at index ${index} exports invalid whereInstanceOf: must be a Constructor or array of Constructors`);
                        }
                    }
                }
            }
        }
        this.dispatchEvent(new LoadEvent(this.#modules, this.#init));
    }
    #processNode(node) {
        // If it's an element node, check if it matches
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            // If intersection observer is active, start observing the element
            // The intersection callback will handle mounting when it intersects
            if (this.#intersectionObserver) {
                this.#intersectionObserver.observe(element);
            }
            else if (this.#matchesSelector(element)) {
                this.#handleMatch(element);
            }
        }
        // Process children
        if ('querySelectorAll' in node && this.#init.matching) {
            const root = node;
            // Get all elements matching the CSS selector first
            root.querySelectorAll(this.#init.matching).forEach(child => {
                // If intersection observer is active, start observing the element
                if (this.#intersectionObserver) {
                    this.#intersectionObserver.observe(child);
                }
                else if (this.#matchesSelector(child)) {
                    this.#handleMatch(child);
                }
            });
        }
    }
    #matchesSelector(element) {
        //TODO:  reduce redundncy with this.#init?
        // Check matching condition
        if (!this.#init.matching) {
            return false;
        }
        const matchesElement = element.matches(this.#init.matching);
        if (!matchesElement) {
            return false;
        }
        // Check that element's customElementRegistry matches root node's registry
        const rootNode = this.#rootNode?.deref();
        if (rootNode) {
            const rootRegistry = rootNode.customElementRegistry;
            const elementRegistry = element.customElementRegistry;
            // If registries don't match, exclude this element
            if (rootRegistry !== elementRegistry) {
                return false;
            }
        }
        // Check withScopePerimeter condition if specified (donut hole scoping)
        if (this.#init.withScopePerimeter) {
            if (!rootNode || !withScopePerimeter(rootNode, element, this.#init.withScopePerimeter)) {
                return false;
            }
        }
        // Check whereObservedRootSizeMatches condition if specified
        if (this.#init.whereObservedRootSizeMatches && !this.#rootSizeMatches) {
            return false;
        }
        // Check whereInstanceOf condition if specified
        if (this.#init.whereInstanceOf) {
            const constructors = arr(this.#init.whereInstanceOf);
            // Element must be an instance of at least one constructor (OR logic for array)
            const matchesInstanceOf = constructors.some(constructor => element instanceof constructor);
            if (!matchesInstanceOf) {
                return false;
            }
        }
        // Check referenced whereInstanceOf if imports are loaded and reference is specified
        if (this.#importsLoaded && this.#init.reference !== undefined) {
            const references = arr(this.#init.reference);
            for (const index of references) {
                const module = this.#modules[index];
                if (module && module.whereInstanceOf !== undefined) {
                    const constructors = arr(module.whereInstanceOf);
                    // Element must be an instance of at least one constructor (OR logic within this module)
                    const matchesInstanceOf = constructors.some((constructor) => element instanceof constructor);
                    if (!matchesInstanceOf) {
                        return false;
                    }
                }
            }
        }
        // All conditions passed
        return true;
    }
    async #handleMatch(element) {
        if (this.#processedDoForElement.has(element)) {
            return;
        }
        // Load imports if not already loaded
        if (!this.#importsLoaded && this.#init.import) {
            await this.#loadImports();
        }
        this.#processedDoForElement.add(element);
        // Add to both WeakSet and Set<WeakRef> for efficient operations
        if (!this.#mountedElements.weakSet.has(element)) {
            this.#mountedElements.weakSet.add(element);
            this.#mountedElements.setWeak.add(new WeakRef(element));
        }
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Root node was garbage collected
            return;
        }
        const context = {
            modules: this.#modules,
            observer: this,
            rootNode,
            MountConfig: this.#init,
        };
        // Apply assignGingerly if specified
        if (this.#asgMtSource) {
            element.assignGingerly(this.#asgMtSource);
        }
        // Apply assignTentatively if specified (staged assignments)
        if (this.#stageMtSource && this.#assignTentatively) {
            const reversal = {};
            this.#assignTentatively(element, this.#stageMtSource, { reversal });
            this.#stageReversals.set(element, reversal);
        }
        // Check if notifier exists BEFORE calling do callback
        const notifierExistedBeforeDo = this.#elementNotifiers.has(element);
        // Call do callback(s) - can be string, function, or array
        if (this.#init.do !== undefined) {
            const doHandlers = Array.isArray(this.#init.do) ? this.#init.do : [this.#init.do];
            for (const handler of doHandlers) {
                if (typeof handler === 'string') {
                    // Registered handler - instantiate it
                    const HandlerClass = MountObserver.#handlerRegistry.get(handler);
                    if (HandlerClass) {
                        new HandlerClass(element, context);
                    }
                }
                else if (typeof handler === 'function') {
                    // Inline function
                    handler(element, context);
                }
            }
        }
        // Call referenced do functions from imported modules
        if (this.#init.reference !== undefined) {
            const references = arr(this.#init.reference);
            for (const index of references) {
                const module = this.#modules[index];
                if (module && typeof module.do === 'function') {
                    module.do(element, context);
                }
            }
        }
        // Dispatch mount event
        const mountEvent = new MountEvent(element, this.#modules, this.#init, context);
        this.dispatchEvent(mountEvent);
        // Dispatch to element-specific notifier only if:
        // 1. Notifier existed before do callback (wasn't just created), AND
        // 2. Element hasn't already received a mount event on its notifier
        if (notifierExistedBeforeDo && !this.#notifierMountedElements.has(element)) {
            const notifier = this.#elementNotifiers.get(element);
            if (notifier) {
                this.#notifierMountedElements.add(element);
                notifier.dispatchEvent(mountEvent);
            }
        }
        // Emit events from mounted element if configured
        if (this.#init.mountedElemEmits) {
            const { emitMountedElementEvents } = await import('./emitEvents.js');
            await emitMountedElementEvents(element, this.#init, this.#processedEventsForElement);
        }
    }
    async assignGingerly(config) {
        // Handle undefined case
        if (config === undefined) {
            this.#asgMtSource = undefined;
            return;
        }
        await import('assign-gingerly/object-extension.js');
        // Update the source config for future mounted elements
        if (this.#asgMtSource === undefined) {
            // No existing config, just clone the passed in object
            this.#asgMtSource = structuredClone(config);
        }
        else {
            // Merge into existing config using assignGingerly
            this.#asgMtSource.assignGingerly(config);
            //assignGingerly(this.#asgMtSource, config);
        }
        // Apply to already mounted elements using setWeak for iteration
        for (const ref of this.#mountedElements.setWeak) {
            const element = ref.deref();
            if (element) {
                element.assignGingerly(config);
                //assignGingerly(element, config);
            }
        }
    }
    async #handleRemoval(element) {
        if (!this.#mountedElements.weakSet.has(element)) {
            return;
        }
        // Reverse tentative assignments first (restore original values)
        if (this.#stageMtSource && this.#assignTentatively) {
            const reversal = this.#stageReversals.get(element);
            if (reversal) {
                this.#assignTentatively(element, reversal);
                this.#stageReversals.delete(element);
            }
        }
        // Apply assignGingerly if specified for dismount
        if (this.#asgDisMtSource) {
            element.assignGingerly(this.#asgDisMtSource);
        }
        // Remove from both structures
        this.#mountedElements.weakSet.delete(element);
        for (const ref of this.#mountedElements.setWeak) {
            if (ref.deref() === element) {
                this.#mountedElements.setWeak.delete(ref);
                break;
            }
        }
        // Remove from processed set so element can be re-mounted
        this.#processedDoForElement.delete(element);
        // Remove from notifier mounted tracking so mount event can fire again
        this.#notifierMountedElements.delete(element);
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Root node was garbage collected
            return;
        }
        const context = {
            modules: this.#modules,
            observer: this,
            rootNode,
            MountConfig: this.#init,
        };
        // Dispatch dismount event
        const dismountEvent = new DismountEvent(element, 'with-matching-failed', this.#init);
        this.dispatchEvent(dismountEvent);
        // Dispatch to element-specific notifier
        const notifier = this.#elementNotifiers.get(element);
        if (notifier) {
            notifier.dispatchEvent(dismountEvent);
        }
        // Check if element is being moved within the same root
        // If it's truly disconnected, dispatch disconnect event
        setTimeout(() => {
            if (!rootNode.contains(element)) {
                const disconnectEvent = new DisconnectEvent(element, this.#init);
                this.dispatchEvent(disconnectEvent);
                // Dispatch to element-specific notifier
                const notifier = this.#elementNotifiers.get(element);
                if (notifier) {
                    notifier.dispatchEvent(disconnectEvent);
                }
            }
        }, 0);
    }
}
