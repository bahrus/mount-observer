# builtIns.goViral built in handler

Scoped custom element registries are great, in that they can avoid name clashes in a micro-front end environment.

However there are some scenarios where we really need a mount observer to cross into all the custom element registries.  I'm foundering to figure out how to do that, for some critical observers.  


For example, I would really like to make support for the mount observer script element as seamlessly as possible, and cross over into elements with different registries as seamlessly as possible.  Maybe a little bit of "buy-in" should be needed, and I'm thinking that the most elegant solution for buy-in to work would be to write a web component can attach these core mount observers into any ShadowRoot, any family of nested elements having the same scope, but simply plopping such an element.  I'm thinking this package won't have the base custom element.  I'm leaning towards making another package that depends on this one, [mount-observer-script-elements](https://github.com/bahrus/mount-observer-script-element) support this.  But at a minimum we need to figure out what can help with that effort, adding the needed primitives to this package.

Right now, to bootstrap support for the builtIns. and 

```HTML
    import { MountObserver } from 'mount-observer';
    
    // Handler provides matching and whereInstanceOf via static properties
    const observer = new MountObserver({
        do: 'builtIns.mountObserverScript'
    });
    observer.observe(document);
```

What this does:

1.  Adds a mountObserver that watches for elements from a different custom element scope from the one that matched above
2.  Checks if a WeakReference to that scope has already been set for that registry and the MountConfig of the observer above (this could be tricky to get right).  If found, skips.  If not, immediately add to the WeakReference so no other duplicate mount config gets added for the same custom element registry.
3.  Clones the matching mountobserver above and, if the matching element from another scope has the same rootNode as the one above, sets the id to a different guid.
4.  Appends the clone to the matching element from that different scope.