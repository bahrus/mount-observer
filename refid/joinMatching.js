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
    prop;
    #proxy;
    elRef;
    constructor(el, prop) {
        this.prop = prop;
        this.elRef = new WeakRef(el);
    }
    get fromClosest() {
        const handler = {
            get(self, closestQry) {
                const { elRef, prop } = self;
                const el = elRef.deref();
                console.log({ self, closestQry, prop, el });
            }
        };
        return new Proxy(this, handler);
    }
}
