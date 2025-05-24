export { waitForEvent } from './waitForEvent.js';
import { ObsAttr } from './ObsAttr.js';
import { splitRefs } from './refid/splitRefs.js';
import { getIsh } from './refid/getIsh.js';
import { arr } from './refid/secretKeys.js';
export const attached = Symbol.for('xyyspnstnU+CDrNVa0VnxA');
export class Newish {
    queue = [];
    isResolved = false;
    #ce;
    #ref;
    //#assigner: undefined | Assigner = undefined;
    #options;
    constructor(enhancedElement, target, itemscope, options) {
        this.#options = options || { assigner: Object.assign };
        this.#ref = new WeakRef(enhancedElement);
        this.#do(enhancedElement, target, itemscope);
    }
    handleEvent(event) {
        const enhancedElement = this.#ref.deref();
        if (!enhancedElement)
            return;
        this.#attachItemrefs(enhancedElement);
    }
    async #do(enhancedElement, target, itemscope) {
        if (enhancedElement[attached] === true)
            return;
        enhancedElement[attached] = true;
        const options = this.#options;
        const { initPropVals, ctr } = options;
        let ce;
        if (ctr === undefined) {
            const foundCtr = await getIsh(enhancedElement.isConnected ? enhancedElement : target, itemscope);
            const initPropVals = enhancedElement['ish'];
            // if(enhancedElement instanceof HTMLElement){
            //     if(enhancedElement.dataset.ish){
            //         const parsedHostProps = JSON.parse(enhancedElement.dataset.ish);
            //         this.queue.push(parsedHostProps);
            //     }
            // }
            const resolvedConstructor = foundCtr.constructor.name === 'AsyncFunction' ? await foundCtr() : foundCtr;
            const isInstance = initPropVals instanceof resolvedConstructor;
            ce = isInstance ? initPropVals : new resolvedConstructor();
            if (initPropVals !== undefined && !isInstance)
                this.queue.push(initPropVals);
        }
        else {
            ce = new ctr();
            if (initPropVals !== undefined)
                this.queue.push(initPropVals);
        }
        if ('<mount>' in ce && typeof ce['<mount>'] === 'function') {
            await ce['<mount>'](ce, enhancedElement, this.#options);
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
                self.queue.push(nv);
                self.#assignGingerly(false);
            },
            enumerable: true,
            configurable: true,
        });
        this.#assignGingerly(true);
        //attach any itemref references
        this.#attachItemrefs(enhancedElement);
        const et = ObsAttr(enhancedElement, 'itemref');
        et.addEventListener('attr-changed', this);
        this.isResolved = true;
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
                    this.#ce['<inScope>'](this.#ce, itemrefElement, this.#options);
                    this.#alreadyAttached.add(id);
                }
            }
        }
    }
    async #assignGingerly(fromDo) {
        const actions = new Set();
        if (fromDo) {
            actions.add('attached');
        }
        let ce = this.#ce;
        if (ce === undefined) {
            throw 500;
        }
        while (this.queue.length > 0) {
            const fi = this.queue.shift();
            //TODO: Provide support for a virtual slice of a very large list
            //TODO:  Maybe should check if iterable rather than an array?
            if (Array.isArray(fi)) {
                let filtered = fi;
                if ('arr=>' in ce && typeof ce['arr=>'] === 'function') {
                    filtered = await ce['arr=>'](ce, fi, this.#options);
                }
                ce[arr] = filtered;
                actions.add('ishListAssigned');
            }
            else {
                const { assigner } = this.#options;
                await assigner(ce, fi);
                actions.add('ishAssigned');
            }
        }
        const ref = this.#ref.deref();
        if (ref) {
            ref.dispatchEvent(new IshEvent(Array.from(actions)));
        }
    }
}
export class IshEvent extends Event {
    actions;
    static eventName = 'ish';
    constructor(actions) {
        super(IshEvent.eventName);
        this.actions = actions;
    }
}
