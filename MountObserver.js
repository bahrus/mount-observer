import { MountEvent, DismountEvent, DisconnectEvent, LoadEvent, AttrChangeEvent, } from './Events.js';
import { registerSharedObserver, unregisterSharedObserver } from './SharedMutationObserver.js';
import { whereOutside } from './whereOutside.js';
export class MountObserver extends EventTarget {
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
    #assignGingerlySource;
    constructor(init, options = {}) {
        super();
        this.#init = init;
        this.#options = options;
        this.#abortController = new AbortController();
        // Make a copy of assignGingerly config using structuredClone
        if (init.assignGingerly !== undefined) {
            this.#assignGingerlySource = structuredClone(init.assignGingerly);
        }
        if (options.disconnectedSignal) {
            options.disconnectedSignal.addEventListener('abort', () => {
                this.disconnect();
            });
        }
        // Preload whereAttr utilities if needed
        if (init.whereAttr) {
            this.#preloadWhereAttrUtilities();
        }
        // Start loading imports if eager
        if (init.loadingEagerness === 'eager' && init.import) {
            this.#loadImports();
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
            const constructors = Array.isArray(this.#init.whereInstanceOf)
                ? this.#init.whereInstanceOf
                : [this.#init.whereInstanceOf];
            // Element must be an instance of at least one constructor (OR logic for array)
            const matchesInstanceOf = constructors.some(constructor => element instanceof constructor);
            if (!matchesInstanceOf) {
                return false;
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
        if (this.#assignGingerlySource) {
            const { assignGingerly } = await import('assign-gingerly/index.js');
            assignGingerly(element, this.#assignGingerlySource);
        }
        // Call do callback
        if (this.#init.do) {
            if (typeof this.#init.do === 'function') {
                this.#init.do(element, context);
            }
            else if (this.#init.do.mount) {
                this.#init.do.mount(element, context);
            }
        }
        // Dispatch mount event
        this.dispatchEvent(new MountEvent(element, this.#modules, this.#init));
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
            }
        }
    }
    async assignGingerly(config) {
        // Handle undefined case
        if (config === undefined) {
            this.#assignGingerlySource = undefined;
            return;
        }
        const { assignGingerly } = await import('assign-gingerly/index.js');
        // Update the source config for future mounted elements
        if (this.#assignGingerlySource === undefined) {
            // No existing config, just clone the passed in object
            this.#assignGingerlySource = structuredClone(config);
        }
        else {
            // Merge into existing config using assignGingerly
            assignGingerly(this.#assignGingerlySource, config);
        }
        // Apply to already mounted elements using setWeak for iteration
        for (const ref of this.#mountedElements.setWeak) {
            const element = ref.deref();
            if (element) {
                assignGingerly(element, config);
            }
        }
    }
    #handleRemoval(element) {
        if (!this.#mountedElements.weakSet.has(element)) {
            return;
        }
        // Remove from both structures
        this.#mountedElements.weakSet.delete(element);
        for (const ref of this.#mountedElements.setWeak) {
            if (ref.deref() === element) {
                this.#mountedElements.setWeak.delete(ref);
                break;
            }
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
        // Call dismount callback
        if (this.#init.do && typeof this.#init.do !== 'function' && this.#init.do.dismount) {
            this.#init.do.dismount(element, context);
        }
        // Dispatch dismount event
        this.dispatchEvent(new DismountEvent(element, 'where-element-matches-failed', this.#init));
        // Check if element is being moved within the same root
        // If it's truly disconnected, dispatch disconnect event
        setTimeout(() => {
            if (!rootNode.contains(element)) {
                if (this.#init.do && typeof this.#init.do !== 'function' && this.#init.do.disconnect) {
                    this.#init.do.disconnect(element, context);
                }
                this.dispatchEvent(new DisconnectEvent(element, this.#init));
            }
        }, 0);
    }
}
