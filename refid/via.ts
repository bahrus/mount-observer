import {splitRefs} from './splitRefs.js';
import {MountObserver} from '../MountObserver.js';
import {camelToKebob} from './camelToKebob.js';
const proxies = new WeakMap<Element, ProxyConstructor>();
const refLookup = new WeakMap<Element, RefLookup>();
Object.defineProperty(Element.prototype, 'via', {
    get(){
        if(!proxies.has(this)){
            const handler = {
                get(target: Element, prop: string) {
                    let lookup: RefLookup;
                    if(refLookup.has(target)){
                        lookup = refLookup.get(target)!;
                    }else{
                        lookup = new Map<attr, RefManager>();
                        refLookup.set(target, lookup);
                    }
                    if(lookup.has(prop)){
                        return lookup.get(prop);
                    }else{
                        const refManager = new RefManager(target, prop as string);
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

type attr = string;

type RefLookup = Map<attr, RefManager>;

class RefManager extends EventTarget {
    #el: WeakRef<Element>;
    #children: Map<string, WeakRef<Element>> | undefined;
    #attr: string;
    //#parents: Array<WeakRef<Element>> | undefined;
    constructor(el: Element, prop: string){
        super();
        this.#attr = camelToKebob(prop);
        this.#el = new WeakRef(el);
    }
    get children(){
        if(this.#children === undefined){
            const el = this.#el.deref();
            if(el === undefined) return [];
            const attr = el.getAttribute(this.#attr);
            if(!attr) return [];
            const refIds = splitRefs(attr);
            const qry = refIds.map(id => `#${id}`).join(', ');
            const rn = el.getRootNode() as DocumentFragment;
            const refsArr = Array.from(rn.querySelectorAll(qry));
            const refs = new Map<string, WeakRef<Element>>();
            for(const ref of refsArr){
                refs.set(ref.id, new WeakRef(ref));
            }
            this.#children = refs;
            const mo = new MountObserver({
                on: qry,
                do: {
                    mount: (el) => {
                        const id = el.id;
                        if(id && !this.#children?.has(id)){
                            this.#children?.set(id, new WeakRef(el));
                            this.dispatchEvent(new ChangeEvent([el], []));
                        }
                    },
                    dismount: (el) => {
                        const id = el.id;
                        if(id && this.#children?.has(id)){
                            this.#children?.delete(id);
                            this.dispatchEvent(new ChangeEvent([], [el]));
                        }
                    }
                }
            });
            mo.observe(rn);
            this.dispatchEvent(new ChangeEvent((refsArr), []));
        }
        return Array.from(this.#children?.values().map(ref => ref.deref()).filter(el => el !== undefined)) || [];
    }

    get parents(){
        //for now, hold off on caching parents until a use case arises
        //if(this.#parents === undefined){
            const el = this.#el.deref();
            if(el === undefined) return [];
            if(el.id === '') return [];
            const rn = el.getRootNode() as DocumentFragment;
            const qry = `[${this.#attr}~="${el.id}"]`;
            const parents = Array.from(rn.querySelectorAll(qry));
            //this.#parents = parents.map(parent => new WeakRef(parent));
            return parents;
        //}
        //return this.#parents.map(ref => ref.deref()).filter(el => el !== undefined) || [];
        
    }
}

export class ChangeEvent extends Event {
    static eventName = 'change';
    constructor(public addedChildren: Array<Element>, public removedChildren: Array<Element>){ 
        super(ChangeEvent.eventName);
    }
}