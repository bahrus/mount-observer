const proxies = new WeakMap<Element, ProxyConstructor>();
Object.defineProperty(Element.prototype, 'joinMatching', {
    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target: Element, prop: string) {
                    const jm = new JoinMatching(target, prop);
                    return jm;
                },
            }
            proxies.set(this, new Proxy(this, handler));
        }
        return proxies.get(this);
    },
});

export class JoinMatching {
    #proxy: ProxyConstructor | undefined;
    elRef: WeakRef<Element>;
    constructor(el: Element, public prop: string){
        this.elRef = new WeakRef(el);
    }

    get fromClosest(){
        const handler = {
            get(self: JoinMatching, closestQry: string){
                const {elRef, prop} = self;
                const el = elRef.deref();
                console.log({self, closestQry, prop, el});
            }
        }
        return new Proxy(this, handler);
    }
}
