import {mutationEventName, AddMutationEventListener} from './ts-refs/mount-observer/types';

export class RootMutObs extends EventTarget{
    constructor(rootNode: Node ){
        super();
        this.#mutationObserver = new MutationObserver(mutationRecords => {
            this.dispatchEvent(new MutationEvent(mutationRecords))
        })
        this.#mutationObserver.observe(rootNode, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeOldValue: true,
        });
    }
    #mutationObserver: MutationObserver;
    disconnect(){
        this.#mutationObserver.disconnect();
    }
}



// https://github.com/webcomponents-cg/community-protocols/issues/12#issuecomment-872415080

/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MutationEvent extends Event implements MutationEvent {
    static eventName: mutationEventName = 'mutation-event';
  
    constructor(public mutationRecords: Array<MutationRecord>) {
      // Since these are hard-coded, dispatchers can't get them wrong
      super(MutationEvent.eventName);
    }
}



