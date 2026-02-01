# Pure JSON support

Because of the desire to support mount observer script elements with JSON, we need a way of moving the JavaScript out of the MountInit, and make it part of the export.

We do so as follows:

```JavaScript

// 
const observer = new MountObserver({
   import: './my-element.js',
   whereElementMatches:'my-element',
   do: ({localName}, {modules, observer, observeInfo}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
   
}, {disconnectedSignal: new AbortController().signal});
observer.observe(document);
```