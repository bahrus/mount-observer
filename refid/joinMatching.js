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
    constructor(el, prop) {
    }
    get fromClosest() {
        const handler = {
            get(target, prop) {
                console.log({ target, prop });
            }
        };
        return new Proxy(this, handler);
    }
}
