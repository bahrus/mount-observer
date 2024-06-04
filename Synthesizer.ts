import {MountInit, MOSE} from './types';
import {MountObserver} from './MountObserver.js';

export abstract class Synthesizer extends HTMLElement{
    #mutationObserver: MutationObserver | undefined;

    mountObserverElements: Array<MOSE> = [];

    mutationCallback(mutationList: Array<MutationRecord>){
        for (const mutation of mutationList) {
            const {addedNodes} = mutation;
            for(const node of addedNodes){
                if(!(node instanceof HTMLScriptElement) || node.type !== 'mountobserver') continue;
                const mose = node as MOSE;
                this.mountObserverElements.push(mose);
                this.activate(mose);
                const e = new SynthesizeEvent(mose);
                this.dispatchEvent(e);
            }
            
        }
    }

    connectedCallback(){
        this.hidden = true;
        const init: MutationObserverInit = {
            childList: true
        };
        this.querySelectorAll('script[type="mountobserver"]').forEach(s => {
            const mose = s as MOSE;
            this.mountObserverElements.push(mose);
            this.activate(mose);
        })
        this.#mutationObserver = new MutationObserver(this.mutationCallback.bind(this));
        this.#mutationObserver.observe(this, init);
        this.inherit();
    }

    activate(mose: MOSE){
        const {init, do: d, id} = mose;
        const mi: MountInit = {
            do: d,
            ...init
        };
        const mo = new MountObserver(mi);
        mose.observer = mo;
        mo.observe(this.getRootNode());
    }

    import(mose: MOSE){
        const {init, do: d, id, synConfig} = mose;
        const se = document.createElement('script') as MOSE;
        se.type='mountobserver';
        se.init = {...init};
        se.id = id;
        se.do = {...d};
        se.synConfig = {...synConfig};
        this.appendChild(se);
    }

    inherit(){
        const rn = this.getRootNode();
        const host = (<any>rn).host;
        if(!host) return;
        const parentShadowRealm = host.getRootNode();
        const {localName} = this;
        let parentScopeSynthesizer = parentShadowRealm.querySelector(localName) as Synthesizer;
        if(parentScopeSynthesizer === null) {
            parentScopeSynthesizer = document.createElement(localName) as Synthesizer;
            if(parentShadowRealm === document) {
                document.head.appendChild(parentScopeSynthesizer);
            }else{
                parentShadowRealm.appendChild(parentScopeSynthesizer);
            }
        };
        const {mountObserverElements} = parentScopeSynthesizer;
        for(const moe of mountObserverElements){
            this.import(moe);
        }
        parentScopeSynthesizer.addEventListener(SynthesizeEvent.eventName, e => {
            this.import((e as SynthesizeEvent).mountObserverElement)
        })

    }
    disconnectedCallback(){
        if(this.#mutationObserver !== undefined){
            this.#mutationObserver.disconnect();
        }
        for(const mose of this.mountObserverElements){
            mose.observer.disconnect(this.getRootNode());
        }
    }
}

// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class SynthesizeEvent extends Event{
    static eventName = 'synthesize';
  
    constructor(public mountObserverElement: MOSE) {
      super(SynthesizeEvent.eventName);
    }
}