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
    constructor(el: Element, prop: string){

    }

    get fromClosest(){
        const handler = {
            get(target: any, prop: string){
                console.log({target, prop});
            }
        }
        return new Proxy(this, handler);
    }
}
