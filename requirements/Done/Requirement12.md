# Specifying withInstance remotely

In addition to do actions, to be able to make mountInit 100% declarative JSON serializable, we need to accommodate the withInstance check also.

Following the same exact approach as [Requirement11](Requirement11.md), support moving the withInstance check to the imported reference:

```JavaScript
//module mySettings.js
const doFunction =  function({localName}, {modules, observer, mountInit, rootNode}){
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
},
const withInstance = [HTMLMarqueeElement, SVGElement];

export {doFunction as do, withInstance}

//my local module

const observer = new MountObserver({
   whereElementMatches:'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
      './myActions.js'
   ],
   reference: 2
});
observer.observe(document);

```

This change means that the withInstance can continue to happen where it currently does for inline checks, but for external module settings as above, an additional check should be done after the importing has taken place to make sure the element matches all the criteria before mounting.

**Combining checks**:

If both inline and referenced withInstance checks exist, they should be AND'd together.


**Multiple references**: If multiple referenced modules export `withInstance`, the element must match ALL of them (AND logic).

**Validation**: Referenced `withInstance` is validated after imports load. If a referenced module exports `withInstance` but it's not a Constructor or array of Constructors, an error is thrown.

**Optional export**: If a referenced module doesn't export `withInstance`, it's silently ignored (similar to `do` functions).

**Timing**: 

I think the inline check, if present, should be done before importing, because that would help ensure that lazy loading is optimal.

Only if `loadingEagerness: 'eager'` should both inline and referenced checks be done at the same time.  If it isn't eager, do the inline checks, then do the imports if everything passes muster, then do the referenced instanceOf checks, then if everything looks good, proceed to mounting the element (invoking "do").

Because custom elements start out as unknown elements, let's keep re-checking when needed just in case, rather than adding to #processedDoForElement to prevent re-checking.

Do not dispatch any event when an element fails the referenced withInstance check.

Throw a validation error at the earliest convenience (such as in the constructor, subject to async constraints).
