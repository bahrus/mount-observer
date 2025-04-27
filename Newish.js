export { waitForEvent } from './waitForEvent.js';
export class Newish {
    queue = [];
    isResolved = false;
    #ce;
    //#assigner: undefined | Assigner = undefined;
    #options;
    constructor(enhancedElement, itemscope, options) {
        this.#options = options || { assigner: Object.assign };
        this.#do(enhancedElement, itemscope);
    }
    async #do(enhancedElement, itemscope) {
        //if(Object.hasOwn(enhancedElement, 'host')) return;
        await customElements.whenDefined(itemscope);
        const initPropVals = enhancedElement['ish'];
        //check to make sure it didn't already get attached while waiting
        if (initPropVals === undefined || customElements.getName(initPropVals.constructor) !== itemscope) {
            if (enhancedElement instanceof HTMLElement) {
                if (enhancedElement.dataset.ish) {
                    const parsedHostProps = JSON.parse(enhancedElement.dataset.ish);
                    this.queue.push(parsedHostProps);
                }
            }
            if (initPropVals !== undefined)
                this.queue.push(initPropVals);
            const ce = document.createElement(itemscope);
            if ('attachedCallback' in ce && typeof ce.attachedCallback === 'function') {
                await ce.attachedCallback(enhancedElement);
            }
            this.#ce = ce;
            const self = this;
            Object.defineProperty(enhancedElement, 'ish', {
                get() {
                    return self.#ce;
                },
                set(nv) {
                    self.queue.push(nv);
                    self.#assignGingerly();
                },
                enumerable: true,
                configurable: true,
            });
            this.#assignGingerly();
        }
        //attach any itemref references
        if (enhancedElement.hasAttribute('itemref')) {
            const itemref = enhancedElement.getAttribute('itemref');
            const itemrefList = itemref.split(' ');
            let nextSibling = enhancedElement.nextElementSibling;
            while (nextSibling) {
                if (itemrefList.includes(nextSibling.id)) {
                    this.#ce.inScopeCallback(nextSibling);
                    itemrefList.splice(itemrefList.indexOf(nextSibling.id), 1);
                }
                if (itemrefList.length === 0)
                    break;
                nextSibling = nextSibling.nextElementSibling;
            }
            if (itemrefList.length > 0) {
                //TODO add an observer queue for the id found elsewhere
                throw 'NI';
            }
        }
        this.isResolved = true;
        enhancedElement.dispatchEvent(new Event('ishAttached'));
    }
    async #assignGingerly() {
        let ce = this.#ce;
        if (ce === undefined) {
            throw 500;
        }
        //const {assignGingerly} = await import('../lib/assignGingerly.js');
        while (this.queue.length > 0) {
            const fi = this.queue.shift();
            //TODO: Provide support for a virtual slice of a very large list
            if (Array.isArray(fi)) {
                ce.$ = fi;
            }
            else {
                const { assigner } = this.#options;
                await assigner(ce, fi);
            }
        }
    }
}
