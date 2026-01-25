import { MountEvent, DismountEvent, DisconnectEvent, LoadEvent } from './Events.js';
export class MountObserver extends EventTarget {
    #init;
    #options;
    #abortController;
    #modules = [];
    #mountedElements = new WeakSet();
    #processedElements = new WeakSet();
    #mutationObserver;
    #rootNode;
    #importsLoaded = false;
    constructor(init, options = {}) {
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
    get disconnectedSignal() {
        return this.#abortController.signal;
    }
    observe(rootNode) {
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
                            this.#handleRemoval(node);
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
    disconnect() {
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
            this.#mutationObserver = undefined;
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
        this.dispatchEvent(new LoadEvent(this.#modules));
    }
    #processNode(node) {
        // If it's an element node, check if it matches
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (this.#matchesSelector(element)) {
                this.#handleMatch(element);
            }
        }
        // Process children using native selector engine
        // This works for both Document and Element nodes
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_NODE) {
            const root = node;
            root.querySelectorAll(this.#init.whereElementMatches).forEach(child => {
                this.#handleMatch(child);
            });
        }
    }
    #matchesSelector(element) {
        return element.matches(this.#init.whereElementMatches);
    }
    async #handleMatch(element) {
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
        const context = {
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
            }
            else if (this.#init.do.mount) {
                this.#init.do.mount(element, context);
            }
        }
        // Dispatch mount event
        this.dispatchEvent(new MountEvent(element, this.#modules));
    }
    #handleRemoval(element) {
        if (!this.#mountedElements.has(element)) {
            return;
        }
        this.#mountedElements.delete(element);
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Root node was garbage collected
            return;
        }
        const context = {
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
