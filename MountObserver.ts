import {
    MountConfig,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    WeakDual,
    EventConfig,
    EventConstructor,
    Constructor
} from './types/mount-observer/types.js';
import { arr } from './arr.js';
import {
    MountEvent,
    DismountEvent,
    DisconnectEvent,
    LoadEvent,
} from './Events.js';
import {
    registerSharedObserver,
    unregisterSharedObserver,
    type MutationCallback
} from './SharedMutationObserver.js';
import { withScopePerimeter } from './withScopePerimeter.js';
import { getRegistryRoot } from './getRegistryRoot.js';
import type { assignTentatively as AssignTentativelyType } from 'assign-gingerly/assignTentatively.js';

export class MountObserver<TKeys extends string = string> extends EventTarget implements IMountObserver {
    // Static registry for registered handlers
    static #handlerRegistry = new Map<string, Constructor>();
    
    static define(name: string, handler: Constructor): void {
        if (this.#handlerRegistry.has(name)) {
            throw new Error(`${name} already in use`);
        }
        this.#handlerRegistry.set(name, handler);
    }
    
    #init: MountConfig;
    #options: MountObserverOptions;
    #abortController: AbortController;
    #modules: any[] = [];
    #configFromPromise: Promise<void> | undefined;
    #mountedElements: WeakDual<Element> = {
        weakSet: new WeakSet(),
        setWeak: new Set()
    };
    #processedDoForElement = new WeakSet<Element>();
    #processedEventsForElement = new WeakMap<Element, Set<string>>();
    #mutationCallback: MutationCallback | undefined;
    #rootNode: WeakRef<Node> | undefined;
    #importsLoaded = false;
    #mediaQueryCleanup?: () => void;
    #rootSizeCleanup?: () => void;
    #intersectionCleanup?: () => void;
    #connectionCleanup?: () => void;
    #intersectionObserver?: IntersectionObserver;
    #mediaMatches: boolean = true;
    #rootSizeMatches: boolean = true;
    #connectionMatches: boolean = true;
    #asgMtSource: Record<string, any> | undefined;
    #asgDisMtSource: Record<string, any> | undefined;
    #stageMtSource: Record<string, any> | undefined;
    #stageReversals = new WeakMap<Element, Record<string, any>>();
    #assignTentatively: typeof AssignTentativelyType | undefined;
    #elementNotifiers = new WeakMap<Element, EventTarget>();
    #notifierMountedElements = new WeakSet<Element>();
    #subObservers: Map<string, MountObserver> | undefined;

    #mergeHandlerDefaults(config: MountConfig): MountConfig {
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
        const handlerDefaults: Partial<MountConfig> = {};
        const proto = HandlerClass as any;
        
        // Get all static properties
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key !== 'prototype' && key !== 'length' && key !== 'name') {
                handlerDefaults[key as keyof MountConfig] = proto[key];
            }
        }
        
        // Merge: handler defaults first, then inline config (inline trumps)
        // Using object spread - inline config overwrites handler defaults
        return { ...handlerDefaults, ...config };
    }

    constructor(config: MountConfig<TKeys>, options: MountObserverOptions = {}) {
        super();
        
        // Merge handler defaults if do is a string reference
        const mergedConfig = this.#mergeHandlerDefaults(config);
        
        this.#init = mergedConfig;
        this.#options = options;
        this.#abortController = new AbortController();

        const {
            assignOnMount, assignOnDismount, stageOnMount, do: doValue, loadingEagerness,
            import: imp, configFrom
        } = mergedConfig;
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

        // Load configFrom modules if specified
        if (configFrom !== undefined) {
            this.#configFromPromise = this.#loadConfigFrom();
        }

        // Start loading imports if eager
        if (loadingEagerness === 'eager' && imp) {
            this.#loadImports();
        }
    }
    
    #validateDoHandlers(): void {
        const doValue = this.#init.do;
        if (doValue === undefined) return;
        
        const handlers = Array.isArray(doValue) ? doValue : [doValue];
        
        for (const handler of handlers) {
            if (typeof handler === 'string') {
                if (!MountObserver.#handlerRegistry.has(handler)) {
                    throw new Error(`No handler defined for ${handler}`);
                }
            }
        }
    }

    /**
     * Loads configuration from external modules specified in configFrom property.
     * Merges multiple configs left-to-right, with inline config taking final precedence.
     */
    async #loadConfigFrom(): Promise<void> {
        const { configFrom } = this.#init;
        if (!configFrom) return;

        // Normalize to array
        const configPaths = Array.isArray(configFrom) ? configFrom : [configFrom];

        // Check for duplicates
        const pathSet = new Set<string>();
        for (const path of configPaths) {
            if (pathSet.has(path)) {
                throw new Error(`Duplicate configFrom module: '${path}'`);
            }
            pathSet.add(path);
        }

        // Load all modules
        const loadedConfigs: MountConfig[] = [];
        for (const path of configPaths) {
            try {
                const module = await import(path);

                if (!module.mountConfig) {
                    throw new Error(`Module '${path}' does not export 'mountConfig'`);
                }

                if (typeof module.mountConfig !== 'object' || module.mountConfig === null) {
                    throw new Error(`Module '${path}' exports invalid mountConfig: must be an object`);
                }

                loadedConfigs.push(module.mountConfig);
            } catch (error) {
                // Re-throw with better context if it's not already our error
                if (error instanceof Error && !error.message.includes(path)) {
                    throw new Error(`Failed to load config from '${path}': ${error.message}`);
                }
                throw error;
            }
        }

        // Merge configs: loaded configs first (left-to-right), then inline config
        // Save the original inline config
        const inlineConfig = { ...this.#init };

        // Start with empty object, merge all loaded configs, then merge inline
        let mergedConfig: MountConfig = {};
        for (const loadedConfig of loadedConfigs) {
            mergedConfig = Object.assign(mergedConfig, loadedConfig);
        }

        // Inline config takes final precedence
        mergedConfig = Object.assign(mergedConfig, inlineConfig);

        // Update the init config with merged result
        this.#init = mergedConfig;
    }

    /**
     * Creates and initializes sub-observers from the `with` property.
     * Each sub-observer observes the same root node as the parent.
     * Sub-observers are stored in #subObservers Map for lifecycle management.
     */
    async #createSubObservers(rootNode: Node): Promise<void> {
        const withConfig = this.#init.with;
        if (!withConfig) return;
        
        this.#subObservers = new Map();
        
        for (const [key, subConfig] of Object.entries(withConfig)) {
            const subObserver = new MountObserver(subConfig as MountConfig);
            this.#subObservers.set(key, subObserver);
            await subObserver.observe(rootNode);
        }
    }

    
    
    
    async #setupMediaQuery(): Promise<void> {
        if (!this.#rootNode) {
            throw new Error('Cannot setup media query before observe() is called');
        }
        
        const { setupMediaQuery } = await import('./mediaQuery.js');
        const result = setupMediaQuery(
            this.#init,
            this.#rootNode,
            this.#mountedElements,
            this.#modules,
            this,
            (node) => this.#processNode(node)
        );
        
        this.#mediaMatches = result.mediaMatches;
        this.#mediaQueryCleanup = result.cleanup;
    }

    async #setupRootSizeObserver(): Promise<void> {
        if (!this.#rootNode) {
            throw new Error('Cannot setup root size observer before observe() is called');
        }
        
        const { setupRootSizeObserver } = await import('./rootSizeObserver.js');
        const result = setupRootSizeObserver(
            this.#init,
            this.#rootNode,
            this.#mountedElements,
            this.#modules,
            this,
            (node) => this.#processNode(node)
        );
        
        this.#rootSizeMatches = result.conditionMatches;
        this.#rootSizeCleanup = result.cleanup;
    }

    async #setupElementIntersection(): Promise<void> {
        if (!this.#rootNode) {
            throw new Error('Cannot setup element intersection before observe() is called');
        }
        
        const { setupElementIntersection } = await import('./elementIntersection.js');
        const result = setupElementIntersection(
            this.#init,
            this.#rootNode,
            this.#mountedElements,
            this.#modules,
            this,
            (element) => this.#matchesSelector(element),
            (element) => this.#handleMatch(element)
        );
        
        this.#intersectionObserver = result.intersectionObserver;
        this.#intersectionCleanup = result.cleanup;
    }

    async #setupConnectionMonitor(): Promise<void> {
        if (!this.#rootNode) {
            throw new Error('Cannot setup connection monitor before observe() is called');
        }
        
        const { setupConnectionMonitor } = await import('./connectionMonitor.js');
        const result = setupConnectionMonitor(
            this.#init,
            this.#rootNode,
            this.#mountedElements,
            this.#modules,
            this,
            (node) => this.#processNode(node)
        );
        
        this.#connectionMatches = result.conditionMatches;
        this.#connectionCleanup = result.cleanup;
    }

    get disconnectedSignal(): AbortSignal {
        return this.#abortController.signal;
    }

    get mountedElements(): Element[] {
        const elements: Element[] = [];
        for (const ref of this.#mountedElements.setWeak) {
            const element = ref.deref();
            if (element !== undefined) {
                elements.push(element);
            }
        }
        return elements;
    }

    getNotifier(element: Element): EventTarget {
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
     * Begins observing elements within the provided node.
     * 
     * @param observedNode - The node to observe for matching elements. This is the root
     *                       of the observation scope where the mutation observer will be
     *                       registered. All matching elements within this node (and its
     *                       descendants) will trigger mount callbacks.
     *                       
     *                       Common values:
     *                       - `document` - Observe the entire document
     *                       - `element` - Observe a specific subtree
     *                       - `shadowRoot` - Observe within a shadow DOM
     */
    async observe(observedNode: Node): Promise<void> {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }
        
        // Wait for configFrom loading to complete if it was started
        if (this.#configFromPromise) {
            await this.#configFromPromise;
        }
        
        if(this.#asgMtSource || this.#asgDisMtSource){
            await import('assign-gingerly/object-extension.js');
        }
        if(this.#stageMtSource){
            const { assignTentatively } = await import('assign-gingerly/assignTentatively.js');
            this.#assignTentatively = assignTentatively;
        }

        this.#rootNode = new WeakRef(observedNode);

        // Create sub-observers from `with` property
        await this.#createSubObservers(observedNode);

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
            this.#processNode(observedNode);
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
                            this.#handleRemoval(node as Element);
                        }
                    });
                }
            }
        };

        const observerConfig: MutationObserverInit = {
            childList: true,
            subtree: true
        };

        // Register with shared mutation observer
        registerSharedObserver(observedNode, this.#mutationCallback, observerConfig);
    }

    disconnect(): void {
        const rootNode = this.#rootNode?.deref();
        
        // Disconnect all sub-observers first (recursive)
        if (this.#subObservers) {
            for (const subObserver of this.#subObservers.values()) {
                subObserver.disconnect();
            }
            this.#subObservers.clear();
            this.#subObservers = undefined;
        }
        
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

    async #loadImports(): Promise<void> {
        if (this.#importsLoaded || !this.#init.import) {
            return;
        }

        // Dynamically load the import utilities only when needed
        const { loadImports } = await import('./loadImports.js');
        this.#modules = await loadImports(this.#init.import);
        this.#importsLoaded = true;

        this.dispatchEvent(new LoadEvent(this.#modules, this.#init));
    }

    #processNode(node: Node): void {
        // If it's an element node, check if it matches
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // If intersection observer is active, start observing the element
            // The intersection callback will handle mounting when it intersects
            if (this.#intersectionObserver) {
                this.#intersectionObserver.observe(element);
            } else if (this.#matchesSelector(element)) {
                this.#handleMatch(element);
            }
        }

        // Process children
        if ('querySelectorAll' in node && this.#init.matching) {
            const root = node as DocumentFragment;
            
            // Get all elements matching the CSS selector first
            const matches = root.querySelectorAll(this.#init.matching);
            matches.forEach(child => {
                // If intersection observer is active, start observing the element
                if (this.#intersectionObserver) {
                    this.#intersectionObserver.observe(child);
                } else if (this.#matchesSelector(child)) {
                    this.#handleMatch(child);
                }
            });
        }
    }

    #matchesSelector(element: Element): boolean {
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
                const registriesMatch = (rootNode as any).customElementRegistry === (element as any).customElementRegistry;
                
                // If whereDifferentCustomElementRegistry is true, exclude matching registries
                if (this.#init.whereDifferentCustomElementRegistry) {
                    if (registriesMatch) return false;
                } else {
                    // Default behavior: exclude non-matching registries
                    if (!registriesMatch) return false;
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

            // Check whereLocalNameMatches condition if specified
            if (this.#init.whereLocalNameMatches) {
                const pattern = typeof this.#init.whereLocalNameMatches === 'string' 
                    ? new RegExp(this.#init.whereLocalNameMatches)
                    : this.#init.whereLocalNameMatches;
                
                if (!pattern.test(element.localName)) {
                    return false;
                }
            }

            // All conditions passed
            return true;
        }


    async #handleMatch(element: Element): Promise<void> {
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

        const context: MountContext<TKeys> = {
            modules: this.#modules,
            observer: this,
            rootNode,
            mountConfig: this.#init,
        };
        
        // Add withObservers if sub-observers exist
        if (this.#subObservers && this.#subObservers.size > 0) {
            context.withObservers = {} as {[K in TKeys]: IMountObserver};
            for (const [key, subObserver] of this.#subObservers.entries()) {
                (context.withObservers as any)[key] = subObserver;
            }
        }

        // Check shouldMount condition if specified (final gate before mounting)
        if (this.#init.shouldMount) {
            try {
                const shouldMount = this.#init.shouldMount(element, context);
                if (!shouldMount) {
                    // shouldMount returned false - don't mount this element
                    // Remove from processed set so it can be re-evaluated later
                    this.#processedDoForElement.delete(element);
                    // Remove from mounted elements tracking
                    this.#mountedElements.weakSet.delete(element);
                    for (const ref of this.#mountedElements.setWeak) {
                        if (ref.deref() === element) {
                            this.#mountedElements.setWeak.delete(ref);
                            break;
                        }
                    }
                    return;
                }
            } catch (error) {
                // shouldMount threw an error - treat as false and log
                console.error('shouldMount check failed:', error);
                // Remove from processed set so it can be re-evaluated later
                this.#processedDoForElement.delete(element);
                // Remove from mounted elements tracking
                this.#mountedElements.weakSet.delete(element);
                for (const ref of this.#mountedElements.setWeak) {
                    if (ref.deref() === element) {
                        this.#mountedElements.setWeak.delete(ref);
                        break;
                    }
                }
                return;
            }
        }

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
                } else if (typeof handler === 'function') {
                    // Inline function
                    handler(element, context);
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
    
    async assignGingerly(config: Record<string, any> | undefined): Promise<void> {
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
        } else {
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

    async #handleRemoval(element: Element): Promise<void> {
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

        const context: MountContext<TKeys> = {
            modules: this.#modules,
            observer: this,
            rootNode,
            mountConfig: this.#init,
        };
        
        // Add withObservers if sub-observers exist
        if (this.#subObservers && this.#subObservers.size > 0) {
            context.withObservers = {} as {[K in TKeys]: IMountObserver};
            for (const [key, subObserver] of this.#subObservers.entries()) {
                (context.withObservers as any)[key] = subObserver;
            }
        }


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
