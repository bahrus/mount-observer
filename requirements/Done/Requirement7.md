# Donut Hole Support

For the polyfill, we need to support donut hole scoping.

For example:

```html
<div id=myTest itemscope>
   <span itemprop=name>
    <div itemscope>
        <data itemprop=ssn>
    </div>
</div>
```

We want to find all elements with attribute itemprop outside any itemscope, so the span and not the data element.

```JavaScript
const oContainerNode = document.getElementById('myTest');
const observer = new MountObserver({
   whereElementMatches:'[itemprop]',
   whereOutside: '[itemscope]'
   do: {
      mount: ({localName}, {modules, observer}) => {
        ...
      },
   },
   disconnectedSignal: new AbortController().signal
});
observer.observe(oContainerNode);
```

The MountInit interface should amended:

```TypeScript
interface MountInit {
    whereOutside?: string
}
```

whereOutside should only support a string (or undefined), not an array of strings for now.



The check for "whereOutside" is done via script:

```JavaScript
outsideCheck(oContainerNode: Node, matchCandidate: Element, outside: string){
    let current = matchCandidate.parentElement;
    
    while (current && current !== oContainerNode) {
        if (current.matches(outside)) {
            return false;  // Found an excluding ancestor
        }
        current = current.parentElement;
    }
    
    return true;  // No excluding ancestors found
}

```

This is an AND condition, so that if an element matches whereElementMatches but its parent (between it and root) matches whereOutside it would not mount.

The root node (oContainerNode) should not be checked against the outside selector

## Integration with other conditions:

 The check order should be:

- whereElementMatches (cheapest - CSS selector)
- whereOutside (medium - upward traversal) add on to whereElementMatches
- whereAttr (expensive - complex logic)
- withInstance (cheap - instanceof check)
withMediaMatching (already checked globally)