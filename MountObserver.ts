import {MountInit, MountContext, AddMutationEventListener, 
    MutationEvent, dismountEventName, mountEventName, IMountEvent, IDismountEvent} from './types';
import {RootMutObs} from './RootMutObs.js';


const mutationObserverLookup = new WeakMap<Node, RootMutObs>();
export class MountObserver extends EventTarget implements MountContext{
    
    #mountInit: MountInit;
    #rootMutObs: RootMutObs | undefined;
    #abortController: AbortController;
    #mounted: WeakSet<Element>;
    #mountedList: Array<WeakRef<Element>> | undefined;
    //#unmounted: WeakSet<Element>;
    #isComplex: boolean;

    constructor(init: MountInit){
        super();
        const {match, whereElementIntersectsWith, whereMediaMatches} = init;
        this.#isComplex = match.includes(' ') || match.includes(':')
        if(whereElementIntersectsWith || whereMediaMatches) throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
        //this.#unmounted = new WeakSet();
    }

    async observe(within: Node){
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within; 
        if(!mutationObserverLookup.has(nodeToMonitor)){
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
        }
        const rootMutObs = mutationObserverLookup.get(within)!;
        (rootMutObs as any as AddMutationEventListener).addEventListener('mutation-event', (e: MutationEvent) => {
            //TODO:  disconnected
            if(this.#isComplex){
                this.#inspectWithin(within);
                return;
            }
            const {mutationRecords} = e;
            const elsToInspect: Array<Element> = [];
            for(const mutationRecord of mutationRecords){
                const {addedNodes, target} = mutationRecord;
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element) as Array<Element>;
                elsToInspect.concat(addedElements);
            }
            this.#filterAndMount(elsToInspect, true);
        }, {signal: this.#abortController.signal});
        await this.#inspectWithin(within);
    }

    #confirmInstanceOf(el: Element, whereInstanceOf: Array<typeof Node>){
        for(const test of whereInstanceOf){
            if(el instanceof test) return true;
        }
        return false;
    }

    async #mount(matching: Array<Element>){
        //first unmount non matching
        const alreadyMounted = this.#filterAndDismount();
        const onMount = this.#mountInit.do?.onMount; 
        const imp = this.#mountInit.import;
        for(const match of matching){
            if(alreadyMounted.has(match)) continue;
            this.#mounted.add(match);
            if(imp !== undefined){
                switch(typeof imp){
                    case 'string':
                        this.module =  await import(imp);
                        break;
                    case 'object':
                        if(Array.isArray(imp)){
                            this.module = await import(imp[0], imp[1]);
                        }
                        break;
                    case 'function':
                        this.module = await imp(match, this, 'Import');
                        break;
                }
            }
            if(onMount !== undefined) onMount(match, this, 'PostImport');
            this.dispatchEvent(new MountEvent(match));
            this.#mountedList?.push(new WeakRef(match));
            //if(this.#unmounted.has(match)) this.#unmounted.delete(match);
        }
    }

    async #dismount(unmatching: Array<Element>){
        const onDismount = this.#mountInit.do?.onDismount
        for(const unmatch of unmatching){
            if(onDismount !== undefined){
                onDismount(unmatch, this);
            }
            this.dispatchEvent(new DismountEvent(unmatch));
        }
    }

    #filterAndDismount(): Set<Element>{
        const returnSet = new Set<Element>();
        if(this.#mountedList !== undefined){
            const previouslyMounted = this.#mountedList.map(x => x.deref());
            const {match, whereSatisfies, whereInstanceOf} = this.#mountInit;
            const elsToUnMount = previouslyMounted.filter(x => {
                if(x === undefined) return false;
                if(!x.matches(match)) return true;
                if(whereSatisfies !== undefined){
                    if(!whereSatisfies(x, this, 'Inspecting')) return true;
                }
                returnSet.add(x);
                return false;
            }) as Array<Element>;
            this.#dismount(elsToUnMount);
        }
        this.#mountedList = Array.from(returnSet).map(x => new WeakRef(x));
        return returnSet;
    }

    async #filterAndMount(els: Array<Element>, checkMatch: boolean){
        const {match, whereSatisfies, whereInstanceOf} = this.#mountInit;
        const elsToMount = els.filter(x => {
            if(checkMatch){
                if(!x.matches(match)) return false;
            }
            if(whereSatisfies !== undefined){
                if(!whereSatisfies(x, this, 'Inspecting')) return false;
            }
            if(whereInstanceOf !== undefined){
                if(!this.#confirmInstanceOf(x, whereInstanceOf)) return false;
            }
            return true;
        });
        this.#mount(elsToMount);
    }

    async #inspectWithin(within: Node){
        if('querySelectorAll' in within){
            const {match} = this.#mountInit;
            const els = Array.from((within as Element).querySelectorAll(match));
            this.#filterAndMount(els, false);
        }
    }

    unobserve(){
        throw 'NI';
    }

}

export interface MountObserver extends MountContext{}

// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MountEvent extends Event implements IMountEvent {
    static eventName: mountEventName = 'mount';
  
    constructor(public mountedElement: Element) {
      super(MountEvent.eventName);
      
    }
}

export class DismountEvent extends Event implements IDismountEvent{
    static eventName: dismountEventName = 'dismount';

    constructor(public dismountedElement: Element){
        super(DismountEvent.eventName)
    }
}

