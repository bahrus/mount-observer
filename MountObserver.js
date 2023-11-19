import { RootMutObs } from './RootMutObs.js';
const mutationObserverLookup = new WeakMap();
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
        const { match, whereElementIntersectsWith, whereMediaMatches } = init;
        this.#isComplex = match !== undefined && (match.includes(' ') || match.includes(':'));
        if (whereElementIntersectsWith || whereMediaMatches)
            throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
        this.#disconnected = new WeakSet();
        //this.#unmounted = new WeakSet();
    }
    #calculatedSelector;
    get #selector() {
        if (this.#calculatedSelector !== undefined)
            return this.#calculatedSelector;
        const { match, attribMatches } = this.#mountInit;
        const base = match || '*';
        if (attribMatches === undefined)
            return base;
        const matches = [];
        attribMatches.forEach(x => {
            const { names } = x;
            names.forEach(y => {
                matches.push(`${base}[${y}]`);
            });
        });
        this.#calculatedSelector = matches.join(',');
        return this.#calculatedSelector;
    }
    async observe(within) {
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        if (!mutationObserverLookup.has(nodeToMonitor)) {
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
        }
        const rootMutObs = mutationObserverLookup.get(within);
        const { attribMatches } = this.#mountInit;
        rootMutObs.addEventListener('mutation-event', (e) => {
            //TODO:  disconnected
            if (this.#isComplex) {
                this.#inspectWithin(within);
                return;
            }
            const { mutationRecords } = e;
            const elsToInspect = [];
            //const elsToDisconnect: Array<Element> = [];
            const doDisconnect = this.#mountInit.do?.onDisconnect;
            for (const mutationRecord of mutationRecords) {
                const { addedNodes, type, removedNodes } = mutationRecord;
                console.log(mutationRecord);
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element);
                addedElements.forEach(x => elsToInspect.push(x));
                if (type === 'attributes') {
                    const { target, attributeName, oldValue } = mutationRecord;
                    if (target instanceof Element && attributeName !== null && attribMatches !== undefined && this.#mounted.has(target)) {
                        let idx = 0;
                        for (const attrMatch of attribMatches) {
                            const { names } = attrMatch;
                            if (names.includes(attributeName)) {
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
                                const attrChangeInfo = {
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
                    elsToInspect.push(target);
                }
                const deletedElements = Array.from(removedNodes).filter(x => x instanceof Element);
                for (const deletedElement of deletedElements) {
                    // if(!this.#mounted.has(deletedElement)) continue;
                    // this.#mounted.delete(deletedElement);
                    // this.#mountedList = this.#mountedList?.filter(x => x.deref() !== deletedElement);
                    this.#disconnected.add(deletedElement);
                    if (doDisconnect !== undefined) {
                        doDisconnect(deletedElement, this);
                    }
                    this.dispatchEvent(new DisconnectEvent(deletedElement));
                }
            }
            this.#filterAndMount(elsToInspect, true);
        }, { signal: this.#abortController.signal });
        await this.#inspectWithin(within);
    }
    #confirmInstanceOf(el, whereInstanceOf) {
        for (const test of whereInstanceOf) {
            if (el instanceof test)
                return true;
        }
        return false;
    }
    async #mount(matching) {
        //first unmount non matching
        const alreadyMounted = this.#filterAndDismount();
        const onMount = this.#mountInit.do?.onMount;
        const { import: imp, attribMatches } = this.#mountInit;
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
                            this.module = await import(imp[0], imp[1]);
                        }
                        break;
                    case 'function':
                        this.module = await imp(match, this, 'Import');
                        break;
                }
            }
            if (onMount !== undefined)
                onMount(match, this, 'PostImport');
            this.dispatchEvent(new MountEvent(match));
            if (attribMatches !== undefined) {
            }
            this.#mountedList?.push(new WeakRef(match));
            //if(this.#unmounted.has(match)) this.#unmounted.delete(match);
        }
    }
    async #dismount(unmatching) {
        const onDismount = this.#mountInit.do?.onDismount;
        for (const unmatch of unmatching) {
            if (onDismount !== undefined) {
                onDismount(unmatch, this);
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
                    if (!whereSatisfies(x, this, 'Inspecting'))
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
    async #filterAndMount(els, checkMatch) {
        const { whereSatisfies, whereInstanceOf } = this.#mountInit;
        const match = this.#selector;
        const elsToMount = els.filter(x => {
            if (checkMatch) {
                if (!x.matches(match))
                    return false;
            }
            if (whereSatisfies !== undefined) {
                if (!whereSatisfies(x, this, 'Inspecting'))
                    return false;
            }
            if (whereInstanceOf !== undefined) {
                if (!this.#confirmInstanceOf(x, whereInstanceOf))
                    return false;
            }
            return true;
        });
        this.#mount(elsToMount);
    }
    async #inspectWithin(within) {
        const els = Array.from(within.querySelectorAll(this.#selector));
        this.#filterAndMount(els, false);
    }
    unobserve() {
        throw 'NI';
    }
}
// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MountEvent extends Event {
    mountedElement;
    static eventName = 'mount';
    constructor(mountedElement) {
        super(MountEvent.eventName);
        this.mountedElement = mountedElement;
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
