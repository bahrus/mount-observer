import { mountEventName, dismountEventName, disconnectEventName, loadEventName } from './types.js';
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
        this.#rootNode = rootNode;
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
        const imports = Array.isArray(this.#init.import)
            ? this.#init.import
            : [this.#init.import];
        const promises = imports.map(imp => this.#loadSingleImport(imp));
        this.#modules = await Promise.all(promises);
        this.#importsLoaded = true;
        this.dispatchEvent(new CustomEvent(loadEventName, {
            detail: { modules: this.#modules }
        }));
    }
    async #loadSingleImport(imp) {
        let url;
        let type = 'js';
        if (typeof imp === 'string') {
            url = imp;
        }
        else if (Array.isArray(imp)) {
            url = imp[0];
            type = imp[1]?.type || 'js';
        }
        else {
            url = imp.url;
            type = imp.type || 'js';
        }
        switch (type) {
            case 'css':
                return this.#loadCSS(url);
            case 'json':
                return this.#loadJSON(url);
            case 'html':
                return this.#loadHTML(url);
            default:
                return import(url);
        }
    }
    async #loadCSS(url) {
        const response = await fetch(url);
        const text = await response.text();
        const sheet = new CSSStyleSheet();
        await sheet.replace(text);
        return sheet;
    }
    async #loadJSON(url) {
        const response = await fetch(url);
        return response.json();
    }
    async #loadHTML(url) {
        const response = await fetch(url);
        return response.text();
    }
    #processNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        const element = node;
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
        const context = {
            modules: this.#modules,
            observer: this,
            observeInfo: {
                rootNode: this.#rootNode
            }
        };
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
        this.dispatchEvent(new CustomEvent(mountEventName, {
            detail: {
                matchingElement: element,
                modules: this.#modules
            }
        }));
    }
    #handleRemoval(element) {
        if (!this.#mountedElements.has(element)) {
            return;
        }
        this.#mountedElements.delete(element);
        const context = {
            modules: this.#modules,
            observer: this,
            observeInfo: {
                rootNode: this.#rootNode
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
            if (!this.#rootNode?.contains(element)) {
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
