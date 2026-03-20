# Syndicating Mount Observers with Synthesizer

This requirement is to resurrect the legacy/Synthesizer.ts abstract class, but hopefully better, and certainly in accordance with all the changes that have happened to this package.

I am unhappy with how "mountGlobally" works, and will probably create another requirement to retire that functionality.

Namely, the way that mountGlobally discovers elements that have ShadowDOM roots is problematic.  The Synthesizer will provide a fool proof way for syndicating mount observer script elements and emc script elements across shadow roots.

Let's focus for now squarely on syndicating to ShadowRoots, and leave the question of syndicating to other customElementRegistries to another requirement.


What a Synthesizer instance needs to do:

1.  Identify its root node via this.getRootNode().
2.  Ensure that one and only one instance of any custom element that extends Synthesizer does the following:

    1.  Attaches the following builtin's to the shadowRoot/document found in step 1:
        1. builtIns.mountObserverScript
        2. builtIns.scriptExport
        3. builtIns.HTMLInclude
        4. builtIns.hoistTemplate
        5. builtIns.emcScript

    2.  This is done via mount, not globalMount

3.  Each instance of the custom element checks if its root node is the document root or a shadowRoot.  If it is the document root, then that instance acts as a syndicator, that syndicates script elements to the subscribers with matching localName's.  If it is inside a ShadowRoot, then that instance acts as subscriber, and subscribes to the syndicator sitting in the document root.

## Duties of the syndicator

The syndicator emits an event class instance AddedScriptElement (added to Events.ts) with event name addedscriptelement whenever a script element with type "mountobserver" or "emc" is added to the light children.  The AddedScriptElement event instance has the script element added as a public property of the event.

## Duties of the subscriber

Subscribers find the custom element instance in the document root that matches the localName.

It does a querySelectorAll('script') and passes them through a processor.

It also subscribes to teh addescriptelement event and passes the script element to the processor.

## Duties of the subscriber processor

The processor checks if the "export" property has been attached to the script element.  If it hasn't it uses the package module assign-gingerly/waitForEvent.js to wait for the resolved event.  Once this happens, it:

1.  Clones the script element.
2.  Copies in the export property
3.  Appends the cloned script element to its child elements.


