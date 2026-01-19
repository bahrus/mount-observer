import {
    MountInit,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    mountEventName,
    dismountEventName,
    disconnectEventName,
    loadEventName
} from './types.js';

export class MountObserver extends EventTarget implements IMountObserver {
    #init: MountInit;
    #options: MountObserverOptions;
    #abortController: AbortController;
    #modules: any[] = [];
    #mountedElements = new WeakSet<Element>();
    #processedElements = new WeakSet<Element>();
    #mutationObserver: MutationObserver | undefined;
    #rootNode: WeakRef<Node> | undefined;
    #importsLoaded = false;

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

        // Start loading imports if eager
        if (init.loadingEagerness === 'eager' && init.import) {
            this.#loadImports();
        }
    }

    get disconnectedSignal(): AbortSignal {
        return this.#abortController.signal;
    }

    observe(rootNode: Node): void {
        if (this.#rootNode) {
            throw new Error('Already observing');
        }

        this.#rootNode = new WeakRef(rootNode);

        // Process existing elements
        this.#processNode(rootNode);

        // Set up mutation observer
        this.#mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.#processNode(node);
                        }
                    });
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.#handleRemoval(node as Element);
                        }
                    });
                }
            }
        });

        this.#mutationObserver.observe(rootNode, {
            childList: true,
            subtree: true
        });
    }

    disconnect(): void {
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
            this.#mutationObserver = undefined;
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

        this.dispatchEvent(new CustomEvent(loadEventName, {
            detail: { modules: this.#modules }
        }));
    }

    #processNode(node: Node): void {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const element = node as Element;
        
        if (this.#matchesSelector(element)) {
            this.#handleMatch(element);
        }

        // Process children
        element.querySelectorAll('*').forEach(child => {
            if (this.#matchesSelector(child)) {
                this.#handleMatch(child);
            }
        });
    }

    #matchesSelector(element: Element): boolean {
        return element.matches(this.#init.whereElementMatches);
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

        // Call do callback
        if (this.#init.do) {
            if (typeof this.#init.do === 'function') {
                this.#init.do(element, context);
            } else if (this.#init.do.mount) {
                this.#init.do.mount(element, context);
            }
        }

        // Dispatch mount event
        this.dispatchEvent(new CustomEvent(mountEventName, {
            detail: {
                matchingElement: element,
                modules: this.#modules
            }
        }));
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
        this.dispatchEvent(new CustomEvent(dismountEventName, {
            detail: {
                matchingElement: element
            }
        }));

        // Check if element is being moved within the same root
        // If it's truly disconnected, dispatch disconnect event
        setTimeout(() => {
            if (!rootNode.contains(element)) {
                if (this.#init.do && typeof this.#init.do !== 'function' && this.#init.do.disconnect) {
                    this.#init.do.disconnect(element, context);
                }

                this.dispatchEvent(new CustomEvent(disconnectEventName, {
                    detail: {
                        matchingElement: element
                    }
                }));
            }
        }, 0);
    }
}
