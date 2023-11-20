import {MountInit, MountContext, AddMutationEventListener, 
    MutationEvent, dismountEventName, mountEventName, IMountEvent, IDismountEvent,
    disconnectedEventName, IDisconnectEvent, IAttrChangeEvent, attrChangeEventName, AttrChangeInfo
} from './types';
import {RootMutObs} from './RootMutObs.js';


const mutationObserverLookup = new WeakMap<Node, RootMutObs>();
export class MountObserver extends EventTarget implements MountContext{
    
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
        const {match, whereElementIntersectsWith, whereMediaMatches} = init;
        let isComplex = false;
        if(match !== undefined){
            const reducedMatch = match.replaceAll(':not(', '');
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
    get #selector(){
        if(this.#calculatedSelector !== undefined) return this.#calculatedSelector;
        const {match, attribMatches} = this.#mountInit;
        const base = match || '*';
        if(attribMatches === undefined) return base;
        const matches: Array<string> = [];
        attribMatches.forEach(x => {
            const {names} = x;
            names.forEach(y => {
                matches.push(`${base}[${y}]`)
            });
        });
        this.#calculatedSelector = matches.join(',');
        return this.#calculatedSelector;
    }

    async observe(within: Node){
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within; 
        if(!mutationObserverLookup.has(nodeToMonitor)){
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
        }
        const rootMutObs = mutationObserverLookup.get(within)!;
        const {attribMatches} = this.#mountInit;
        (rootMutObs as any as AddMutationEventListener).addEventListener('mutation-event', (e: MutationEvent) => {
            //TODO:  disconnected
            if(this.#isComplex){
                this.#inspectWithin(within);
                return;
            }
            const {mutationRecords} = e;
            const elsToInspect: Array<Element> = [];
            //const elsToDisconnect: Array<Element> = [];
            const doDisconnect = this.#mountInit.do?.onDisconnect;
            for(const mutationRecord of mutationRecords){
                const {addedNodes, type, removedNodes} = mutationRecord;
                //console.log(mutationRecord);
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element) as Array<Element>;
                addedElements.forEach(x => elsToInspect.push(x));
                if(type === 'attributes'){
                    const {target, attributeName, oldValue} = mutationRecord;
                    if(target instanceof Element && attributeName !== null &&  attribMatches !== undefined && this.#mounted.has(target)){
                        let idx = 0;
                        for(const attrMatch of attribMatches){
                            const {names} = attrMatch;
                            if(names.includes(attributeName)){
                                const newValue = target.getAttribute(attributeName);
                                // let parsedNewValue = undefined;
                                // switch(type){
                                //     case 'boolean':
                                //         parsedNewValue = newValue === 'true' ? true : newValue === 'false' ? false : null;
                                //         break;
                                //     case 'date':
                                //         parsedNewValue = newValue === null ? null : new Date(newValue);
                                //         break;
                                //     case ''

                                // }
                                const attrChangeInfo: AttrChangeInfo = {
                                    name: attributeName,
                                    oldValue,
                                    newValue,
                                    idx
                                };
                                this.dispatchEvent(new AttrChangeEvent(target, attrChangeInfo));
                            }
                            idx++;
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
                        doDisconnect(deletedElement, this);
                    }
                    this.dispatchEvent(new DisconnectEvent(deletedElement));
                }

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
        const {import: imp, attribMatches} = this.#mountInit;
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
            if(attribMatches !== undefined){
                let idx = 0;
                for(const attribMatch of attribMatches){
                    let newValue = null;
                    const {names} = attribMatch;
                    let nonNullName = names[0];
                    for(const name of names){
                        const attrVal = match.getAttribute(name);
                        if(attrVal !== null) nonNullName = name;
                        newValue = newValue || attrVal;
                    }
                    const attribInfo: AttrChangeInfo = {
                        oldValue: null,
                        newValue,
                        idx,
                        name: nonNullName
                    };
                    this.dispatchEvent(new AttrChangeEvent(match, attribInfo));
                    idx++;
                }
            }
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
            const {whereSatisfies, whereInstanceOf} = this.#mountInit;
            const match = this.#selector;
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
        const {whereSatisfies, whereInstanceOf} = this.#mountInit;
        const match = this.#selector;
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
        const els = Array.from((within as Element).querySelectorAll(this.#selector));
        this.#filterAndMount(els, false);
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

