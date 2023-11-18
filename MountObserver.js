import { RootMutObs } from './RootMutObs.js';
const mutationObserverLookup = new WeakMap();
export class MountObserver extends EventTarget {
    #mountInit;
    #rootMutObs;
    #abortController;
    constructor(init) {
        super();
        this.#mountInit = init;
        this.#abortController = new AbortController();
    }
    observe(within) {
        const root = within instanceof ShadowRoot ? within : within.getRootNode();
        if (!mutationObserverLookup.has(root)) {
            mutationObserverLookup.set(root, new RootMutObs(root));
        }
        const rootMutObs = mutationObserverLookup.get(root);
        rootMutObs.addEventListener('mutation-event', (e) => {
        }, { signal: this.#abortController.signal });
    }
    unobserve() {
        throw 'NI';
    }
}
