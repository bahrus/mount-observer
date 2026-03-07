# Custom Element Registry Mounting

With the latest WebKit/Safari (strangely, not testable on the safari that playwright provides on windows yet, last I checked) and Chrome 146+, elements now have customElementRegistry property, that provides the scope in which the element belongs as far as registries of custom elements.

In theory, given an element, we should be able to find the "highest scoped container" that has the same customElementRegistry as the element.

I think we should first create an exportable module that looks something like:

```JavaScript
getRootRegistryContainer(element: Element){
    const rn = element.getRootNode();
    const {customElementRegistry} = element;
    if(rn.customElementRegistry === customElementRegistry) return rn;
    let parent = element.parentElement;

    while(parent){
        const prevParent = parent;
        parent = parent.parentElement;
        if(parent.customElementRegistry !== customElementRegistry) return prevParent;
    }
    return element;
}
```

The code above could probably be optimized.  Once we have this module, I think it would be useful to:

Have a module that can be imported, that has the important side effect of adding a method to the Element prototype called "mount".

The mount method would do something like:

```JavaScript
import {getRootRegistryContainer} from './getRootRegistryContainer.js';

Object.defineProperty(Element.prototype, 'mount', {
  value: function <T extends Element>(
    this: T,
    config: MountConfig | EnhancementConfig[], options: MountObserverOptions = {}
  ): T {
    const root = getRootRegistryContainer(this);
    const mo = new MountObserver(config, options);
    mo.observe(root);
    return this;
  },
  writable: true,
  enumerable: false,
  configurable: true,
});
```