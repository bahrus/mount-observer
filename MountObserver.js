import { RootMutObs } from './RootMutObs.js';
import { bindish, bindishIt } from './bindish.js';
export const guid = '5Pv6bHOVH0ae07opRZ8N/g';
export const wasItemReffed = Symbol.for('8aA6xB8+PkScmivaslBk5Q');
export const mutationObserverLookup = new WeakMap();
const refCount = new WeakMap();
export class MountObserver extends EventTarget {
    #mountInit;
    #options;
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
        if (whereElementIntersectsWith)
            throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.mountedElements = {
            weakSet: new WeakSet(),
            setWeak: new Set(),
        };
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
    //This method is called publicly from outside mount-observer -- keep it public
    async composeFragment(fragment, level) {
        const bis = fragment.querySelectorAll(`${inclTemplQry}`);
        for (const bi of bis) {
            if (bi.getAttribute('rel') === 'preload') {
                (await import('./preloadContent.js')).preloadContent(bi);
            }
            else {
                await this.#compose(bi, level);
            }
        }
    }
    async #compose(el, level) {
        const src = el.getAttribute('src');
        if (src === null || src.length < 2)
            return;
        const refType = src[0];
        if (!['!', '#'].includes(refType))
            return;
        const { compose } = await import('./compose.js');
        await compose(this, el, level, src.substring(1), refType);
    }
    #templLookUp = new Map();
    #searchForComment(refName, fragment) {
        const iterator = document.evaluate(`//comment()[.="${refName}"]`, fragment, null, XPathResult.ANY_TYPE, null);
        //console.log({xpathResult})
        try {
            let thisNode = iterator.iterateNext();
            return thisNode;
        }
        catch (e) {
            return null;
        }
    }
    async findByID(refName, fragment, refType) {
        if (this.#templLookUp.has(refName))
            return this.#templLookUp.get(refName);
        let templ = null;
        templ = refType === '#' ? fragment.querySelector(`#${refName}`) : this.#searchForComment(refName, fragment);
        if (templ === null) {
            let rootToSearchOutwardFrom = ((fragment.isConnected ? fragment.getRootNode() : this.#mountInit.withTargetShadowRoot) || document);
            templ = refType === '#' ? rootToSearchOutwardFrom.getElementById(refName) : this.#searchForComment(refName, rootToSearchOutwardFrom);
            while (templ === null && rootToSearchOutwardFrom !== document) {
                rootToSearchOutwardFrom = (rootToSearchOutwardFrom.host || rootToSearchOutwardFrom).getRootNode();
                templ = refType === '#' ? rootToSearchOutwardFrom.getElementById(refName) : this.#searchForComment(refName, rootToSearchOutwardFrom);
            }
        }
        if (templ !== null) {
            if (!(templ instanceof HTMLTemplateElement)) {
                const newTempl = document.createElement('template');
                const { getAdjRefs } = await import('./refid/getAdjRefs.js');
                const adjRefs = getAdjRefs(templ);
                // if(adjRefs.length > 1){
                //     (<any>newTempl)[wasItemReffed] = true;
                //     adjRefs[0].setAttribute('itemref', '<autogen>');
                // }
                const fragment = document.createDocumentFragment();
                let first = true;
                for (const adjRef of adjRefs) {
                    const clone = adjRef.cloneNode(true);
                    if (refType === '#' && clone instanceof Element) {
                        if (first && adjRefs.length > 1) {
                            clone.setAttribute('itemref', '<autogen>');
                            newTempl[wasItemReffed] = true;
                            first = false;
                        }
                        clone.removeAttribute('id');
                    }
                    fragment.appendChild(clone);
                }
                if (templ instanceof Element) {
                    const { doCleanup } = await import('./doCleanup.js');
                    doCleanup(templ, fragment);
                }
                else {
                    //TODO: cleanup
                }
                newTempl.content.appendChild(fragment);
                templ = newTempl;
            }
            this.#templLookUp.set(refName, templ);
        }
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
    async observe(within, options) {
        this.#options = options;
        const init = this.#mountInit;
        const { whereMediaMatches } = init;
        if (whereMediaMatches === undefined) {
            await this.#observe2(within);
            return;
        }
        const mql = window.matchMedia(whereMediaMatches);
        if (mql.matches) {
            await this.#observe2(within);
        }
        mql.addEventListener('change', async (e) => {
            if (e.matches) {
                if (this.objNde === undefined) {
                    await this.#observe2(within);
                }
                else {
                    await this.#mountAll();
                }
            }
            else {
                if (this.objNde !== undefined) {
                    await this.#dismountAll();
                }
            }
        });
    }
    async #observe2(within) {
        await this.#selector();
        this.objNde = new WeakRef(within);
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        if (!mutationObserverLookup.has(nodeToMonitor)) {
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor, this.#mountInit));
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
            this.#filterAndMount(elsToInspect, within, true, false);
            for (const el of elsToInspect) {
                await this.#inspectWithin(el, false);
            }
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
        const me = this.mountedElements;
        const options = this.#options;
        for (const match of matching) {
            if (alreadyMounted.has(match))
                continue;
            if (!me.weakSet.has(match)) {
                me.setWeak.add(new WeakRef(match));
                me.weakSet.add(match);
            }
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
            if (options?.leaveBreadcrumb) {
                if (match[guid] === undefined) {
                    match[guid] = new Set();
                }
                match[guid].add(this);
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
    async #dismountAll() {
        const mounted = this.#mountedList;
        if (mounted === undefined)
            return;
        this.#dismount(mounted.map(x => x.deref()).filter(x => x !== undefined));
    }
    async #mountAll() {
        //TODO:  copilot created, check if needed
        const { whereSatisfies, whereInstanceOf } = this.#mountInit;
        const match = await this.#selector();
        const els = Array.from(document.querySelectorAll(match));
        this.#filterAndMount(els, document.body, false, true);
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
                //TODO:  add check for outside
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
    #outsideCheck(oElement, matchCandidate, outside) {
        const elementsToExclude = Array.from(oElement.querySelectorAll(outside));
        for (const elementToExclude of elementsToExclude) {
            if (elementToExclude === matchCandidate || elementToExclude.contains(matchCandidate))
                return false;
        }
        return true;
    }
    async #filterAndMount(els, target, checkMatch, initializing) {
        const { whereSatisfies, whereInstanceOf, assigner, outside } = this.#mountInit;
        const match = await this.#selector();
        const elsToMount = els.filter(x => {
            if (checkMatch) {
                if (!x.matches(match))
                    return false;
                //TODO:  check for outside
            }
            if (outside !== undefined) {
                if (!this.#outsideCheck(this.objNde.deref(), x, outside))
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
                if (elToMount instanceof HTMLTemplateElement && elToMount.getAttribute('rel') === 'preload') {
                    (await import('./preloadContent.js')).preloadContent(elToMount /*, this.#mountInit.withTargetShadowRoot*/);
                }
                else {
                    await this.#compose(elToMount, 0);
                }
            }
        }
        await bindishIt(els, target, { assigner });
        if (elsToMount.length === 0)
            return;
        this.#mount(elsToMount, initializing);
    }
    async #inspectWithin(within, initializing) {
        //the line below had an await for bindish, consistent with the rest of the code, but it was
        //getting into a catch-22 scenario frequently, blocking the code for resuming.
        //This was observed with per-each package, demo/ScopeScript.html, clicking refresh a few times
        //one will see the inconsistent behavior if await is added below.
        const genids = Array.from(within.querySelectorAll('[-id]'));
        if (genids[0]) {
            const { genIds } = await import('./refid/genIds.js');
            for (const el of genids) {
                genIds(el);
                el.removeAttribute('-id');
            }
        }
        bindish(within, within, { assigner: this.#mountInit.assigner });
        await this.composeFragment(within, 0);
        const match = await this.#selector();
        const els = Array.from(within.querySelectorAll(match));
        this.#filterAndMount(els, within, false, initializing);
    }
}
export function waitForIdleNodes(nodes, idleTimeout) {
    const mountInit = {
        idleTimeout
    };
    return new Promise((resolve) => {
        const mutObservers = [];
        for (const node of nodes) {
            const mutObs = mutationObserverLookup.get(node);
            if (mutObs !== undefined) {
                mutObservers.push(mutObs);
            }
            else {
                const currentCount = refCount.get(node) || 0;
                const newMutObs = new RootMutObs(node, mountInit);
                mutationObserverLookup.set(node, newMutObs);
                refCount.set(node, currentCount + 1);
                mutObservers.push(newMutObs);
            }
        }
        if (areAllIdle(mutObservers)) {
            resolve();
        }
        for (const obs of mutObservers) {
            obs.addEventListener('is-idle', () => {
                if (areAllIdle(mutObservers)) {
                    resolve();
                }
            });
        }
    });
}
function areAllIdle(mutObs) {
    for (const mo of mutObs) {
        if (!mo.isIdle)
            return false;
    }
    return true;
}
const refCountErr = 'mount-observer ref count mismatch';
export const inclTemplQry = 'template[src^="#"]:not([hidden]),template[src^="!"]:not([hidden])';
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
