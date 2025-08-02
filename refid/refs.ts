const proxies = new WeakMap<Element, ProxyConstructor>();
const refLookup = new WeakMap<ProxyConstructor, RefLookup>();
Object.defineProperty(Element.prototype, 'refs', {
    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target, prop) {
                    
                    return Reflect.get(target, prop);
                },
                
            };
            proxies.set(this, new Proxy(this, handler));
        }
        return proxies.get(this);
    }
})];

type prop = string;

type RefLookup = Map<prop, RefManager>;

class RefManager{

}