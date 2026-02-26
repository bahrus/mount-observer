# Support Where Criteria With Registered Actions

**Status**: ✅ Implemented

Recall that mount-observer supports the ability to define global handlers:

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

// Register the handler with a string name
MountObserver.define('myHandler', MyHandler);

// Reference it by name in the configuration
const observer = new MountObserver({
   matching: 'div > p + p ~ span[class$="name"]',
   do: 'myHandler'  // String reference instead of inline function
});
observer.observe(document);
```

Also, that some built-in handlers are part of this polyfill package.

This requirement allows such handlers to specify default settings for the other configuration settings of the MountObserver, via assignGingerly.  So the above example could also be accomplished via:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
   static matching = 'div > p + p ~ span[class$="name"]',
}

// Register the handler with a string name
MountObserver.define('myHandler', MyHandler);

// Reference it by name in the configuration
const observer = new MountObserver({
   do: 'myHandler'  // String reference instead of inline function
});
observer.observe(document);
```

This means that almost immediately when a mountObserver object is created (maybe around line 69), we need to check if do is a string, and if so, try to find it in the global registry, and if found:

1.  Create an object from the keys of the constructor.
2.  Do an applyGingerly of the passed in MountConfig object on to the object created from 1.
3.  That is what gets passed to this.#init 

If both the class and the MountObserver specify a setting, the "inline" one trumps:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
   static matching = 'div > p + p ~ span[class$="name"]',
}

// Register the handler with a string name
MountObserver.define('myHandler', MyHandler);

// Reference it by name in the configuration
const observer = new MountObserver({
    matching = 'span > p + p ~ span[class$="name"]', //this one trumps
   do: 'myHandler'  // String reference instead of inline function
});
observer.observe(document);
```


## Implementation Details

The feature is implemented in `MountObserver.ts` via the `#mergeHandlerDefaults()` private method, which:

1. Checks if the `do` property is a string reference to a registered handler
2. Looks up the handler class from the static registry
3. Extracts all static properties from the handler class (excluding `prototype`, `length`, and `name`)
4. Merges the handler's static properties with the inline config using object spread
5. Inline config properties always override handler defaults (inline trumps)

The merge happens early in the constructor, before any validation or initialization, ensuring that all downstream logic sees the merged configuration.

## Test Coverage

- `tests/test-handler-defaults.html` / `.spec.mjs` - Basic functionality with single property override
- `tests/test-handler-defaults-advanced.html` / `.spec.mjs` - Multiple static properties and partial overrides

Both tests verify:
- Handler static properties are used as defaults
- Inline config properties override handler defaults
- Multiple static properties (e.g., `matching` + `whereInstanceOf`) work together
- The AND condition logic is preserved when merging configs
