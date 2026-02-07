# Assign Gingerly

```JavaScript
const observer = new MountObserver({
   import: './my-element.js',
   whereElementMatches:'input',
   asgMt: {
     disabled: true
   }
   
   
});
observer.observe(document);
```

This will conditionally, dynamically import [assignGingerly](https://github.com/bahrus/assign-gingerly), and when a new input element is found in the document, run asgMt:

```JavaScript
assignGingerly(oInput, {disabled: true});
```