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
// MyElement.js
export default class MyElement extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Hello!';
    }
}

// main.js
import { MountObserver } from 'mount-observer';

const observer = new MountObserver({
    whereElementMatches: 'my-element',
    import: './MyElement.js',
    do: 'builtIns.defineCustomElement'
});
observer.observe(document);

// HTML - elements will be upgraded when defined
<my-element></my-element>
```

Note that the logic for import has already been established by prior requirements and follows standard ES module resolution rules and respects import maps.  Only check the first import (modules[0]).  If no modules are specified, throw an error "Must specify an ES Module".

The custom element name is derived from the first matched element's localName property.  If customElements.get(localName) has a value, then don't do anything further (no need to log it or throw an error or anything).

```JavaScript
if (customElements.get('my-element')) return;
```

If multiple elements match whereElementMatches, the mount method will be called for each one.  If the name has already been found,  it will not proceed based on the line of code above.

The implementation will extend class EvtRt, and all the logic that registers the custom element will take place in the mount method.

The logic in the mount method looks for the default export of MyModule.js.  If no default export is found, checks if there's one and only one exported class that extends HTMLElement.  If neither of these two scenarios is the case, throw an error, depending on the scenario:  "No suitable class found in MyModule" or "More than one class found in MyModule".

I'm not 100% how to detect if a class extends HTMLElement in the prototype chain.  Maybe this will work:

```JavaScript
function extendsHTMLElement(cls) {
    return cls.prototype instanceof HTMLElement;
}
```

But this may require some experimentation when creating unit tests to verify that that works.

So the logic may look something like this:

```JavaScript
const module = context.modules[0];

// Get default export
const defaultExport = module.default;

if (defaultExport && extendsHTMLElement(defaultExport)) {
    // Use default export
} else {
    // Find all exports that extend HTMLElement
    const htmlElementClasses = Object.values(module)
        .filter(exp => typeof exp === 'function' && extendsHTMLElement(exp));
    
    if (htmlElementClasses.length === 0) {
        throw new Error('No suitable class found in module');
    }
    if (htmlElementClasses.length > 1) {
        throw new Error('More than one class found in module');
    }
    
    // Use the single found class
    const ElementClass = htmlElementClasses[0];
}
```

When defining the custom element, extend the class pointed to, so that that same class can be used for multiple custom element names.

```JavaScript
// Imported class
export default class MyElement extends HTMLElement { }


// Create wrapper class
const wrapper = class extends MyElement { }
customElements.define('my-element', wrapper);
```

Creating a wrapper class allows the same base class to be reused for multiple custom element names, as each call to customElements.define() requires a unique constructor.

[TODO]:  Add unit tests



