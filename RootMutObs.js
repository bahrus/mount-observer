export class RootMutObs extends EventTarget {
    constructor(rootNode) {
        super();
        this.#mutationObserver = new MutationObserver(mutationRecords => {
            this.dispatchEvent(new MutationEvent(mutationRecords));
        });
        this.#mutationObserver.observe(rootNode, {
            subtree: true,
            childList: true,
            attributes: true,
        });
    }
    #mutationObserver;
}
/**
 * The `mutation-event` event represents something that happened.
 * We can document it here.
 */
export class MutationEvent extends Event {
    mutationRecords;
    static eventName = 'mutation-event';
    constructor(mutationRecords) {
        // Since these are hard-coded, dispatchers can't get them wrong
        super(MutationEvent.eventName);
        this.mutationRecords = mutationRecords;
    }
}
