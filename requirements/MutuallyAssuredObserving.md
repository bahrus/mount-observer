# Mutually Assured Observing

ElementMountExtension.ts adds a method to the Element prototype, 'mount', that, by default, searches for the highest containing node with matching customElementRegistry, and starts monitoring that node for matching elements to mount.  That is if the default option of 'root' is selected.

But here's the thing:  The scoped custom element registry feature allows for multiple "islands" of nodes that share the same customElementRegistry, as demonstrated by /demo/TestOfScope.html

To my knowledge, we don't have a way for one island to automatically notify other islands that share the same customElementRegistry.  However, I think it is reasonable to expect that a developer would want all instances of elements that share the same registry to be subject to the same mounting observations.

I'm thinking that we add another category to MountScope that should be the default value:  'customElementRegistry'.  When we add a mount observer, that customElementRegistry maintains a registry of "mountRegistries'.

In support of that idea, we need an API of some sort an element to say "I'm here, please find my root scope, add all the joint mountObservers to start observing my island, and if a mountObserver is added withMountScope 'customElementRegistry' with my root, it should apply to all the other islands as well. 