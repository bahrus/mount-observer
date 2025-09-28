import {camelToKebab} from './camelToKebab.js';
const grpByProxies = new WeakMap<Element, ProxyConstructor>();
const grpByLookup = new WeakMap<Element, GroupByLookup>();
Object.defineProperty(Element.prototype, 'grpBy', {
    get(){
        if(!grpByProxies.has(this)){
            const handler = {
                get(target: Element, prop: string) {
                    let lookup: GroupByLookup;
                    if(grpByLookup.has(target)){
                        lookup = grpByLookup.get(target)!;
                    }else{
                        lookup = new Map<attr, GroupByManager>();
                        grpByLookup.set(target, lookup);
                    }
                    if(lookup.has(prop)){
                        return lookup.get(prop);
                    }else{
                        const groupByManager = new GroupByManager(target, prop as string);
                        lookup.set(prop, groupByManager);
                        return groupByManager; 
                    }
                }
            }
            grpByProxies.set(this, new Proxy(this, handler));
        }
        return grpByProxies.get(this);  
    }
});

type attr = string;

type GroupByLookup = Map<attr, GroupByManager>;

class GroupByManager extends EventTarget {
    #el: WeakRef<Element>;
    #attr: string;
    constructor(el: Element, prop: string){
        super();
        this.#el = new WeakRef(el);
        this.#attr = camelToKebab(prop);
    }
}