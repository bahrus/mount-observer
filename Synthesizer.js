import { MountObserver } from './MountObserver.js';
export class Synthesizer extends HTMLElement {
    #mutationObserver;
    mountObserverElements = [];
    mutationCallback(mutationList) {
        for (const mutation of mutationList) {
            const { addedNodes } = mutation;
            for (const node of addedNodes) {
                if (!(node instanceof HTMLScriptElement))
                    continue;
                const mose = node;
                this.mountObserverElements.push(mose);
                const e = new SyntheticEvent(mose);
                this.dispatchEvent(e);
            }
        }
    }
    connectedCallback() {
        this.hidden = true;
        const init = {
            childList: true
        };
        this.#mutationObserver = new MutationObserver(this.mutationCallback);
        this.#mutationObserver.observe(this.getRootNode());
        this.#inherit();
    }
    #import(mose) {
        const { init, do: d, id } = mose;
        const se = document.createElement('script');
        se.init = init;
        se.id = id;
        se.do = d;
        const mi = {
            do: d,
            ...init
        };
        const mo = new MountObserver(mi);
        se.observer = mo;
        this.appendChild(se);
    }
    #inherit() {
        const rn = this.getRootNode();
        const host = rn.host;
        if (!host)
            return;
        const parentShadowRealm = host.getRootNode();
        const { localName } = this;
        const parentScopeSynthesizer = parentShadowRealm.querySelector(localName);
        const { mountObserverElements } = parentScopeSynthesizer;
        for (const moe of mountObserverElements) {
            this.#import(moe);
        }
        if (parentScopeSynthesizer !== null) {
            parentScopeSynthesizer.addEventListener(SyntheticEvent.eventName, e => {
                this.#import(e.mountObserverElement);
            });
        }
    }
    disconnectedCallback() {
        if (this.#mutationObserver !== undefined) {
            this.#mutationObserver.disconnect();
        }
    }
}
// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class SyntheticEvent extends Event {
    mountObserverElement;
    static eventName = 'synthesize';
    constructor(mountObserverElement) {
        super(SyntheticEvent.eventName);
        this.mountObserverElement = mountObserverElement;
    }
}
