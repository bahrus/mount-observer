function getFirst(element: Element, prop: string): Element | null {
    for(const child of element.children){
        const itemprop = child.getAttribute('itemprop');
        if(itemprop === prop){
            return child;
        }
        if(!child.hasAttribute('itemscope')){
            const found = getFirst(child, prop);
            if(found) return found;
        }
    }
    return null;
}
const proxies = new WeakMap<Element, ProxyConstructor>();
const refLookup = new WeakMap<Element, PropManagerLookup>();
Object.defineProperty(Element.prototype, 'itemprops', {

    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target: Element, prop: string) {
                    let lookup: PropManagerLookup;
                    if(refLookup.has(target)){
                        lookup = refLookup.get(target)!;
                    }else{
                        lookup = new Map<Prop, ItempropManager>();
                        refLookup.set(target, lookup);
                    }
                    if(lookup.has(prop)){
                        return lookup.get(prop);
                    }else{
                        const propManager = new ItempropManager(target, prop as string);
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

type Prop = string;

type PropManagerLookup = Map<Prop, ItempropManager>;

class ItempropManager extends EventTarget {
    #el: WeakRef<Element>;
    #prop: Prop;
    constructor(el: Element, prop: Prop){
        super();
        this.#el = new WeakRef(el);
        this.#prop = prop;
    }

    get first(){
        const el = this.#el.deref();
        if(el === undefined) return null;
        return getFirst(el, this.#prop);
    }
    
}

