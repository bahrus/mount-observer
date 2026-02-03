# Local mount subscriber

## Use cases

The MountObserver is a useful API for progressive enhancement of elements.  While many such element enhancements will be focused squarely on adding event handlers to the matching element, and continue performing the enhancement even when the mounting conditions no longer hold, some will want to know about and act on peer elements of the matching element, and thus be interested in the element being moved around.  Also, some enhancements will want to "turn off" when no longer mounted, and not rely on a container manager managing these lifecycle events.

## getNotifier

Please add a method to the MountObserver class called getNotifier:

```JavaScript
const observer = new MountObserver({
    do: function(matchingElement, {observer}){
        const notifier = observer.getNotifier(matchingElement);
        
        // Listen to lifecycle events for this specific element
        notifier.addEventListener('mount', (e) => {
            console.log('This element mounted', e.matchingElement);
        });
        
        notifier.addEventListener('dismount', (e) => {
            console.log('This element dismounted', e.matchingElement, e.reason);
        });
        
        notifier.addEventListener('disconnect', (e) => {
            console.log('This element disconnected', e.matchingElement);
        });
    }
});
```

Typically, I would think this would be called from the do function, but it should be callable at any time, including before being mounted.

Because the element already "mounted", the notifier would not refire the mounted event until it first dismounts.

The returned object, matchingElementObserver is an EventTarget that dispatches filtered events.

All the events that the observer fires as far as mount/dismount/disconnect events would also fire from the matchingElementObserver, but only if the element being mounted / dismounted / disconnected / (reconnect in the future) is the passed in matchingElement.  No LoadEvent. It should use the same exact event classes with access to the same properties (including matchingElement)

Note that we have not yet implemented reconnect logic, so don't do anything about that yet. 

I initially thought we didn't need it for the attrchange event because I thought that is already dispatched from the element, but that is not the case.  However, on inspecting the attrchange code more closely, that event contains an array of AttrChange object, spanning multiple elements.  So in this special case, we want a special AttrChange event instance, where the list is filtered to the ones for the passed in matchingElement. The filtered AttrChangeEvent should be a new instance with a filtered changes array.

I initially though we need a Requirement14 for this, but I no longer think so, so please disregard any mention of Requirement14.

Please create one per element, on demand of getNotifier being called, and cache it, based on a weak key.  Don't worry about cleaning anything up if the element is removed.
