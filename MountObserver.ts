import {
    MountInit,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    WeakDual,
    EventConfig,
    EventConstructor,
    Constructor
} from './types.js';
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
import { whereOutside } from './whereOutside.js';

export class MountObserver extends EventTarget implements IMountObserver {
    // Static registry for registered handlers
    static #handlerRegistry = new Map<string, Constructor>();
    
    static define(name: string, handler: Constructor): void {
        if (this.#handlerRegistry.has(name)) {
            throw new Error(`${name} already in use`);
        }
        this.#handlerRegistry.set(name, handler);
    }
    
    #init: MountInit;
    #options: MountObserverOptions;
    #abortController: AbortController;
    #modules: any[] = [];
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
    #mediaMatches: boolean = true;
    #asgMtSource: Record<string, any> | undefined;
    #asgDisMtSource: Record<string, any> | undefined;
    #elementNotifiers = new WeakMap<Element, EventTarget>();
    #notifierMountedElements = new WeakSet<Element>();

    constructor(init: MountInit, options: MountObserverOptions = {}) {
        super();
        this.#init = init;
        this.#options = options;
        this.#abortController = new AbortController();

        const {
            assignOnMount, assignOnDismount, do: doValue, reference, loadingEagerness,
            import: imp
        } = init;
        // Make a copy of assignOnMount config using structuredClone
        if (assignOnMount !== undefined) {
            this.#asgMtSource = structuredClone(assignOnMount);
        }
        if (assignOnDismount !== undefined) {
            this.#asgDisMtSource = structuredClone(assignOnDismount);
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
    
    #validateReference(): void {
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

    get disconnectedSignal(): AbortSignal {
        return this.#abortController.signal;
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

    async observe(rootNode: Node): Promise<void> {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }
        if(this.#asgMtSource || this.#asgDisMtSource){
            await import('assign-gingerly/object-extension.js');
        }

        this.#rootNode = new WeakRef(rootNode);

        // Set up media query if specified (needs rootNode to be set first)
        if (this.#init.withMediaMatching) {
            await this.#setupMediaQuery();
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
        registerSharedObserver(rootNode, this.#mutationCallback, observerConfig);
    }

    disconnect(): void {
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

    async #loadImports(): Promise<void> {
        if (this.#importsLoaded || !this.#init.import) {
            return;
        }

        // Dynamically load the import utilities only when needed
        const { loadImports } = await import('./loadImports.js');
        this.#modules = await loadImports(this.#init.import);
        this.#importsLoaded = true;

        // Validate referenced withInstance if reference is specified
        if (this.#init.reference !== undefined) {
            const references = arr(this.#init.reference);

            for (const index of references) {
                const module = this.#modules[index];
                if (module && module.withInstance !== undefined) {
                    // Validate that it's a Constructor or array of Constructors
                    const withInstance = module.withInstance;
                    const constructors = arr(withInstance);
                    
                    for (const constructor of constructors) {
                        if (typeof constructor !== 'function') {
                            throw new Error(`Referenced module at index ${index} exports invalid withInstance: must be a Constructor or array of Constructors`);
                        }
                    }
                }
            }
        }

        this.dispatchEvent(new LoadEvent(this.#modules, this.#init));
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
        if ('querySelectorAll' in node) {
            const root = node as DocumentFragment;
            
            // Get all elements matching the CSS selector first
            root.querySelectorAll(this.#init.withMatching).forEach(child => {
                if (this.#matchesSelector(child)) {
                    this.#handleMatch(child);
                }
            });
        }
    }

    #matchesSelector(element: Element): boolean {
        //TODO:  reduce redundncy with this.#init?
        // Check withMatching condition
        const matchesElement = element.matches(this.#init.withMatching);
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
        
        // Check withInstance condition if specified
        if (this.#init.withInstance) {
            const constructors = arr(this.#init.withInstance);
            
            // Element must be an instance of at least one constructor (OR logic for array)
            const matchesInstanceOf = constructors.some(constructor => element instanceof constructor);
            
            if (!matchesInstanceOf) {
                return false;
            }
        }
        
        // Check referenced withInstance if imports are loaded and reference is specified
        if (this.#importsLoaded && this.#init.reference !== undefined) {
            const references = arr(this.#init.reference);

            for (const index of references) {
                const module = this.#modules[index];
                if (module && module.withInstance !== undefined) {
                    const constructors = arr(module.withInstance);
                    
                    // Element must be an instance of at least one constructor (OR logic within this module)
                    const matchesInstanceOf = constructors.some((constructor: Constructor) => element instanceof constructor);
                    
                    if (!matchesInstanceOf) {
                        return false;
                    }
                }
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

        const context: MountContext = {
            modules: this.#modules,
            observer: this,
            rootNode,
            mountInit: this.#init,
        };

        // Apply assignGingerly if specified
        if (this.#asgMtSource) {
            element.assignGingerly(this.#asgMtSource);
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

        const context: MountContext = {
            modules: this.#modules,
            observer: this,
            rootNode,
            mountInit: this.#init,
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
