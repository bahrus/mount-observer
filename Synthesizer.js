import { MountObserver } from './MountObserver.js';
export class Synthesizer extends HTMLElement {
    #mutationObserver;
    mountObserverElements = [];
    mutationCallback(mutationList) {
        for (const mutation of mutationList) {
            const { addedNodes } = mutation;
            for (const node of addedNodes) {
                if (!(node instanceof HTMLScriptElement) || node.type !== 'mountobserver')
                    continue;
                const mose = node;
                this.mountObserverElements.push(mose);
                this.activate(mose);
                const e = new SynthesizeEvent(mose);
                this.dispatchEvent(e);
            }
        }
    }
    connectedCallback() {
        this.hidden = true;
        const init = {
            childList: true
        };
        this.querySelectorAll('script[type="mountobserver"]').forEach(s => {
            const mose = s;
            this.mountObserverElements.push(mose);
            this.activate(mose);
        });
        this.#mutationObserver = new MutationObserver(this.mutationCallback.bind(this));
        this.#mutationObserver.observe(this, init);
        this.inherit();
    }
    activate(mose) {
        const { init, do: d, id } = mose;
        const mi = {
            do: d,
            ...init
        };
        const mo = new MountObserver(mi);
        mose.observer = mo;
        mo.observe(this.getRootNode());
    }
    import(mose) {
        const { init, do: d, id, synConfig } = mose;
        const se = document.createElement('script');
        se.init = { ...init };
        se.id = id;
        se.do = { ...d };
        se.synConfig = { ...synConfig };
        this.appendChild(se);
    }
    inherit() {
        const rn = this.getRootNode();
        const host = rn.host;
        if (!host)
            return;
        const parentShadowRealm = host.getRootNode();
        const { localName } = this;
        const parentScopeSynthesizer = parentShadowRealm.querySelector(localName);
        const { mountObserverElements } = parentScopeSynthesizer;
        for (const moe of mountObserverElements) {
            this.import(moe);
        }
        if (parentScopeSynthesizer !== null) {
            parentScopeSynthesizer.addEventListener(SynthesizeEvent.eventName, e => {
                this.import(e.mountObserverElement);
            });
        }
    }
    disconnectedCallback() {
        if (this.#mutationObserver !== undefined) {
            this.#mutationObserver.disconnect();
        }
        for (const mose of this.mountObserverElements) {
            mose.observer.disconnect(this.getRootNode());
        }
    }
}
// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class SynthesizeEvent extends Event {
    mountObserverElement;
    static eventName = 'synthesize';
    constructor(mountObserverElement) {
        super(SynthesizeEvent.eventName);
        this.mountObserverElement = mountObserverElement;
    }
}
