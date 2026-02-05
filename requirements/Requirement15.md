# Built in handlers

In index.ts register the following built in handlers (the definitions of these classes need not be in index.ts):

```JavaScript
// In index.ts:
MountObserver.define('builtIns.logToConsole', EvtRt);
MountObserver.define('builtIns.defineCustomElement', DefineCustomElementHandler);
```


## Log to console handler

```JavaScript
const observer = new MountObserver({
   // not supported by polyfill
   //select: 'div > p + p ~ span[class$="name"]' 
   // is supported:
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: 'builtIns.logToConsole'
});
observer.observe(document);
```

This logs to console all the events (mount, dismount, disconnect, attrchange)

Note that the EvtRt already does this, so basically just register the base class as it is already defined, and leave it there.

## Lazy custom element definition handler

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'my-element',
   import: 'MyPackage/MyModule.js',
   do: 'builtIns.defineCustomElement'
});
observer.observe(document);
```

The name of the custom element should match the value o whereElementMatches.  If whereElementMatches is not a valid custom element name, the platform will throw an error, no need to double check the validity of it.

The implementation will extend class EvtRt, and all the logic tha registers the custom element will take place in the mount method.

The logic in the mount method looks for the default export of MyModule.js.  If no default export is found, checks if there's one and only one exported class that extends HTMLElement.  If neither of these two scenarios is the case, throw an error, depending on the scenario:  "No suitable class found in MyModule" or "More than one class found in MyModule".

When defining the custom element element, extend the class pointed to, so that that same class can be used for multiple custom element names.

```JavaScript
// Imported class
export default class MyElement extends HTMLElement { }


// Create wrapper class
const wrapper = class extends MyElement { }
customElements.define('my-element', wrapper);
```



