import {MountInit, MountContext} from './types';
import {RootMutObs, MutationEvent, AddEventListener} from './RootMutObs.js';


const mutationObserverLookup = new WeakMap<Node, RootMutObs>();
export class MountObserver extends EventTarget implements MountContext{
    
    #mountInit: MountInit;
    #rootMutObs: RootMutObs | undefined;
    #abortController: AbortController;
    #mounted: WeakSet<Node>;
    #isComplex: boolean;

    constructor(init: MountInit){
        super();
        const {match, whereElementIntersectsWith, whereMediaMatches} = init;
        this.#isComplex = match.includes(' ') || match.includes(':')
        if(whereElementIntersectsWith || whereMediaMatches) throw 'NI'; //not implemented
        this.#mountInit = init;
        this.#abortController = new AbortController();
        this.#mounted = new WeakSet();
    }

    observe(within: Node){
        if(!mutationObserverLookup.has(within)){
            mutationObserverLookup.set(within, new RootMutObs(within));
        }
        const rootMutObs = mutationObserverLookup.get(within)!;
        (rootMutObs as AddEventListener).addEventListener('mutation-event', (e: MutationEvent) => {

        }, {signal: this.#abortController.signal})
    }

    #confirmInstanceOf(el: Element, whereInstanceOf: Array<typeof Node>){
        for(const test of whereInstanceOf){
            if(el instanceof test) return true;
        }
        return false;
    }

    inspectWithin(within: Node){
        if('querySelectorAll' in within){
            const {match, whereSatisfies, whereInstanceOf} = this.#mountInit;
            const els = Array.from((within as Element).querySelectorAll(match))
            .filter(x => {
                if(whereSatisfies !== undefined){
                    if(!whereSatisfies(x, this, 'Inspecting')) return false;
                }
            });
        }
    }

    unobserve(){
        throw 'NI';
    }

}