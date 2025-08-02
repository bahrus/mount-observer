import {splitRefs} from './splitRefs.js';
import {MountObserver} from '../MountObserver.js';
const proxies = new WeakMap<Element, ProxyConstructor>();
const refLookup = new WeakMap<ProxyConstructor, RefLookup>();
Object.defineProperty(Element.prototype, 'refs', {
    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target, prop) {
                    let lookup: RefLookup;
                    if(refLookup.has(target.constructor)){
                        lookup = refLookup.get(target.constructor)!;
                    }else{
                        lookup = new Map<prop, RefManager>();
                        refLookup.set(target.constructor, lookup);
                    }
                    if(lookup.has(prop)){
                        return lookup.get(prop);
                    }else{
                        const refManager = new RefManager(this, prop as string);
                        lookup.set(prop, refManager);
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

type prop = string;

type RefLookup = Map<prop, RefManager>;

class RefManager extends EventTarget {
    #el: WeakRef<Element>;
    #refs: Map<string, WeakRef<Element>> | undefined;
    constructor(el: Element, public prop: string){
        super();
        this.#el = new WeakRef(el);
    }
    get elements(){
        if(this.#refs !== undefined){
            const el = this.#el.deref();
            if(el === undefined) return [];
            const attr = el.getAttribute(this.prop);
            if(!attr) return [];
            const refIds = splitRefs(attr);
            const qry = refIds.map(id => `#id`).join(', ');
            const refsArr = Array.from((el.getRootNode() as DocumentFragment).querySelectorAll(qry));
            const refs = new Map<string, WeakRef<Element>>();
            for(const ref of refsArr){
                refs.set(ref.id, new WeakRef(ref));
            }
            this.#refs = refs;
            const mo = new MountObserver({
                on: qry,
                do: {
                    mount: (el) => {
                        const id = el.id;
                        if(id && !this.#refs?.has(id)){
                            this.#refs?.set(id, new WeakRef(el));
                            this.dispatchEvent(new RefEvent([el], []));
                        }
                    },
                    dismount: (el) => {
                        const id = el.id;
                        if(id && this.#refs?.has(id)){
                            this.#refs?.delete(id);
                            this.dispatchEvent(new RefEvent([], [el]));
                        }
                    }
                }
            })
            this.dispatchEvent(new RefEvent((refsArr), []));
        }
        return this.#refs?.values().map(ref => ref.deref()).filter(el => el !== undefined) || [];
    }


}

export class RefEvent extends Event {
    static eventName = 'ref';
    constructor(public addedRefs: Array<Element>, public removedRefs: Array<Element>){ 
        super(RefEvent.eventName);
    }
}