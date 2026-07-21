## Separating JS imperative code from JSON serializable config

Please note that I have modified the types.d.ts and the code to handle:

```JavaScript
mountIni: {
   do: function({localName}, {modules, observer, MountConfig, rootNode}){...}
```

rather than the deprecated:

```JavaScript
{modules, observer, observeInfo: {rootNode}}
```

Please update any outdated documentation / comments that assumes the deprecated signature.

Also note that a previous version of this requirement talked about a private field #importedActions, but that is no longer relevant.


In order to support pure 100% declarative syntax in MountConfig, we need to be able to import the do function.  This is done as follows:

```JavaScript
//module myActions.js
export function do({localName}, {modules, observer, MountConfig, rootNode}){
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
}

const observer = new MountObserver({
   matching:'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
      './myActions.js'
   ],
   reference: 2
});
observer.observe(document);

```



Here "2" refers to the imported module index ('./myActions.js' in this case).

So MountConfig needs a new property:

```TypeScript
interface MountConfig {
    // ... existing properties
    reference?: number | number[];
}

```

If the imports setting isn't defined, or doesn't contain an element with index 2, or isn't a  JS Module (i.e. it is a two dimensional array like ['./my-element-small.css', {type: 'css'}]), an error is thrown.  This check can be done in the constructor, and if fails cease all processing so later checks aren't necessary, and can assume everything lines up.

The rhs of 'reference' can also be an array of numbers, referencing multiple module imports.  They must all be JS modules, and the import setting has to have each of the numbers, or the same error is thrown.

So for example:

```JavaScript

import: [
    ['./my-element-small.css', {type: 'css'}],
    './component.js',
    './actions1.js',
    './actions2.js'
],
reference: [2, 3]  // Both actions1 and actions2 will have their 'do' called if present
```

What this doesn't do: 

1.  Mutate the passed in mountInfo object.
2.  Anything before the imports is done.


What this does do:

1. Right after the imports are loaded (whether eagerly or not), validate the `reference` property if present:
   - Convert single number to array: `reference: 2` → `[2]`
   - For each index, verify it points to a valid JS module import
   - Throw an error if validation fails

2. When `do` needs to be called for a mounted element:
   - First, if `this.#init.do` is present, call it (existing behavior)
   - Then, if `this.#init.reference` is present:
     - Iterate through each module index in the reference array
     - For each index, check if `modules[index]` exports a `do` function
     - If it does, call the `do` function with the same parameters
     - If it doesn't, skip to the next index
     - Continue until all referenced modules have been processed




