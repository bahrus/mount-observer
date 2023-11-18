import { RootMutObs } from './RootMutObs.js';
const mutationObserverLookup = new WeakMap();
export class MountObserver extends EventTarget {
    #mountInit;
    #rootMutObs;
    #abortController;
    #mounted;
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
    }
    async observe(within) {
        const nodeToMonitor = this.#isComplex ? (within instanceof ShadowRoot ? within : within.getRootNode()) : within;
        if (!mutationObserverLookup.has(nodeToMonitor)) {
            mutationObserverLookup.set(nodeToMonitor, new RootMutObs(nodeToMonitor));
        }
        const rootMutObs = mutationObserverLookup.get(within);
        rootMutObs.addEventListener('mutation-event', (e) => {
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
        const onMount = this.#mountInit.do?.onMount;
        const ;
    }
    import = this.#m;
    for(, match, of, matching) {
        this.#mounted.add(match);
        if (onMount !== undefined)
            onMount(match, this, '');
        this.dispatchEvent(new MountEvent(match));
    }
}
async;
#inspectWithin(within, Node);
{
    if ('querySelectorAll' in within) {
        const { match, whereSatisfies, whereInstanceOf } = this.#mountInit;
        const els = Array.from(within.querySelectorAll(match))
            .filter(x => {
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
    }
}
unobserve();
{
    throw 'NI';
}
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
