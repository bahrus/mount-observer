import { splitRefs } from './splitRefs.js';
import { MountObserver } from '../MountObserver.js';
const proxies = new WeakMap();
const refLookup = new WeakMap();
Object.defineProperty(Element.prototype, 'refs', {
    get() {
        if (!proxies.has(this)) {
            const handler = {
                get(target, prop) {
                    console.log({ target, prop });
                    let lookup;
                    if (refLookup.has(target.constructor)) {
                        lookup = refLookup.get(target.constructor);
                    }
                    else {
                        lookup = new Map();
                        refLookup.set(target.constructor, lookup);
                    }
                    if (lookup.has(prop)) {
                        return lookup.get(prop);
                    }
                    else {
                        const refManager = new RefManager(this, prop);
                        lookup.set(prop, refManager);
                        return refManager;
                    }
                    //return Reflect.get(target, prop);
                },
            };
            proxies.set(this, new Proxy(this, handler));
        }
        return proxies.get(this);
    }
});
class RefManager extends EventTarget {
    prop;
    #el;
    #refs;
    constructor(el, prop) {
        super();
        this.prop = prop;
        this.#el = new WeakRef(el);
    }
    get elements() {
        if (this.#refs !== undefined) {
            const el = this.#el.deref();
            if (el === undefined)
                return [];
            const attr = el.getAttribute(this.prop);
            if (!attr)
                return [];
            const refIds = splitRefs(attr);
            const qry = refIds.map(id => `#id`).join(', ');
            const rn = el.getRootNode();
            const refsArr = Array.from(rn.querySelectorAll(qry));
            const refs = new Map();
            for (const ref of refsArr) {
                refs.set(ref.id, new WeakRef(ref));
            }
            this.#refs = refs;
            const mo = new MountObserver({
                on: qry,
                do: {
                    mount: (el) => {
                        const id = el.id;
                        if (id && !this.#refs?.has(id)) {
                            this.#refs?.set(id, new WeakRef(el));
                            this.dispatchEvent(new RefEvent([el], []));
                        }
                    },
                    dismount: (el) => {
                        const id = el.id;
                        if (id && this.#refs?.has(id)) {
                            this.#refs?.delete(id);
                            this.dispatchEvent(new RefEvent([], [el]));
                        }
                    }
                }
            });
            mo.observe(rn);
            this.dispatchEvent(new RefEvent((refsArr), []));
        }
        return this.#refs?.values().map(ref => ref.deref()).filter(el => el !== undefined) || [];
    }
}
export class RefEvent extends Event {
    addedRefs;
    removedRefs;
    static eventName = 'ref';
    constructor(addedRefs, removedRefs) {
        super(RefEvent.eventName);
        this.addedRefs = addedRefs;
        this.removedRefs = removedRefs;
    }
}
