# mountObserver

Author:  Bruce B. Anderson

Issues / pr's / polyfill:  [mount-observer](https://github.com/bahrus/mount-observer)

Last Update: 2023-11-17

## Benefits of this API

What follows is a more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of the MountObserver api are larger, and less focused on registering custom elements.  In fact, this proposal is trying to address a rather large number of use cases in one api.  It is basically mapping common filtering conditions in the DOM, to common actions, like importing a resource, or progressively enhancing an element, or "binding from a distance".  The underlying theme is this api is meant to make it easy for the developer to do the right thing, by encouraging lazy loading and smaller footprints. It rolls up other observer api's into one.

This api doesn't pry open some ability developers currently lack, with at least one possible exception.  It is unclear how to use mutation observers to observe changes to [custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet). 
 
Even if that capability were added to mutation observers, the MountObserver api strives to make it *easy* to achieve what is currently common but difficult to implement functionality.  The amount of code necessary to accomplish these common tasks designed to improve the user experience is significant.  Building it into the platform would potentially:

1.  Give the developer a strong signal to do the right thing, by 
    1.  Making lazy loading easy, to the benefit of users with expensive networks.
    2.  Supporting "binding from a distance" which can allow SSR to provide common, shared data using the "DRY" philosophy, similar to how CSS can reduce the amount of repetitive styling instructions found inline within the HTML Markup.
2.  Allow numerous components / libraries to leverage this common functionality, which could potentially significantly reduce bandwidth.
3.  Potentially by allowing the platform to do more work in the low-level (c/c++/rust?) code, without as much context switching into the JavaScript memory space, which may reduce cpu cycles as well.  


The extra flexibility this new primitive would provide could be quite useful to things other than custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.

## First use case -- lazy loading custom elements

To specify the equivalent of what the alternative proposal linked to above would do, we can do the following:

```JavaScript
const observer = new MountObserver({
   match:'my-element',
   import: './my-element.js',
   do: {
      onMount: ({localName}, {module}) => {
        if(!customElements.get(localName)) {
            customElements.define(localName, module.default);
        }
      }
   }
});
observer.observe(document);
```

If no import is specified, it would go straight to do.* (if any such callbacks are specified), and it will also dispatch events as discussed below.

This only searches for elements matching 'my-element' outside any shadow DOM.

But the observe method can accept a shadowRoot, or a node inside a shadowRoot as well.

The import can also be a function:

```JavaScript
const observer = new MountObserver({
   match: 'my-element',
   import: async (matchingElement, {module}) => await import('./my-element.js');
});
observer.observe(myRootNode);
```

which would work better with current bundlers, I suspect.  Also, we can do interesting things like merge multiple imports into one "module".

This proposal would also include support for CSS, JSON, HTML module imports.  

"match" is a css query, and could include multiple matches using the comma separator, i.e. no limitation on CSS expressions.

The "observer" constant above is a class instance that inherits from EventTarget, which means it can be subscribed to by outside interests.

<!-- As matches are found (for example, right away if matching elements are immediately found), the imports object would maintain a read-only array of weak references, along with the imported module:

```TypeScript
interface MountContext {
    weakReferences:  readonly WeakRef<Element>[];
    module: any;
}
```

This allows code that comes into being after the matching elements were found, to "get caught up" on all the matches. -->


##  Extra lazy loading

By default, the matches would be reported as soon as an element matching the criterion is found or added into the DOM, inside the node specified by rootNode.

However, we could make the loading even more lazy by specifying intersection options:

```JavaScript
const observer = new MountObserver({
   match: 'my-element',
   whereElementIntersectsWith:{
      rootMargin: "0px",
      threshold: 1.0,
   },
   import: './my-element.js'
});
```

## Media / container queries / instanceOf / custom checks

Unlike traditional CSS @import, CSS Modules don't support specifying different imports based on media queries.  That can be another condition we can attach (and why not throw in container queries, based on the rootNode?):

```JavaScript
const observer = new MountObserver({
   match: 'my-element',
   whereMediaMatches: '(max-width: 1250px)',
   whereSizeOfContainerMatches: '(min-width: 700px)',
   whereInstanceOf: [HTMLMarqueeElement],
   whereSatisfies: async (matchingElement, context) => true,
   import: ['./my-element-small.css', {type: 'css'}],
   do: {
      onMount: ({localName}, {module}) => {
        ...
      }
   }
})
```



## Subscribing

Subscribing can be done via:

```JavaScript
observer.addEventListener('mount', e => {
  console.log({
      matchingElement: e.matchingElement, 
      module: e.module
   });
});

observer.addEventListener('dismount', e => {
  console.log({
      matchingElement: e.matchingElement, 
      module: e.module
   });
});

observer.addEventListener('reconnect', e => {
    ...
});
observer.addEventListener('disconnect', e => {
  console.log({
      matchingElement: e.matchingElement, 
      module: e.module
   });
});
```

## Explanation of all states / events

Normally, an element stays in its place in the DOM tree, but the conditions that the mountObserver is monitoring for can change for the element, based on modifications to the attributes of the element itself, or its custom state, or to other peer elements within the shadowRoot, if any, or window resizing, etc.  As the element meets or doesn't meet all the conditions, the mountObserver will first call the corresponding mount/dismount callback, and then dispatch event "mount" or "dismount" according to whether the criteria are all met or not.

The moment a mountObserver instance's "observe" method is called (passing in a root node), it will inspect every element within its scope, and dispatch "mount" for those elements that match the criteria.  It will *not* dispatch "dismount" for elements that don't.

If an element that is in either "mounted" or "dismounted" state according to a mountObserver instance is moved from one parent DOM element to another:

1)  "disconnect" event is dispatched from the mountObserver instance the moment the element is disconnected from the DOM fragment.
2)  If/when the element is added somewhere else in the DOM tree, the mountObserver instance will dispatch event "reconnect", regardless of where.
3)  If the element is added outside the rootNode being observed, the mountObserver instance will dispatch event "out-of-scope", and the mountObserver instance will relinquish any further responsibility for this element.
4)  If the new place it was added remains within the original rootNode and remains either dismounted or mounted, the mountObserver instance dispatches event "reconfirmed".
5)  If the element no longer satisfies the criteria of mountObserver, the mountObserver will dispatch event "dismount" or "mount". 



## Preemptive downloading

There are two significant steps to imports, each of which imposes a cost:  

1.  Downloading the resource.
2.  Loading the resource into memory.

What if we want to download the resource ahead of time, but only load into memory when needed?

The link rel=modulepreload option provides an already existing platform support for this, but the browser complains when no use of the resource is used within a short time span of page load.  That doesn't really fit the bill for lazy loading custom elements and other resources.

So for this we add option:

```JavaScript
const observer = mount({
   match: 'my-element',
   loading: 'eager',
   import: './my-element.js',
   do:{
      onMount: (matchingElement, {module}) => customElements.define(module.MyElement)
   }
})
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.


