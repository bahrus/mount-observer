import { arr } from './arr.js';
import { MountEvent, DismountEvent, DisconnectEvent, LoadEvent, AttrChangeEvent, } from './Events.js';
import { registerSharedObserver, unregisterSharedObserver } from './SharedMutationObserver.js';
import { whereOutside } from './whereOutside.js';
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
    #elementAttrStates = new WeakMap();
    #elementOnceAttrs = new WeakMap();
    #matchesWhereAttrFn = null;
    #buildAttrCoordinateMapFn = null;
    #checkAttrChangesFn = null;
    #mediaQueryCleanup;
    #mediaMatches = true;
    #asgMtSource;
    #asgDisMtSource;
    #elementNotifiers = new WeakMap();
    #notifierMountedElements = new WeakSet();
    constructor(init, options = {}) {
        super();
        this.#init = init;
        this.#options = options;
        this.#abortController = new AbortController();
        const { assignOnMount: asgMt, asgDisMt, do: doValue, reference, whereAttr, loadingEagerness, import: imp } = init;
        // Make a copy of assignGingerly config using structuredClone
        if (asgMt !== undefined) {
            this.#asgMtSource = structuredClone(asgMt);
        }
        if (asgDisMt !== undefined) {
            this.#asgDisMtSource = structuredClone(asgDisMt);
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
        // Preload whereAttr utilities if needed
        if (whereAttr) {
            this.#preloadWhereAttrUtilities();
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
    async #preloadWhereAttrUtilities() {
        if (!this.#matchesWhereAttrFn) {
            const { matchesWhereAttr } = await import('./whereAttr.js');
            this.#matchesWhereAttrFn = matchesWhereAttr;
        }
        if (!this.#buildAttrCoordinateMapFn) {
            const { buildAttrCoordinateMap } = await import('./attrCoordinates.js');
            this.#buildAttrCoordinateMapFn = buildAttrCoordinateMap;
        }
        if (!this.#checkAttrChangesFn) {
            const { checkAttrChanges } = await import('./attrChanges.js');
            // Create a bound function that passes the required parameters
            this.#checkAttrChangesFn = (element) => {
                return checkAttrChanges(element, this.#init, this.#buildAttrCoordinateMapFn, this.#elementAttrStates, this.#elementOnceAttrs);
            };
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
    async observe(rootNode) {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }
        this.#rootNode = new WeakRef(rootNode);
        // Set up media query if specified (needs rootNode to be set first)
        if (this.#init.whereMediaMatches) {
            await this.#setupMediaQuery();
        }
        // Wait for whereAttr utilities to load if needed
        if (this.#init.whereAttr && !this.#matchesWhereAttrFn) {
            await this.#preloadWhereAttrUtilities();
        }
        // Wait for eager imports to complete if they were started in constructor
        if (this.#init.loadingEagerness === 'eager' && this.#init.import && !this.#importsLoaded) {
            await this.#loadImports();
        }
        // Process existing elements only if media matches
        if (this.#mediaMatches) {
            this.#processNode(rootNode);
        }
        // Create mutation callback
        this.#mutationCallback = (mutations) => {
            // Skip processing if media doesn't match
            if (!this.#mediaMatches) {
                return;
            }
            const attrChanges = [];
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
                else if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
                    // Handle attribute changes for mounted elements
                    const element = mutation.target;
                    if (this.#mountedElements.weakSet.has(element) && this.#checkAttrChangesFn) {
                        const changes = this.#checkAttrChangesFn(element);
                        attrChanges.push(...changes);
                    }
                }
            }
            // Batch and dispatch attribute changes
            if (attrChanges.length > 0) {
                this.dispatchEvent(new AttrChangeEvent(attrChanges, this.#init));
                // Dispatch filtered attrchange events to element-specific notifiers
                const changesByElement = new Map();
                for (const change of attrChanges) {
                    if (!changesByElement.has(change.element)) {
                        changesByElement.set(change.element, []);
                    }
                    changesByElement.get(change.element).push(change);
                }
                for (const [element, changes] of changesByElement) {
                    const notifier = this.#elementNotifiers.get(element);
                    if (notifier) {
                        notifier.dispatchEvent(new AttrChangeEvent(changes, this.#init));
                    }
                }
            }
        };
        const observerConfig = {
            childList: true,
            subtree: true
        };
        // Add attribute observation if whereAttr is configured
        if (this.#init.whereAttr) {
            observerConfig.attributes = true;
            observerConfig.attributeOldValue = true;
        }
        // Register with shared mutation observer
        registerSharedObserver(rootNode, this.#mutationCallback, observerConfig);
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
            if (this.#matchesSelector(element)) {
                this.#handleMatch(element);
            }
        }
        // Process children
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
            const root = node;
            // Get all elements matching the CSS selector first
            root.querySelectorAll(this.#init.whereElementMatches).forEach(child => {
                if (this.#matchesSelector(child)) {
                    this.#handleMatch(child);
                }
            });
        }
    }
    #matchesSelector(element) {
        //TODO:  reduce redundncy with this.#init?
        // Check whereElementMatches condition
        const matchesElement = element.matches(this.#init.whereElementMatches);
        if (!matchesElement) {
            return false;
        }
        // Check whereOutside condition if specified (donut hole scoping)
        if (this.#init.whereOutside) {
            const rootNode = this.#rootNode?.deref();
            if (!rootNode || !whereOutside(rootNode, element, this.#init.whereOutside)) {
                return false;
            }
        }
        // Check whereAttr condition if specified
        if (this.#init.whereAttr) {
            // Use cached function (should be loaded by now from constructor)
            if (!this.#matchesWhereAttrFn) {
                console.warn('whereAttr utilities not loaded yet');
                return false;
            }
            if (!this.#matchesWhereAttrFn(element, this.#init.whereAttr)) {
                return false;
            }
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
            mountInit: this.#init,
        };
        // Apply assignGingerly if specified
        if (this.#asgMtSource) {
            const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
            assignGingerly(element, this.#asgMtSource);
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
        // Check for initial attribute changes if whereAttr is configured
        if (this.#checkAttrChangesFn) {
            const changes = this.#checkAttrChangesFn(element);
            if (changes.length > 0) {
                this.dispatchEvent(new AttrChangeEvent(changes, this.#init));
                // Also dispatch to element-specific notifier
                const notifier = this.#elementNotifiers.get(element);
                if (notifier) {
                    notifier.dispatchEvent(new AttrChangeEvent(changes, this.#init));
                }
            }
        }
    }
    async assignGingerly(config) {
        // Handle undefined case
        if (config === undefined) {
            this.#asgMtSource = undefined;
            return;
        }
        const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
        // Update the source config for future mounted elements
        if (this.#asgMtSource === undefined) {
            // No existing config, just clone the passed in object
            this.#asgMtSource = structuredClone(config);
        }
        else {
            // Merge into existing config using assignGingerly
            assignGingerly(this.#asgMtSource, config);
        }
        // Apply to already mounted elements using setWeak for iteration
        for (const ref of this.#mountedElements.setWeak) {
            const element = ref.deref();
            if (element) {
                assignGingerly(element, config);
            }
        }
    }
    async #handleRemoval(element) {
        if (!this.#mountedElements.weakSet.has(element)) {
            return;
        }
        // Apply assignGingerly if specified for dismount
        if (this.#asgDisMtSource) {
            const { assignGingerly } = await import('assign-gingerly/assignGingerly.js');
            assignGingerly(element, this.#asgDisMtSource);
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
            mountInit: this.#init,
        };
        // Dispatch dismount event
        const dismountEvent = new DismountEvent(element, 'where-element-matches-failed', this.#init);
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
