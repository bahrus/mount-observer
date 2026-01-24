```JavaScript
const observer = new MountObserver({
   import: './my-element.js',
   whereElementMatches:'input',
   assignGingerly: {
     disabled: true
   }
   
   
});
observer.observe(document);
```

This will conditionally, dynamically import [assignGingerly](https://github.com/bahrus/assign-gingerly), and when a new input element is found in the document, run assignGingerly:

```JavaScript
assignGingerly(oInput, {disabled: true});
```