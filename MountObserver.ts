import {
    MountInit,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    AttrChange
} from './types.js';
import {
    MountEvent,
    DismountEvent,
    DisconnectEvent,
    LoadEvent,
    AttrChangeEvent
} from './Events.js';
import {
    registerSharedObserver,
    unregisterSharedObserver,
    type MutationCallback
} from './SharedMutationObserver.js';

export class MountObserver extends EventTarget implements IMountObserver {
    #init: MountInit;
    #options: MountObserverOptions;
    #abortController: AbortController;
    #modules: any[] = [];
    #mountedElements = new WeakSet<Element>();
    #processedElements = new WeakSet<Element>();
    #mutationCallback: MutationCallback | undefined;
    #rootNode: WeakRef<Node> | undefined;
    #importsLoaded = false;
    #elementAttrStates = new WeakMap<Element, Map<string, string | null>>();
    #matchesWhereAttrFn: ((element: Element, whereAttr: any) => boolean) | null = null;
    #buildAttrCoordinateMapFn: ((whereAttr: any, isCustomElement: boolean) => any) | null = null;

    constructor(init: MountInit, options: MountObserverOptions = {}) {
        super();
        this.#init = init;
        this.#options = options;
        this.#abortController = new AbortController();

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
    
    async #preloadWhereAttrUtilities(): Promise<void> {
        if (!this.#matchesWhereAttrFn) {
            const { matchesWhereAttr } = await import('./whereAttr.js');
            this.#matchesWhereAttrFn = matchesWhereAttr;
        }
        if (!this.#buildAttrCoordinateMapFn) {
            const { buildAttrCoordinateMap } = await import('./attrCoordinates.js');
            this.#buildAttrCoordinateMapFn = buildAttrCoordinateMap;
        }
    }

    get disconnectedSignal(): AbortSignal {
        return this.#abortController.signal;
    }

    async observe(rootNode: Node): Promise<void> {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }

        this.#rootNode = new WeakRef(rootNode);

        // Wait for whereAttr utilities to load if needed
        if (this.#init.whereAttr && !this.#matchesWhereAttrFn) {
            await this.#preloadWhereAttrUtilities();
        }
        
        // Process existing elements
        this.#processNode(rootNode);

        // Create mutation callback
        this.#mutationCallback = (mutations) => {
            const attrChanges: AttrChange[] = [];
            
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
                } else if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
                    // Handle attribute changes for mounted elements
                    const element = mutation.target as Element;
                    if (this.#mountedElements.has(element) && this.#init.whereAttr) {
                        const changes = this.#checkAttrChanges(element);
                        attrChanges.push(...changes);
                    }
                }
            }
            
            // Batch and dispatch attribute changes
            if (attrChanges.length > 0) {
                this.dispatchEvent(new AttrChangeEvent(attrChanges));
            }
        };

        const observerConfig: MutationObserverInit = {
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

    disconnect(): void {
        const rootNode = this.#rootNode?.deref();
        
        // Unregister from shared mutation observer
        if (rootNode && this.#mutationCallback) {
            unregisterSharedObserver(rootNode, this.#mutationCallback);
            this.#mutationCallback = undefined;
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

        this.dispatchEvent(new LoadEvent(this.#modules));
    }

    #processNode(node: Node): void {
        // If it's an element node, check if it matches
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            if (this.#matchesSelector(element)) {
                this.#handleMatch(element);
            }
        }

        // Process children
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
            const root = node as Element | Document;
            
            // Get all elements matching the CSS selector first
            root.querySelectorAll(this.#init.whereElementMatches).forEach(child => {
                if (this.#matchesSelector(child)) {
                    this.#handleMatch(child);
                }
            });
        }
    }

    #matchesSelector(element: Element): boolean {
        // Check whereElementMatches condition
        const matchesElement = element.matches(this.#init.whereElementMatches);
        
        if (!matchesElement) {
            return false;
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

    async #handleMatch(element: Element): Promise<void> {
        if (this.#processedElements.has(element)) {
            return;
        }

        // Load imports if not already loaded
        if (!this.#importsLoaded && this.#init.import) {
            await this.#loadImports();
        }

        this.#processedElements.add(element);
        this.#mountedElements.add(element);

        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Root node was garbage collected
            return;
        }

        const context: MountContext = {
            modules: this.#modules,
            observer: this,
            observeInfo: {
                rootNode
            }
        };

        // Apply assignGingerly if specified
        if (this.#init.assignGingerly) {
            const { assignGingerly } = await import('assign-gingerly/index.js');
            assignGingerly(element, this.#init.assignGingerly);
        }

        // Call do callback
        if (this.#init.do) {
            if (typeof this.#init.do === 'function') {
                this.#init.do(element, context);
            } else if (this.#init.do.mount) {
                this.#init.do.mount(element, context);
            }
        }

        // Dispatch mount event
        this.dispatchEvent(new MountEvent(element, this.#modules));
        
        // Check for initial attribute changes if whereAttr is configured
        if (this.#init.whereAttr) {
            const changes = this.#checkAttrChanges(element);
            if (changes.length > 0) {
                this.dispatchEvent(new AttrChangeEvent(changes));
            }
        }
    }
    
    #checkAttrChanges(element: Element): AttrChange[] {
        if (!this.#init.whereAttr || !this.#buildAttrCoordinateMapFn) {
            return [];
        }
        
        const isCustomElement = element.tagName.toLowerCase().includes('-');
        const attrCoordMap = this.#buildAttrCoordinateMapFn(this.#init.whereAttr, isCustomElement);
        
        // Get or create the attribute state for this element
        let attrState = this.#elementAttrStates.get(element);
        if (!attrState) {
            attrState = new Map<string, string | null>();
            this.#elementAttrStates.set(element, attrState);
        }
        
        const changes: AttrChange[] = [];
        const currentAttrs = new Set<string>();
        
        // Check all possible attributes from the coordinate map
        for (const attrName of Object.keys(attrCoordMap)) {
            const coordinate = attrCoordMap[attrName];
            const currentValue = element.getAttribute(attrName);
            const previousValue = attrState.get(attrName);
            
            if (currentValue !== null) {
                currentAttrs.add(attrName);
            }
            
            // Include if: currently has value OR previously had value but now removed
            if (currentValue !== null || (previousValue !== undefined && currentValue === null)) {
                // Check if value changed
                if (currentValue !== previousValue) {
                    const attrNode = currentValue !== null ? element.getAttributeNode(attrName) : null;
                    const mapEntry = this.#init.map?.[coordinate] || null;
                    
                    changes.push({
                        value: currentValue,
                        attrNode,
                        mapEntry,
                        attrName,
                        coordinate,
                        element
                    });
                    
                    // Update state
                    if (currentValue !== null) {
                        attrState.set(attrName, currentValue);
                    } else {
                        attrState.delete(attrName);
                    }
                }
            }
        }
        
        return changes;
    }

    #handleRemoval(element: Element): void {
        if (!this.#mountedElements.has(element)) {
            return;
        }

        this.#mountedElements.delete(element);

        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Root node was garbage collected
            return;
        }

        const context: MountContext = {
            modules: this.#modules,
            observer: this,
            observeInfo: {
                rootNode
            }
        };

        // Call dismount callback
        if (this.#init.do && typeof this.#init.do !== 'function' && this.#init.do.dismount) {
            this.#init.do.dismount(element, context);
        }

        // Dispatch dismount event
        this.dispatchEvent(new DismountEvent(element));

        // Check if element is being moved within the same root
        // If it's truly disconnected, dispatch disconnect event
        setTimeout(() => {
            if (!rootNode.contains(element)) {
                if (this.#init.do && typeof this.#init.do !== 'function' && this.#init.do.disconnect) {
                    this.#init.do.disconnect(element, context);
                }

                this.dispatchEvent(new DisconnectEvent(element));
            }
        }, 0);
    }
}
