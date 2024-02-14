import {MountInit, IMountObserver, AddMutationEventListener, 
    MutationEvent, dismountEventName, mountEventName, IMountEvent, IDismountEvent,
    disconnectedEventName, IDisconnectEvent, IAttrChangeEvent, attrChangeEventName, AttrChangeInfo
} from './types';
import {RootMutObs} from './RootMutObs.js';


const mutationObserverLookup = new WeakMap<Node, RootMutObs>();
const refCount = new WeakMap<Node, number>();
export class MountObserver extends EventTarget implements IMountObserver{
    
    #mountInit: MountInit;
    #rootMutObs: RootMutObs | undefined;
    #abortController: AbortController;
    #mounted: WeakSet<Element>;
    #mountedList: Array<WeakRef<Element>> | undefined;
    #disconnected: WeakSet<Element>;
    //#unmounted: WeakSet<Element>;
    #isComplex: boolean;

    constructor(init: MountInit){
        super();
        const {on, whereElementIntersectsWith, whereMediaMatches} = init;
        let isComplex = false;
        if(on !== undefined){
            const reducedMatch = on.replaceAll(':not(', '');
            isComplex = reducedMatch.includes(' ') || reducedMatch.includes(':');
        }
        this.#isComplex = isComplex;
        if(whereElementIntersectsWith || whereMediaMatches) throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
        this.#disconnected = new WeakSet();
        //this.#unmounted = new WeakSet();
    }

    #calculatedSelector: string | undefined;
    #fullListOfAttrs: Array<string> | undefined;
    //get #attrVals
    get #selector(){
        if(this.#calculatedSelector !== undefined) return this.#calculatedSelector;
        const {on, whereAttr} = this.#mountInit;
        const base = on || '*';
        if(whereAttr === undefined) return base;
        const {hasBase, hasBranchesIn, hasRootIn} = whereAttr;
        const fullListOfAttrs: Array<string> = [];
        const prefixLessMatches: Array<string> = hasBranchesIn === undefined ? [hasBase]
            : hasBranchesIn.map(x => `${hasBase}-${x}`);
        
        const stems = hasRootIn || hasRootInDefault;
        for(const stem of stems){
            const prefix = typeof stem === 'string' ? stem : stem.path;
            for(const prefixLessMatch of prefixLessMatches){
                fullListOfAttrs.push(`${prefix}-${prefixLessMatch}`);
            }
            
        }
        this.#fullListOfAttrs = fullListOfAttrs;
        const listOfSelectors = fullListOfAttrs.map(s => `${base}[${s}]`);
        this.#calculatedSelector = listOfSelectors.join(',');
        return this.#calculatedSelector;
    }

    unobserve(within: Node){
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within; 
        const currentCount = refCount.get(nodeToMonitor);
        if(currentCount !== undefined){
            if(currentCount <= 1){
                const observer = mutationObserverLookup.get(nodeToMonitor);
                if(observer === undefined){
                    console.warn(refCountErr);
                }else{
                    observer.disconnect();
                    mutationObserverLookup.delete(nodeToMonitor);
                    refCount.delete(nodeToMonitor);
                }
            }else{
                refCount.set(nodeToMonitor, currentCount + 1);
            }
        }else{
            if(mutationObserverLookup.has(nodeToMonitor)){
                console.warn(refCountErr);
            }
        }
                
    }

    async observe(within: Node){
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within; 
        if(!mutationObserverLookup.has(nodeToMonitor)){
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
            refCount.set(nodeToMonitor, 1);
        }else{
            const currentCount = refCount.get(nodeToMonitor);
            if(currentCount === undefined){
                console.warn(refCountErr);
            }else{
                refCount.set(nodeToMonitor, currentCount + 1);
            }
        }
        const rootMutObs = mutationObserverLookup.get(within)!;
        //const {whereAttr} = this.#mountInit;
        const fullListOfAttrs = this.#fullListOfAttrs;
        (rootMutObs as any as AddMutationEventListener).addEventListener('mutation-event', (e: MutationEvent) => {
            //TODO:  disconnected
            if(this.#isComplex){
                this.#inspectWithin(within, false);
                return;
            }
            const {mutationRecords} = e;
            const elsToInspect: Array<Element> = [];
            //const elsToDisconnect: Array<Element> = [];
            const doDisconnect = this.#mountInit.do?.disconnect;
            for(const mutationRecord of mutationRecords){
                const {addedNodes, type, removedNodes} = mutationRecord;
                //console.log(mutationRecord);
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element) as Array<Element>;
                addedElements.forEach(x => elsToInspect.push(x));
                if(type === 'attributes'){
                    const {target, attributeName, oldValue} = mutationRecord;
                    if(target instanceof Element && attributeName !== null &&  fullListOfAttrs !== undefined && this.#mounted.has(target)){
                        const idx = fullListOfAttrs.indexOf(attributeName);
                        if(idx > -1){
                            const newValue = target.getAttribute(attributeName);
                            const attrChangeInfo: AttrChangeInfo = {
                                name: attributeName,
                                oldValue,
                                newValue,
                                idx
                            };
                            this.dispatchEvent(new AttrChangeEvent(target, attrChangeInfo));
                        }
                    }
                    elsToInspect.push(target as Element);
                }
                const deletedElements = Array.from(removedNodes).filter(x => x instanceof Element) as Array<Element>;
                for(const deletedElement of deletedElements){
                    // if(!this.#mounted.has(deletedElement)) continue;
                    // this.#mounted.delete(deletedElement);
                    // this.#mountedList = this.#mountedList?.filter(x => x.deref() !== deletedElement);
                    this.#disconnected.add(deletedElement);
                    if(doDisconnect !== undefined){
                        doDisconnect(deletedElement, this, {});
                    }
                    this.dispatchEvent(new DisconnectEvent(deletedElement));
                }

            }
            this.#filterAndMount(elsToInspect, true, false);
        }, {signal: this.#abortController.signal});
        //if(ignoreInitialMatches !== true){
            await this.#inspectWithin(within, true);
        //}
        
    }

    #confirmInstanceOf(el: Element, whereInstanceOf: Array<typeof Node>){
        for(const test of whereInstanceOf){
            if(el instanceof test) return true;
        }
        return false;
    }

    async #mount(matching: Array<Element>, initializing: boolean){
        //first unmount non matching
        const alreadyMounted = this.#filterAndDismount();
        const mount = this.#mountInit.do?.mount; 
        const {import: imp} = this.#mountInit;
        const fullListOfAttrs = this.#fullListOfAttrs;
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
                            throw 'NI: Firefox'
                            //this.module = await import(imp[0], imp[1]);
                        }
                        break;
                    case 'function':
                        this.module = await imp(match, this, {
                            stage: 'Import',
                            initializing
                        }); 
                        break;
                }
            }
            if(mount !== undefined) {
                mount(match, this, {
                    stage: 'PostImport',
                    initializing
                }) 
            }
            this.dispatchEvent(new MountEvent(match, initializing));
            if(fullListOfAttrs !== undefined){
                const {whereAttr} = this.#mountInit;
                if(whereAttr !== undefined){
                    const {hasBase, hasBranchesIn, hasRootIn} = whereAttr;
                }
                for(const name of fullListOfAttrs){

                }
                // let idx = 0;
                // for(const attribMatch of attribMatches){
                //     let newValue = null;
                //     const {names} = attribMatch;
                //     let nonNullName = names[0];
                //     for(const name of names){
                //         const attrVal = match.getAttribute(name);
                //         if(attrVal !== null) nonNullName = name;
                //         newValue = newValue || attrVal;
                //     }
                //     const attribInfo: AttrChangeInfo = {
                //         oldValue: null,
                //         newValue,
                //         idx,
                //         name: nonNullName
                //     };
                //     this.dispatchEvent(new AttrChangeEvent(match, attribInfo));
                //     idx++;
                // }
            }
            this.#mountedList?.push(new WeakRef(match));
            //if(this.#unmounted.has(match)) this.#unmounted.delete(match);
        }
    }

    async #dismount(unmatching: Array<Element>){
        const onDismount = this.#mountInit.do?.dismount
        for(const unmatch of unmatching){
            if(onDismount !== undefined){
                onDismount(unmatch, this, {});
            }
            this.dispatchEvent(new DismountEvent(unmatch));
        }
    }

    #filterAndDismount(): Set<Element>{
        const returnSet = new Set<Element>();
        if(this.#mountedList !== undefined){
            const previouslyMounted = this.#mountedList.map(x => x.deref());
            const {whereSatisfies, whereInstanceOf} = this.#mountInit;
            const match = this.#selector;
            const elsToUnMount = previouslyMounted.filter(x => {
                if(x === undefined) return false;
                if(!x.matches(match)) return true;
                if(whereSatisfies !== undefined){
                    if(!whereSatisfies(x, this, {stage: 'Inspecting', initializing: false})) return true;
                }
                returnSet.add(x);
                return false;
            }) as Array<Element>;
            this.#dismount(elsToUnMount);
        }
        this.#mountedList = Array.from(returnSet).map(x => new WeakRef(x));
        return returnSet;
    }

    async #filterAndMount(els: Array<Element>, checkMatch: boolean, initializing: boolean){
        const {whereSatisfies, whereInstanceOf} = this.#mountInit;
        const match = this.#selector;
        const elsToMount = els.filter(x => {
            if(checkMatch){
                if(!x.matches(match)) return false;
            }
            if(whereSatisfies !== undefined){
                if(!whereSatisfies(x, this, {stage: 'Inspecting', initializing})) return false;
            }
            if(whereInstanceOf !== undefined){
                if(!this.#confirmInstanceOf(x, whereInstanceOf)) return false;
            }
            return true;
        });
        this.#mount(elsToMount, initializing);
    }

    async #inspectWithin(within: Node, initializing: boolean){
        const els = Array.from((within as Element).querySelectorAll(this.#selector));
        this.#filterAndMount(els, false, initializing);
    }



}

const refCountErr = 'mount-observer ref count mismatch';
export interface MountObserver extends IMountObserver{}

// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MountEvent extends Event implements IMountEvent {
    static eventName: mountEventName = 'mount';
  
    constructor(public mountedElement: Element, public initializing: boolean) {
      super(MountEvent.eventName);
    }
}

export class DismountEvent extends Event implements IDismountEvent{
    static eventName: dismountEventName = 'dismount';

    constructor(public dismountedElement: Element){
        super(DismountEvent.eventName)
    }
}

export class DisconnectEvent extends Event implements IDisconnectEvent{
    static eventName: disconnectedEventName = 'disconnect';

    constructor(public disconnectedElement: Element){
        super(DisconnectEvent.eventName);
    }
}

export class AttrChangeEvent extends Event implements IAttrChangeEvent{
    static eventName: attrChangeEventName = 'attr-change';
    constructor(public mountedElement: Element, public attrChangeInfo: AttrChangeInfo){
        super(AttrChangeEvent.eventName);
    }
}

const hasRootInDefault =  ['data', 'enh', 'data-enh']

