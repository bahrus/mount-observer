# Registering reusable handlers

In our continued desire to:

1.  Make MountConfig as JSON serializable as possible, and 
2.  Encourage code reuse

we provide another way to reuse mount observer logic.

We document this code in README.md

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
}

const observer = new MountObserver({
   matching: 'div > p + p ~ span[class$="name"]',
   do: (mountedElement, ctx) => {
      new MyHandler(mountedElement, ctx);
   }
});
observer.observe(document);
```

What we can do instead is similar to defining a custom element:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
}

MountObserver.define('myObserver', MyHandler);

const observer = new MountObserver({
   matching: 'div > p + p ~ span[class$="name"]',
   do: 'myObserver'
});
observer.observe(document);
```

So we are expanding the do property in MountConfig to allow for a string value (or an array of string values), or a mix of string values and functions, which are run in sequence (fire and forget).   

```TypeScript
export interface MountConfig {
    // ... other properties
    do?: string | DoCallback | (string | DoCallback)[];
}
```

Note that "DoCallbacks" has been removed.  Please remove any references to "DoCallbacks" wherever they may appear as part of this requirement.  I don't think this is a breaking change, just a future requirement that is no longer applicable.

If the constructor is synchronous and throws an error, it will stop any more processing.

If any of the string values aren't previously registered via MountObserver.define, an error is thrown with message `No handler defined for ${doName}`.

define is a static method added to MountObserver class.  The registry is global and shared across all MountObserver instances, similar to the custom elements registry.

What the define method does is:

```JavaScript
new MyHandler(mountedElement, ctx);
```

Similar to custom elements:

1.  If the name specified has already been defined, throw an error `${doName} already in use`

~2.  If the name wasn't used, set the constructor.name to the registered name:~  This is difficult to polyfill, so is not included with this polyfill.

```JavaScript
MyHandler.name = 'myObserver'; //not supported by this polyfill
```

Unlike custom elements, these custom classes are not required to extend EvtRt, and can even be an ES5 style function prototype that will still be invoked with new Fn(element, context), but the constructor will be expected to allow for these two parameters to be passed in (and no others). Extending EvtRt is recommended but not required.
 
When both do (string/array) and reference are specified, the execution order is:

1.  Inline do functions (if any), and registered handlers (from do strings), in whatever order they appear.
2.  Referenced do functions (from reference property)

