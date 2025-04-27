import {mutationEventName, AddMutationEventListener} from './ts-refs/mount-observer/types';

export class RootMutObs extends EventTarget{
    #idleTimeout = 20; //TODO: make this configurable
    #idlePointer = 0;
    constructor(rootNode: Node ){
        super();
        
        this.#mutationObserver = new MutationObserver(mutationRecords => {
            this.dispatchEvent(new MutationEvent(mutationRecords));
            this.#triggerIsIdle();
        });
        this.#mutationObserver.observe(rootNode, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeOldValue: true,
        });
        this.#triggerIsIdle();
    }
    #isIdle = false;
    get isIdle(){
        return this.#isIdle;
    }
    #triggerIsIdle(){
        this.#isIdle = false;
        clearTimeout(this.#idlePointer);
        this.#idlePointer = setTimeout(()=>{
            this.#isIdle = true;
            this.dispatchEvent(new Event('is-idle'));
        }, this.#idleTimeout)
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




