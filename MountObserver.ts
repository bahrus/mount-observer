import {MountInit, MountContext} from './types';
import {RootMutObs, MutationEvent, AddEventListener} from './RootMutObs.js';

declare global {
    interface WindowEventMap {
        eventName: MutationEvent;
    }
}
const mutationObserverLookup = new WeakMap<Node, RootMutObs>();
export class MountObserver extends EventTarget implements MountContext{
    
    #mountInit: MountInit;
    #rootMutObs: RootMutObs | undefined;
    #abortController: AbortController | undefined;

    constructor(init: MountInit){
        super();
        this.#mountInit = init;
    }

    observe(within: Node){
        const root = within instanceof ShadowRoot ? within : within.getRootNode();
        if(!mutationObserverLookup.has(root)){
            mutationObserverLookup.set(root, new RootMutObs(root));
        }
        const rootMutObs = mutationObserverLookup.get(root)!;
        (rootMutObs as AddEventListener).addEventListener('mutation-event', (e: MutationEvent) => {

        })
    }

    unobserve(){
        throw 'NI';
    }

}