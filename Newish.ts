import { BindishOptions, HasIsh, Ishcycle } from './ts-refs/mount-observer/types.js';

export {waitForEvent} from './waitForEvent.js';
import {ObsAttr} from './ObsAttr.js';
import {splitRefs} from './refid/splitRefs.js';
import {getIsh} from './refid/getIsh.js';
import {arr} from './refid/secretKeys.js';
export const attached = Symbol.for('xyyspnstnU+CDrNVa0VnxA');
export class Newish implements EventListenerObject {
    queue: Array<any> = [];
    isResolved = false;
    #ce: Ishcycle | undefined;
    #ref: WeakRef<Element>;

    #options: BindishOptions;
    #args: [enhancedElement: Element, target: Node, itemscope: string] | undefined;
    constructor(
        enhancedElement: Element,
        target: Node,
        itemscope: string, 
        options?: BindishOptions
    ){
        this.#args = [enhancedElement, target, itemscope];
        this.#options = options || {assigner: Object.assign};
        this.#ref = new WeakRef(enhancedElement);
    }
    async handleEvent() {
       const enhancedElement = this.#ref.deref();
       if(!enhancedElement) return;
       await this.#attachItemrefs(enhancedElement);
    }

    async do(){
        const [enhancedElement, target, itemscope] = this.#args!;
        this.#args = undefined;
        if((<any>enhancedElement)[attached] === true) return;
        (<any>enhancedElement)[attached] = true;
        const options = this.#options;
        const {initPropVals, ctr} = options;
        let ce: Ishcycle;
        if(ctr === undefined){
            const foundCtr = await getIsh(enhancedElement.isConnected ? enhancedElement :target, itemscope)! as any;

            const initPropVals =  (<any>enhancedElement)['ish'];

            const resolvedConstructor = foundCtr.constructor.name === 'AsyncFunction' ? await foundCtr() : foundCtr;
            const isInstance = initPropVals instanceof resolvedConstructor
            ce = isInstance ? initPropVals : new resolvedConstructor() as Ishcycle;
            if(initPropVals !== undefined && !isInstance) this.queue.push(initPropVals);
        }else{
            ce = new (ctr as any)();
            if(initPropVals !== undefined) this.queue.push(initPropVals);
        }
        // if('tbd' in ce && typeof ce['tbd'] === 'function'){
        //     await ce['tbd'](ce, enhancedElement, this.#options);
        // }

        this.#ce = ce;
        const self = this;
        Object.defineProperty(enhancedElement, 'ish', {
            get(){
                return self.#ce;
            },
            set(nv: any){
                if(self.#ce === nv) return;
                self.queue.push(nv);
                self.#assignGingerly(false);
            },
            enumerable: true,
            configurable: true,
        });
        await this.#assignGingerly(true);
            if('<mount>' in ce && typeof ce['<mount>'] === 'function'){
            await ce['<mount>'](ce, enhancedElement as HasIsh & Element, this.#options)
        }
        //attach any itemref references
        await this.#attachItemrefs(enhancedElement);
        const et = ObsAttr(enhancedElement, 'itemref');
        et.addEventListener('attr-changed', this);
        this.isResolved = true;
        return ce;
    }

    

    #alreadyAttached = new WeakSet<Element>;

    async #attachItemrefs(enhancedElement: Element){
        //TODO:  watch for already attached itemrefs to be removed and remove them from the set
        // and call outOfScopeCallback on them
        if('<inScope>' in (<any>this.#ce) && enhancedElement.hasAttribute('itemref')){
            await import('./refid/via.js');
            const itemref = (<any>enhancedElement).via.itemref
            const refs = itemref.children as Element[];
            for(const ref of refs){
                if(this.#alreadyAttached.has(ref)) continue;
                (<any>this.#ce)['<inScope>'](this.#ce, ref, this.#options);
            }
            itemref.addEventListener('change', this);

        }

    }

    async #assignGingerly(fromDo: boolean){
        const actions = new Set<Action>();
        if(fromDo){
            actions.add('attached');
        }
        let ce = this.#ce!;
        if(ce === undefined){
            throw 500;
        }
        let foundArray = false;
        const hasArrFilter = 'arr=>' in ce && typeof ce['arr=>'] === 'function';
        const ref = this.#ref.deref();
        while(this.queue.length > 0 ){
            const fi = this.queue.shift();
            //TODO: Provide support for a virtual slice of a very large list
            //TODO:  Maybe should check if iterable rather than an array?
            if(Array.isArray(fi)){
                foundArray = true;
                let filtered = fi as any | undefined;
                if(hasArrFilter){
                    filtered = await (ce['arr=>']!)(ce, fi, ref! as HasIsh & Element, this.#options);
                }
                (<any>ce)[arr] = filtered;
                actions.add('ishListAssigned');
            }else{
                let {assigner} = this.#options;
                if(assigner === undefined){
                    assigner = Object.assign;
                }
                await assigner!(ce, fi);
                actions.add('ishAssigned');
            }
            
        }
        if(fromDo && !foundArray && hasArrFilter){
            const filtered = await (ce['arr=>']!)(ce, undefined, ref! as HasIsh &  Element, this.#options);
            if(filtered !== undefined){
                (<any>ce)[arr] = filtered;
                actions.add('ishListAssigned');
            }
        }
        
        if(ref){
            ref.dispatchEvent(new IshEvent(Array.from(actions)));
        }   
    }

}

type Action = 
    | 'attached' 
    | 'ishAssigned'
    | 'ishListAssigned'

interface IIshEvent{
    actions: Array<Action>;
}

export class IshEvent extends Event implements IIshEvent{
    static eventName = 'ish';

    constructor(public actions: Array<Action>){
        super(IshEvent.eventName);
    }
}
