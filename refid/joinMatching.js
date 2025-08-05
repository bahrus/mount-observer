import { camelToKebab } from './camelToKebab.js';
const proxies = new WeakMap();
Object.defineProperty(Element.prototype, 'joinMatching', {
    get() {
        if (!proxies.has(this)) {
            const handler = {
                get(target, prop) {
                    const jm = new JoinMatching(target, prop);
                    return jm;
                },
            };
            proxies.set(this, new Proxy(this, handler));
        }
        return proxies.get(this);
    },
});
export class JoinMatching {
    #proxy;
    elRef;
    attr;
    constructor(el, prop) {
        this.elRef = new WeakRef(el);
        this.attr = camelToKebab(prop);
    }
    get fromClosest() {
        const handler = {
            get(self, closestQry) {
                const { elRef, attr } = self;
                const el = elRef.deref();
                if (el === undefined)
                    return [];
                const attrVal = el.getAttribute(attr);
                const tryClosestQry = camelToKebab(closestQry);
                let closest = el.closest(tryClosestQry);
                if (closest === null)
                    closest = el.closest(closestQry);
                if (closest === null)
                    throw 404;
                return Array.from(closest.querySelectorAll(`[${attr}="${attrVal}"]`));
                //console.log({self, closestQry, prop, el});
            }
        };
        return new Proxy(this, handler);
    }
}
