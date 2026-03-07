# builtIns.goViral built in handler

Scoped custom element registries are great, in that they can avoid name clashes in a micro-front end environment.

However there are some scenarios where we really need a mount observer to cross into all the custom element registries.  I'm foundering to figure out how to do that, for some critical observers.  


For example, I would really like to make support for the mount observer script element as seamlessly as possible, and cross over into elements with different registries as seamlessly as possible.  Maybe a little bit of "buy-in" should be needed, and I'm thinking that the most elegant solution for buy-in to work would be to write a web component can attach these core mount observers into any ShadowRoot, any family of nested elements having the same scope, but simply plopping such an element.  I'm thinking this package won't have the base custom element.  I'm leaning towards making another package that depends on this one, [mount-observer-script-elements](https://github.com/bahrus/mount-observer-script-element) support this.  But at a minimum we need to figure out what can help with that effort, adding the needed primitives to this package.

Right now, to bootstrap support for the builtIns.mountObserverScript and 

```TypeScript
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Handler provides matching and whereInstanceOf via static properties
    document.observe({
        do: 'builtIns.mountObserverScript'
    });
```

So the web component mentioned above could do something like:

```TypeScript
import { MountObserver } from 'mount-observer/MountObserver.js';
const checkForMountObserverScript = Symbol.for('some-guid-string-for-mount-observer-script');
class MyCommonBuiltInHandlerHandler{
    async connectedCallback(){
        if(!this.customElementRegistry[checkForMountObserverScript]){
            this.customElementRegistry[checkForMountObserverScript] = true;
            const {MountObserver} = await import('mount-observer/MountObserver.js');
            (this.shadowRoot || this).observe({
                do: 'builtIns.mountObserverScript'
            })
        }
        
    }
}
customElements.define('some-guid-string', MyCommonBuiltInHandlerHandler);
```

So now, plopping an instance of the custom element above inside the shadowRoot or a child of an element in a different custom scope registry should do the trick.

But now the most annoying thing we have to do is register this custom element in every scoped registry, which is almost as much work as the bootstrap code needed above.

How can we leverage all the infrastructure this package supports, and "go against the grain" of how scoped custom element registries are supposed to work, and make sure every registry gets this one custom element ('some-guid-string') added?

