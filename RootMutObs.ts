export class RootMutObs extends EventTarget{
    constructor(rootNode: ShadowRoot | Document, ){
        super();
        this.#mutationObserver = new MutationObserver(mutationRecords => {
            this.dispatchEvent(new MutationEvent(mutationRecords))
        })
        this.#mutationObserver.observe(rootNode, {
            subtree: true,
            childList: true,
            attributes: true,
        });
    }
    #mutationObserver: MutationObserver;
}

// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080

/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MutationEvent extends Event {
    static eventName = 'mutation-event';
  
    constructor(public mutationRecords: Array<MutationRecord>) {
      // Since these are hard-coded, dispatchers can't get them wrong
      super(MutationEvent.eventName, {bubbles: false, cancelable: true, composed: false});
      
    }
}