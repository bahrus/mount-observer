import { RootMutObs } from './RootMutObs.js';
const mutationObserverLookup = new WeakMap();
const refCount = new WeakMap();
export class MountObserver extends EventTarget {
    #mountInit;
    #rootMutObs;
    #abortController;
    #mounted;
    #mountedList;
    #disconnected;
    //#unmounted: WeakSet<Element>;
    #isComplex;
    constructor(init) {
        super();
        const { on, whereElementIntersectsWith, whereMediaMatches } = init;
        let isComplex = false;
        if (on !== undefined) {
            const reducedMatch = on.replaceAll(':not(', '');
            isComplex = reducedMatch.includes(' ') || reducedMatch.includes(':');
        }
        this.#isComplex = isComplex;
        if (whereElementIntersectsWith || whereMediaMatches)
            throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
        this.#disconnected = new WeakSet();
        //this.#unmounted = new WeakSet();
    }
    #calculatedSelector;
    #fullListOfAttrs;
    //get #attrVals
    get #selector() {
        if (this.#calculatedSelector !== undefined)
            return this.#calculatedSelector;
        const { on, whereAttr } = this.#mountInit;
        const withoutAttrs = on || '*';
        if (whereAttr === undefined)
            return withoutAttrs;
        const { hasBase, hasBranchIn, hasRootIn } = whereAttr;
        const fullListOfAttrs = [];
        //TODO:  share this block with doWhereAttr?
        const hasBaseIsString = typeof hasBase === 'string';
        const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
        const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
        //end TODO
        let prefixLessMatches = [baseSelector];
        if (hasBranchIn !== undefined) {
            let baseToBranchDelimiter = '-';
            let branches;
            if (hasBranchIn.length === 2 && Array.isArray(hasBranchIn[1])) {
                baseToBranchDelimiter = hasBranchIn[0];
                branches = hasBranchIn[1];
            }
            else {
                branches = hasBranchIn;
            }
            prefixLessMatches = branches.map(x => `${baseSelector}${baseToBranchDelimiter}x`);
        }
        const stems = hasRootIn || [''];
        for (const stem of stems) {
            const prefix = typeof stem === 'string' ? stem : stem.path;
            for (const prefixLessMatch of prefixLessMatches) {
                fullListOfAttrs.push(prefix.length === 0 ? prefixLessMatch : `${prefix}${rootToBaseDelimiter}${prefixLessMatch}`);
            }
        }
        this.#fullListOfAttrs = fullListOfAttrs;
        const listOfSelectors = fullListOfAttrs.map(s => `${withoutAttrs}[${s}]`);
        this.#calculatedSelector = listOfSelectors.join(',');
        return this.#calculatedSelector;
    }
    unobserve(within) {
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        const currentCount = refCount.get(nodeToMonitor);
        if (currentCount !== undefined) {
            if (currentCount <= 1) {
                const observer = mutationObserverLookup.get(nodeToMonitor);
                if (observer === undefined) {
                    console.warn(refCountErr);
                }
                else {
                    observer.disconnect();
                    mutationObserverLookup.delete(nodeToMonitor);
                    refCount.delete(nodeToMonitor);
                }
            }
            else {
                refCount.set(nodeToMonitor, currentCount + 1);
            }
        }
        else {
            if (mutationObserverLookup.has(nodeToMonitor)) {
                console.warn(refCountErr);
            }
        }
    }
    async observe(within) {
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        if (!mutationObserverLookup.has(nodeToMonitor)) {
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
            refCount.set(nodeToMonitor, 1);
        }
        else {
            const currentCount = refCount.get(nodeToMonitor);
            if (currentCount === undefined) {
                console.warn(refCountErr);
            }
            else {
                refCount.set(nodeToMonitor, currentCount + 1);
            }
        }
        const rootMutObs = mutationObserverLookup.get(within);
        //const {whereAttr} = this.#mountInit;
        const fullListOfAttrs = this.#fullListOfAttrs;
        rootMutObs.addEventListener('mutation-event', async (e) => {
            //TODO:  disconnected
            if (this.#isComplex) {
                this.#inspectWithin(within, false);
                return;
            }
            const { mutationRecords } = e;
            const elsToInspect = [];
            //const elsToDisconnect: Array<Element> = [];
            const doDisconnect = this.#mountInit.do?.disconnect;
            for (const mutationRecord of mutationRecords) {
                const { addedNodes, type, removedNodes } = mutationRecord;
                //console.log(mutationRecord);
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element);
                addedElements.forEach(x => elsToInspect.push(x));
                if (type === 'attributes') {
                    const { target, attributeName, oldValue } = mutationRecord;
                    if (target instanceof Element && attributeName !== null && this.#mounted.has(target)) {
                        if (fullListOfAttrs !== undefined) {
                            const idx = fullListOfAttrs.indexOf(attributeName);
                            if (idx > -1) {
                                const newValue = target.getAttribute(attributeName);
                                const attrChangeInfo = {
                                    name: attributeName,
                                    oldValue,
                                    newValue,
                                    idx
                                };
                                this.dispatchEvent(new AttrChangeEvent(target, attrChangeInfo));
                            }
                        }
                        else {
                            const { whereAttr } = this.#mountInit;
                            if (whereAttr !== undefined) {
                                const { doWhereAttr } = await import('./doWhereAttr.js');
                                doWhereAttr(whereAttr, attributeName, target, oldValue, this);
                            }
                        }
                    }
                    elsToInspect.push(target);
                }
                const deletedElements = Array.from(removedNodes).filter(x => x instanceof Element);
                for (const deletedElement of deletedElements) {
                    // if(!this.#mounted.has(deletedElement)) continue;
                    // this.#mounted.delete(deletedElement);
                    // this.#mountedList = this.#mountedList?.filter(x => x.deref() !== deletedElement);
                    this.#disconnected.add(deletedElement);
                    if (doDisconnect !== undefined) {
                        doDisconnect(deletedElement, this, {});
                    }
                    this.dispatchEvent(new DisconnectEvent(deletedElement));
                }
            }
            this.#filterAndMount(elsToInspect, true, false);
        }, { signal: this.#abortController.signal });
        //if(ignoreInitialMatches !== true){
        await this.#inspectWithin(within, true);
        //}
    }
    #confirmInstanceOf(el, whereInstanceOf) {
        for (const test of whereInstanceOf) {
            if (el instanceof test)
                return true;
        }
        return false;
    }
    async #mount(matching, initializing) {
        //first unmount non matching
        const alreadyMounted = this.#filterAndDismount();
        const mount = this.#mountInit.do?.mount;
        const { import: imp } = this.#mountInit;
        const fullListOfAttrs = this.#fullListOfAttrs;
        for (const match of matching) {
            if (alreadyMounted.has(match))
                continue;
            this.#mounted.add(match);
            if (imp !== undefined) {
                switch (typeof imp) {
                    case 'string':
                        this.module = await import(imp);
                        break;
                    case 'object':
                        if (Array.isArray(imp)) {
                            throw 'NI: Firefox';
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
            if (mount !== undefined) {
                mount(match, this, {
                    stage: 'PostImport',
                    initializing
                });
            }
            this.dispatchEvent(new MountEvent(match, initializing));
            if (fullListOfAttrs !== undefined) {
                const { whereAttr } = this.#mountInit;
                for (const name of fullListOfAttrs) {
                    if (whereAttr !== undefined) {
                        const { doWhereAttr } = await import('./doWhereAttr.js');
                        doWhereAttr(whereAttr, name, match, null, this);
                    }
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
    async #dismount(unmatching) {
        const onDismount = this.#mountInit.do?.dismount;
        for (const unmatch of unmatching) {
            if (onDismount !== undefined) {
                onDismount(unmatch, this, {});
            }
            this.dispatchEvent(new DismountEvent(unmatch));
        }
    }
    #filterAndDismount() {
        const returnSet = new Set();
        if (this.#mountedList !== undefined) {
            const previouslyMounted = this.#mountedList.map(x => x.deref());
            const { whereSatisfies, whereInstanceOf } = this.#mountInit;
            const match = this.#selector;
            const elsToUnMount = previouslyMounted.filter(x => {
                if (x === undefined)
                    return false;
                if (!x.matches(match))
                    return true;
                if (whereSatisfies !== undefined) {
                    if (!whereSatisfies(x, this, { stage: 'Inspecting', initializing: false }))
                        return true;
                }
                returnSet.add(x);
                return false;
            });
            this.#dismount(elsToUnMount);
        }
        this.#mountedList = Array.from(returnSet).map(x => new WeakRef(x));
        return returnSet;
    }
    async #filterAndMount(els, checkMatch, initializing) {
        const { whereSatisfies, whereInstanceOf } = this.#mountInit;
        const match = this.#selector;
        const elsToMount = els.filter(x => {
            if (checkMatch) {
                if (!x.matches(match))
                    return false;
            }
            if (whereSatisfies !== undefined) {
                if (!whereSatisfies(x, this, { stage: 'Inspecting', initializing }))
                    return false;
            }
            if (whereInstanceOf !== undefined) {
                if (!this.#confirmInstanceOf(x, whereInstanceOf))
                    return false;
            }
            return true;
        });
        this.#mount(elsToMount, initializing);
    }
    async #inspectWithin(within, initializing) {
        const els = Array.from(within.querySelectorAll(this.#selector));
        this.#filterAndMount(els, false, initializing);
    }
}
const refCountErr = 'mount-observer ref count mismatch';
// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MountEvent extends Event {
    mountedElement;
    initializing;
    static eventName = 'mount';
    constructor(mountedElement, initializing) {
        super(MountEvent.eventName);
        this.mountedElement = mountedElement;
        this.initializing = initializing;
    }
}
export class DismountEvent extends Event {
    dismountedElement;
    static eventName = 'dismount';
    constructor(dismountedElement) {
        super(DismountEvent.eventName);
        this.dismountedElement = dismountedElement;
    }
}
export class DisconnectEvent extends Event {
    disconnectedElement;
    static eventName = 'disconnect';
    constructor(disconnectedElement) {
        super(DisconnectEvent.eventName);
        this.disconnectedElement = disconnectedElement;
    }
}
export class AttrChangeEvent extends Event {
    mountedElement;
    attrChangeInfo;
    static eventName = 'attr-change';
    constructor(mountedElement, attrChangeInfo) {
        super(AttrChangeEvent.eventName);
        this.mountedElement = mountedElement;
        this.attrChangeInfo = attrChangeInfo;
    }
}
//const hasRootInDefault =  ['data', 'enh', 'data-enh']
