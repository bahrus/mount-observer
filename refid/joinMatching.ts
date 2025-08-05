import {camelToKebab} from './camelToKebab.js';
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
    attr: string;
    constructor(el: Element, prop: string){
        this.elRef = new WeakRef(el);
        this.attr = camelToKebab(prop);
    }

    get fromClosest(){
        const handler = {
            get(self: JoinMatching, closestQry: string){
                const {elRef, attr} = self;
                const el = elRef.deref();
                if(el === undefined) return [];
                const attrVal = el.getAttribute(attr);
                const tryClosestQry = camelToKebab(closestQry);
                let closest = el.closest(tryClosestQry);
                if(closest === null) closest = el.closest(closestQry);
                if(closest === null) throw 404;
                return Array.from(closest.querySelectorAll(`[${attr}="${attrVal}"]`))
                //console.log({self, closestQry, prop, el});
            }
        }
        return new Proxy(this, handler);
    }
}
