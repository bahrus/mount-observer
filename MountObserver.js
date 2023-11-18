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
    observe(within) {
        if (!mutationObserverLookup.has(within)) {
            mutationObserverLookup.set(within, new RootMutObs(within));
        }
        const rootMutObs = mutationObserverLookup.get(within);
        rootMutObs.addEventListener('mutation-event', (e) => {
        }, { signal: this.#abortController.signal });
    }
    #confirmInstanceOf(el, whereInstanceOf) {
        for (const test of whereInstanceOf) {
            if (el instanceof test)
                return true;
        }
        return false;
    }
    inspectWithin(within) {
        if ('querySelectorAll' in within) {
            const { match, whereSatisfies, whereInstanceOf } = this.#mountInit;
            const els = Array.from(within.querySelectorAll(match))
                .filter(x => {
                if (whereSatisfies !== undefined) {
                    if (!whereSatisfies(x, this, 'Inspecting'))
                        return false;
                }
            });
        }
    }
    unobserve() {
        throw 'NI';
    }
}
