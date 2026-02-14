```JavaScript
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

Tests:

test-basic.html
test-import.html