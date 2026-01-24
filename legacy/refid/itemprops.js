"use strict";
function getFirst(element, prop) {
    for (const child of element.children) {
        const itemprop = child.getAttribute('itemprop');
        if (itemprop === prop) {
            return child;
        }
        if (!child.hasAttribute('itemscope')) {
            const found = getFirst(child, prop);
            if (found)
                return found;
        }
    }
    return null;
}
const proxies = new WeakMap();
const refLookup = new WeakMap();
Object.defineProperty(Element.prototype, 'itemprops', {
    get() {
        if (!proxies.has(this)) {
            const handler = {
                get(target, prop) {
                    let lookup;
                    if (refLookup.has(target)) {
                        lookup = refLookup.get(target);
                    }
                    else {
                        lookup = new Map();
                        refLookup.set(target, lookup);
                    }
                    if (lookup.has(prop)) {
                        return lookup.get(prop);
                    }
                    else {
                        const propManager = new ItempropManager(target, prop);
                        lookup.set(prop, propManager);
                        return propManager;
                    }
                },
            };
            proxies.set(this, new Proxy(this, handler));
        }
        return proxies.get(this);
    }
});
class ItempropManager extends EventTarget {
    #el;
    #prop;
    constructor(el, prop) {
        super();
        this.#el = new WeakRef(el);
        this.#prop = prop;
    }
    get first() {
        const el = this.#el.deref();
        if (el === undefined)
            return null;
        return getFirst(el, this.#prop);
    }
}
