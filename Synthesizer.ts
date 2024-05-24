import {MountInit, MountObserverScriptElement} from './types';
import {MountObserver} from './MountObserver.js';

export abstract class Synthesizer extends HTMLElement{
    #mutationObserver: MutationObserver | undefined;

    mountObserverElements: Array<MountObserverScriptElement> = [];

    mutationCallback(mutationList: Array<MutationRecord>){
        for (const mutation of mutationList) {
            const {addedNodes} = mutation;
            for(const node of addedNodes){
                if(!(node instanceof HTMLScriptElement)) continue;
                const mose = node as MountObserverScriptElement;
                this.mountObserverElements.push(mose);
                const e = new SyntheticEvent(mose);
                this.dispatchEvent(e);
            }
            
        }
    }

    connectedCallback(){
        this.hidden = true;
        const init: MutationObserverInit = {
            childList: true
        };
        this.#mutationObserver = new MutationObserver(this.mutationCallback);
        this.#mutationObserver.observe(this);
        this.#inherit();
    }

    #import(mose: MountObserverScriptElement){
        const {init, do: d, id} = mose;
        const se = document.createElement('script') as MountObserverScriptElement;
        se.init = init;
        se.id = id;
        se.do = d;
        const mi: MountInit = {
            do: d,
            ...init
        };
        const mo = new MountObserver(mi);
        se.observer = mo;
        this.appendChild(se);
        
    }

    #inherit(){
        const rn = this.getRootNode();
        const host = (<any>rn).host;
        if(!host) return;
        const parentShadowRealm = host.getRootNode();
        const {localName} = this;
        const parentScopeSynthesizer = parentShadowRealm.querySelector(localName) as Synthesizer;
        const {mountObserverElements} = parentScopeSynthesizer;
        for(const moe of mountObserverElements){
            this.#import(moe);
        }
        if(parentScopeSynthesizer !== null){
            parentScopeSynthesizer.addEventListener(SyntheticEvent.eventName, e => {
                this.#import((e as SyntheticEvent).mountObserverElement)
            })

        }
    }
    disconnectedCallback(){
        if(this.#mutationObserver !== undefined){
            this.#mutationObserver.disconnect();
        }
    }
}

// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class SyntheticEvent extends Event{
    static eventName = 'synthesize';
  
    constructor(public mountObserverElement: MountObserverScriptElement) {
      super(SyntheticEvent.eventName);
    }
}