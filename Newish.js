export { waitForEvent } from './waitForEvent.js';
import { ObsAttr } from './ObsAttr.js';
import { splitRefs } from './refid/splitRefs.js';
import { getIsh } from './refid/getIsh.js';
export const attached = Symbol.for('xyyspnstnU+CDrNVa0VnxA');
export class Newish {
    queue = [];
    isResolved = false;
    #ce;
    #ref;
    //#assigner: undefined | Assigner = undefined;
    #options;
    constructor(enhancedElement, itemscope, options) {
        this.#options = options || { assigner: Object.assign };
        this.#ref = new WeakRef(enhancedElement);
        this.#do(enhancedElement, itemscope);
    }
    handleEvent(event) {
        const enhancedElement = this.#ref.deref();
        if (!enhancedElement)
            return;
        this.#attachItemrefs(enhancedElement);
    }
    async #do(enhancedElement, itemscope) {
        if (enhancedElement[attached] === true)
            return;
        enhancedElement[attached] = true;
        const ctr = getIsh(enhancedElement, itemscope);
        const initPropVals = enhancedElement['ish'];
        if (enhancedElement instanceof HTMLElement) {
            if (enhancedElement.dataset.ish) {
                const parsedHostProps = JSON.parse(enhancedElement.dataset.ish);
                this.queue.push(parsedHostProps);
            }
        }
        const resolvedConstructor = ctr.constructor.name === 'AsyncFunction' ? await ctr() : ctr;
        const isInstance = initPropVals instanceof resolvedConstructor;
        const ce = isInstance ? initPropVals : new resolvedConstructor();
        if (initPropVals !== undefined && !isInstance)
            this.queue.push(initPropVals);
        if ('<mount>' in ce && typeof ce.mount === 'function') {
            await ce['<mount>'](enhancedElement, this.#options);
        }
        this.#ce = ce;
        const self = this;
        Object.defineProperty(enhancedElement, 'ish', {
            get() {
                return self.#ce;
            },
            set(nv) {
                if (self.#ce === nv)
                    return;
                console.log({ nv });
                self.queue.push(nv);
                self.#assignGingerly();
            },
            enumerable: true,
            configurable: true,
        });
        this.#assignGingerly();
        //attach any itemref references
        this.#attachItemrefs(enhancedElement);
        const et = ObsAttr(enhancedElement, 'itemref');
        et.addEventListener('attr-changed', this);
        this.isResolved = true;
        enhancedElement.dispatchEvent(new Event('ishAttached'));
    }
    #alreadyAttached = new Set();
    #attachItemrefs(enhancedElement) {
        //TODO:  watch for already attached itemrefs to be removed and remove them from the set
        // and call outOfScopeCallback on them
        if ('<inScope>' in this.#ce && enhancedElement.hasAttribute('itemref')) {
            const itemref = enhancedElement.getAttribute('itemref');
            const itemrefList = splitRefs(itemref); // itemref.split(' ').map((id) => id.trim()).filter((id) => id.length > 0);
            if (itemrefList.length === 0)
                return;
            const rn = enhancedElement.getRootNode();
            for (const id of itemrefList) {
                if (this.#alreadyAttached.has(id))
                    continue;
                const itemrefElement = rn.getElementById(id);
                if (itemrefElement) {
                    this.#ce['<inScope>'](itemrefElement, this.#options);
                    this.#alreadyAttached.add(id);
                }
            }
        }
    }
    async #assignGingerly() {
        let ce = this.#ce;
        if (ce === undefined) {
            throw 500;
        }
        while (this.queue.length > 0) {
            const fi = this.queue.shift();
            //TODO: Provide support for a virtual slice of a very large list
            if (Array.isArray(fi)) {
                ce.ishList = fi;
            }
            else {
                const { assigner } = this.#options;
                await assigner(ce, fi);
            }
        }
    }
}
