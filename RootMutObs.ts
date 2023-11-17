export class RootMutObs extends EventTarget{
    constructor(rootNode: ShadowRoot | Document, ){
        super();
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
 * The `my-event` event represents something that happened.
 * We can document it here.
 */
export class MutationEvent extends Event {
    static eventName = 'mutation-event';
  
    /** We can easily document properties */
    foo;
  
    /**
     * You can add properties over time without breaking.
     * If we used CustomEvent we'd have to advise that detail is always an object
     */
    bar;
  
    constructor(foo, bar) {
      // Since these are hard-coded, dispatchers can't get them wrong
      super(MutationEvent.eventName, {bubbles: true, cancelable: true, composed: true});
      
      // users are forced to provide parameters. You can do validation here you can't do with
      // detail objects
      this.foo = foo;
      this.bar =  bar;
    }
  }