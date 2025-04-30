import { Assigner, BindishOptions } from './ts-refs/mount-observer/types.js';

export {waitForEvent} from './waitForEvent.js';
import {ObsAttr} from './ObsAttr.js';
export const attached = Symbol.for('xyyspnstnU+CDrNVa0VnxA');
export class Newish implements EventListenerObject {
    queue: Array<any> = [];
    isResolved = false;
    #ce: HTMLElement | undefined;
    #ref: WeakRef<Element>;

    //#assigner: undefined | Assigner = undefined;
    #options: BindishOptions;

    constructor(enhancedElement: Element, itemscope: string, options?: BindishOptions){
        this.#options = options || {assigner: Object.assign};
        this.#ref = new WeakRef(enhancedElement);
        this.#do(enhancedElement, itemscope);
    }
    handleEvent(event: Event): void {
       const enhancedElement = this.#ref.deref();
       if(!enhancedElement) return;
       this.#attachItemrefs(enhancedElement);
    }

    async #do(enhancedElement: Element, itemscope: string){
        if((<any>enhancedElement)[attached] === true) return;
        (<any>enhancedElement)[attached] = true;
        await customElements.whenDefined(itemscope);
        const initPropVals = (<any>enhancedElement)['ish'];
        if(enhancedElement instanceof HTMLElement){
            if(enhancedElement.dataset.ish){
                const parsedHostProps = JSON.parse(enhancedElement.dataset.ish);
                this.queue.push(parsedHostProps);
            }
        }
        if(initPropVals !== undefined) this.queue.push(initPropVals);
        const ce = document.createElement(itemscope);
        if('attachedCallback' in ce && typeof ce.attachedCallback === 'function'){
            await ce.attachedCallback(enhancedElement)
        }
        this.#ce = ce;
        const self = this;
        Object.defineProperty(enhancedElement, 'ish', {
            get(){
                return self.#ce;
            },
            set(nv: any){
                self.queue.push(nv);
                self.#assignGingerly();
            },
            enumerable: true,
            configurable: true,
        });
        this.#assignGingerly();
        //attach any itemref references
        this.#attachItemrefs(enhancedElement);
        const et = ObsAttr(enhancedElement, 'itemref');
        et.addEventListener('attr-changed', this);
        this.isResolved = true;
        enhancedElement.dispatchEvent(new Event('ishAttached'));
    }

    

    #alreadyAttached = new Set<string>();

    #attachItemrefs(enhancedElement: Element){
        //TODO:  watch for already attached itemrefs to be removed and remove them from the set
        // and call outOfScopeCallback on them
        if(enhancedElement.hasAttribute('itemref')){
            const itemref = enhancedElement.getAttribute('itemref')!;
            const itemrefList = itemref.split(' ');
            const rn = enhancedElement.getRootNode() as Document | ShadowRoot;
            for(const id of itemrefList){
                if(this.#alreadyAttached.has(id)) continue;
                const itemrefElement = rn.getElementById(id);
                if(itemrefElement){
                    (<any>this.#ce).inScopeCallback(itemrefElement);
                    this.#alreadyAttached.add(id);
                }
            }
        }

    }

    async #assignGingerly(){
        let ce = this.#ce!;
        if(ce === undefined){
            throw 500;
        }
        while(this.queue.length > 0 ){
            const fi = this.queue.shift();
            //TODO: Provide support for a virtual slice of a very large list
            if(Array.isArray(fi)){
                (<any>ce).$ = fi;
            }else{
                const {assigner} = this.#options;
                await assigner!(ce, fi);

            }
            
        }
    }

}
