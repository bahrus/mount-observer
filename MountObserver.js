import { RootMutObs } from './RootMutObs.js';
const mutationObserverLookup = new WeakMap();
const refCount = new WeakMap();
export class MountObserver extends EventTarget {
    #mountInit;
    //#rootMutObs: RootMutObs | undefined;
    #abortController;
    mountedElements;
    #mountedList;
    #disconnected;
    //#unmounted: WeakSet<Element>;
    #isComplex;
    objNde;
    constructor(init) {
        super();
        const { on, whereElementIntersectsWith, whereMediaMatches } = init;
        let isComplex = false;
        //TODO:  study this problem further.  Starting to think this is basically not polyfillable
        if (on !== undefined) {
            const reducedMatch = on.replaceAll(':not(', '');
            isComplex = reducedMatch.includes(' ') || (reducedMatch.includes(':') && reducedMatch.includes('('));
        }
        this.#isComplex = isComplex;
        if (whereElementIntersectsWith || whereMediaMatches)
            throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.mountedElements = new WeakSet();
        this.#disconnected = new WeakSet();
        //this.#unmounted = new WeakSet();
    }
    #calculatedSelector;
    #attrParts;
    #fullListOfEnhancementAttrs;
    async observedAttrs() {
        await this.#selector();
        return this.#fullListOfEnhancementAttrs;
    }
    //get #attrVals
    async #selector() {
        if (this.#calculatedSelector !== undefined)
            return this.#calculatedSelector;
        const { on, whereAttr } = this.#mountInit;
        const withoutAttrs = on || '*';
        if (whereAttr === undefined)
            return withoutAttrs;
        const { getWhereAttrSelector } = await import('./getWhereAttrSelector.js');
        const info = await getWhereAttrSelector(whereAttr, withoutAttrs);
        const { fullListOfAttrs, calculatedSelector, partitionedAttrs } = info;
        this.#fullListOfEnhancementAttrs = fullListOfAttrs;
        this.#attrParts = partitionedAttrs;
        this.#calculatedSelector = calculatedSelector;
        return this.#calculatedSelector;
    }
    async composeFragment(fragment, level) {
        const bis = fragment.querySelectorAll(inclTemplQry);
        for (const bi of bis) {
            await this.#compose(bi, level);
        }
    }
    async #compose(el, level) {
        if (!el.hasAttribute('src')) {
            return;
        }
        const { compose } = await import('./compose.js');
        await compose(this, el, level);
    }
    #templLookUp = new Map();
    findByID(id, fragment) {
        if (this.#templLookUp.has(id))
            return this.#templLookUp.get(id);
        let templ = fragment.getElementById(id);
        if (templ === null) {
            let rootToSearchOutwardFrom = ((fragment.isConnected ? fragment.getRootNode() : this.#mountInit.withTargetShadowRoot) || document);
            templ = rootToSearchOutwardFrom.getElementById(id);
            while (templ === null && rootToSearchOutwardFrom !== document) {
                rootToSearchOutwardFrom = (rootToSearchOutwardFrom.host || rootToSearchOutwardFrom).getRootNode();
                templ = rootToSearchOutwardFrom.getElementById(id);
            }
        }
        if (templ !== null)
            this.#templLookUp.set(id, templ);
        return templ;
    }
    disconnect(within) {
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
        this.dispatchEvent(new Event('disconnectedCallback'));
    }
    async observe(within) {
        await this.#selector();
        this.objNde = new WeakRef(within);
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
        const fullListOfAttrs = this.#fullListOfEnhancementAttrs;
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
            let attrChangeInfosMap;
            for (const mutationRecord of mutationRecords) {
                const { addedNodes, type, removedNodes } = mutationRecord;
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element);
                addedElements.forEach(x => elsToInspect.push(x));
                if (type === 'attributes') {
                    const { target, attributeName, oldValue } = mutationRecord;
                    if (target instanceof Element && attributeName !== null /*&& this.#mounted.has(target)*/) {
                        if (fullListOfAttrs !== undefined) {
                            const idx = fullListOfAttrs.indexOf(attributeName);
                            if (idx !== -1) {
                                if (attrChangeInfosMap === undefined)
                                    attrChangeInfosMap = new Map();
                                let attrChangeInfos = attrChangeInfosMap.get(target);
                                if (attrChangeInfos === undefined) {
                                    attrChangeInfos = [];
                                    attrChangeInfosMap.set(target, attrChangeInfos);
                                }
                                const newValue = target.getAttribute(attributeName);
                                const parts = this.#attrParts[idx];
                                const attrChangeInfo = {
                                    isSOfTAttr: false,
                                    oldValue,
                                    name: attributeName,
                                    newValue,
                                    idx,
                                    parts
                                };
                                attrChangeInfos.push(attrChangeInfo);
                            }
                        }
                    }
                    elsToInspect.push(target);
                }
                const deletedElements = Array.from(removedNodes).filter(x => x instanceof Element);
                for (const deletedElement of deletedElements) {
                    this.#disconnected.add(deletedElement);
                    if (doDisconnect !== undefined) {
                        doDisconnect(deletedElement, this, {});
                    }
                    this.dispatchEvent(new DisconnectEvent(deletedElement));
                }
            }
            if (attrChangeInfosMap !== undefined) {
                for (const [key, value] of attrChangeInfosMap) {
                    this.dispatchEvent(new AttrChangeEvent(key, value));
                }
            }
            this.#filterAndMount(elsToInspect, true, false);
        }, { signal: this.#abortController.signal });
        await this.#inspectWithin(within, true);
    }
    static synthesize(within, customElement, mose) {
        mose.type = 'mountobserver';
        const name = customElements.getName(customElement);
        if (name === null)
            throw 400;
        let instance = within.querySelector(name);
        if (instance === null) {
            instance = new customElement();
            if (within === document) {
                within.head.appendChild(instance);
            }
            else {
                within.appendChild(instance);
            }
        }
        instance.appendChild(mose);
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
        const alreadyMounted = await this.#filterAndDismount();
        const mount = this.#mountInit.do?.mount;
        const { import: imp } = this.#mountInit;
        for (const match of matching) {
            if (alreadyMounted.has(match))
                continue;
            this.mountedElements.add(match);
            if (imp !== undefined) {
                switch (typeof imp) {
                    case 'string':
                        this.module = await import(imp);
                        break;
                    case 'object':
                        if (Array.isArray(imp)) {
                            throw 'NI: Firefox';
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
            //should we automatically call readAttrs?
            //the thinking is it might make more sense to call that after mounting
            this.#mountedList?.push(new WeakRef(match));
        }
    }
    readAttrs(match, branchIndexes) {
        const fullListOfAttrs = this.#fullListOfEnhancementAttrs;
        const attrChangeInfos = [];
        const oldValue = null;
        if (fullListOfAttrs !== undefined) {
            const attrParts = this.#attrParts;
            for (let idx = 0, ii = fullListOfAttrs.length; idx < ii; idx++) {
                const parts = attrParts[idx];
                const { branchIdx } = parts;
                if (branchIndexes !== undefined) {
                    if (!branchIndexes.has(branchIdx))
                        continue;
                }
                const name = fullListOfAttrs[idx];
                const newValue = match.getAttribute(name);
                attrChangeInfos.push({
                    idx,
                    isSOfTAttr: false,
                    newValue,
                    oldValue,
                    name,
                    parts
                });
            }
        }
        const { observedAttrsWhenMounted } = this.#mountInit;
        if (observedAttrsWhenMounted !== undefined) {
            for (const observedAttr of observedAttrsWhenMounted) {
                const attrIsString = typeof observedAttr === 'string';
                const name = attrIsString ? observedAttr : observedAttr.name;
                let mapsTo;
                let newValue = match.getAttribute(name);
                if (!attrIsString) {
                    const { customParser, instanceOf, mapsTo: mt, valIfNull } = observedAttr;
                    if (instanceOf || customParser)
                        throw 'NI';
                    if (newValue === null)
                        newValue = valIfNull;
                    mapsTo = mt;
                }
                attrChangeInfos.push({
                    isSOfTAttr: true,
                    newValue,
                    oldValue,
                    name,
                    mapsTo
                });
            }
        }
        return attrChangeInfos;
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
    async #filterAndDismount() {
        const returnSet = new Set();
        if (this.#mountedList !== undefined) {
            const previouslyMounted = this.#mountedList.map(x => x.deref());
            const { whereSatisfies, whereInstanceOf } = this.#mountInit;
            const match = await this.#selector();
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
        const match = await this.#selector();
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
        for (const elToMount of elsToMount) {
            if (elToMount.matches(inclTemplQry)) {
                await this.#compose(elToMount, 0);
            }
        }
        this.#mount(elsToMount, initializing);
    }
    async #inspectWithin(within, initializing) {
        await this.composeFragment(within, 0);
        const els = Array.from(within.querySelectorAll(await this.#selector()));
        this.#filterAndMount(els, false, initializing);
    }
}
const refCountErr = 'mount-observer ref count mismatch';
export const inclTemplQry = 'template[src^="#"]:not([hidden])';
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
    attrChangeInfos;
    static eventName = 'attrChange';
    constructor(mountedElement, attrChangeInfos) {
        super(AttrChangeEvent.eventName);
        this.mountedElement = mountedElement;
        this.attrChangeInfos = attrChangeInfos;
    }
}
//const hasRootInDefault =  ['data', 'enh', 'data-enh']
