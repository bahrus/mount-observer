import { splitRefs } from './splitRefs.js';
import { MountObserver } from '../MountObserver.js';
const proxies = new WeakMap();
const refLookup = new WeakMap();
Object.defineProperty(Element.prototype, 'via', {
    get() {
        if (!proxies.has(this)) {
            const handler = {
                get(target, attr) {
                    let lookup;
                    if (refLookup.has(target)) {
                        lookup = refLookup.get(target);
                    }
                    else {
                        lookup = new Map();
                        refLookup.set(target, lookup);
                    }
                    if (lookup.has(attr)) {
                        return lookup.get(attr);
                    }
                    else {
                        const refManager = new RefManager(target, attr);
                        lookup.set(attr, refManager);
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
    attr;
    #el;
    #children;
    constructor(el, attr) {
        super();
        this.attr = attr;
        this.#el = new WeakRef(el);
    }
    get children() {
        if (this.#children === undefined) {
            const el = this.#el.deref();
            if (el === undefined)
                return [];
            const attr = el.getAttribute(this.attr);
            if (!attr)
                return [];
            const refIds = splitRefs(attr);
            const qry = refIds.map(id => `#${id}`).join(', ');
            const rn = el.getRootNode();
            const refsArr = Array.from(rn.querySelectorAll(qry));
            const refs = new Map();
            for (const ref of refsArr) {
                refs.set(ref.id, new WeakRef(ref));
            }
            this.#children = refs;
            const mo = new MountObserver({
                on: qry,
                do: {
                    mount: (el) => {
                        const id = el.id;
                        if (id && !this.#children?.has(id)) {
                            this.#children?.set(id, new WeakRef(el));
                            this.dispatchEvent(new ChangeEvent([el], []));
                        }
                    },
                    dismount: (el) => {
                        const id = el.id;
                        if (id && this.#children?.has(id)) {
                            this.#children?.delete(id);
                            this.dispatchEvent(new ChangeEvent([], [el]));
                        }
                    }
                }
            });
            mo.observe(rn);
            this.dispatchEvent(new ChangeEvent((refsArr), []));
        }
        return Array.from(this.#children?.values().map(ref => ref.deref()).filter(el => el !== undefined)) || [];
    }
}
export class ChangeEvent extends Event {
    addedChildren;
    removedChildren;
    static eventName = 'change';
    constructor(addedChildren, removedChildren) {
        super(ChangeEvent.eventName);
        this.addedChildren = addedChildren;
        this.removedChildren = removedChildren;
    }
}
