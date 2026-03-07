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
    checkIfAllowed(mose) {
        if (this.hasAttribute('passthrough'))
            return false;
        const { id } = mose;
        if (this.hasAttribute('include')) {
            const split = this.getAttribute('include').split(' ');
            if (!split.includes(id))
                return false;
        }
        if (this.hasAttribute('exclude')) {
            const split = this.getAttribute('exclude').split(' ');
            if (split.includes(id))
                return false;
        }
        return true;
    }
    activate(mose) {
        if (!this.checkIfAllowed(mose))
            return;
        mose.dispatchEvent(new LoadEvent());
        const { init, do: d } = mose;
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
        se.type = 'mountobserver';
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
        let parentScopeSynthesizer = parentShadowRealm.querySelector(localName);
        if (parentScopeSynthesizer === null) {
            parentScopeSynthesizer = document.createElement(localName);
            if (parentShadowRealm === document) {
                document.head.appendChild(parentScopeSynthesizer);
            }
            else {
                parentShadowRealm.appendChild(parentScopeSynthesizer);
            }
        }
        ;
        const { mountObserverElements } = parentScopeSynthesizer;
        for (const moe of mountObserverElements) {
            this.import(moe);
        }
        parentScopeSynthesizer.addEventListener(SynthesizeEvent.eventName, e => {
            this.import(e.mountObserverElement);
        });
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
export class LoadEvent extends Event {
    static eventName = 'load';
    constructor() {
        super(LoadEvent.eventName);
    }
}
