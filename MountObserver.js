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
        this.#isComplex = match.includes(' ') || match.includes(':');
        if (whereElementIntersectsWith || whereMediaMatches)
            throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
        this.#disconnected = new WeakSet();
        //this.#unmounted = new WeakSet();
    }
    async observe(within) {
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        if (!mutationObserverLookup.has(nodeToMonitor)) {
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
        }
        const rootMutObs = mutationObserverLookup.get(within);
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
                //console.log({target, mutationRecord});
                const addedElements = Array.from(addedNodes).filter(x => x instanceof Element);
                addedElements.forEach(x => elsToInspect.push(x));
                if (type === 'attributes') {
                    const { target } = mutationRecord;
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
        const imp = this.#mountInit.import;
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
            const { match, whereSatisfies, whereInstanceOf } = this.#mountInit;
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
        const { match, whereSatisfies, whereInstanceOf } = this.#mountInit;
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
        const { match } = this.#mountInit;
        const els = Array.from(within.querySelectorAll(match));
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
