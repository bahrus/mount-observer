[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">

# The MountObserver api.

Author:  Bruce B. Anderson

Issues / pr's / polyfill:  [mount-observer](https://github.com/bahrus/mount-observer)

Last Update: 2023-11-18

## Benefits of this API

What follows is a far more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of the MountObserver api are more encompassing, and less focused on registering custom elements.  In fact, this proposal addresses numerous use cases in one api.  It is basically mapping common filtering conditions in the DOM, to common actions, like importing a resource, or progressively enhancing an element, or "binding from a distance".

"Binding from a distance" refers to empowering the developer to essentially manage their own "stylesheets" -- but rather than for purposes of styling, using these rules to attach behaviors, set property values, etc.

The underlying theme is this api is meant to make it easy for the developer to do the right thing, by encouraging lazy loading and smaller footprints. It rolls up most all the other observer api's into one.

### Does this api make the impossible possible?

There is quite a bit of functionality this proposal would open up, that is exceedingly difficult to polyfill reliably:  

1.  It is unclear how to use mutation observers to observe changes to [custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet).  The closest thing might be a solution like [this](https://davidwalsh.name/detect-node-insertion), but that falls short for elements that aren't visible, or during template instantiation.

2.  For simple css matches, like "my-element", or "[name='hello']" it is enough to use a mutation observer, and only observe the elements within the specified DOM region (more on that below).  But as CSS has evolved, it is quite easy to think of numerous css selectors that would require us to expand our mutation observer to need to scan the entire Shadow DOM realm, or the entire DOM tree outside any Shadow DOM, for any and all mutations (including attribute changes), and re-evaluate every single element within the specified DOM region for new matches or old matches that no longer match.  Things like child selectors, :has, and so on. All this is done, miraculously, by the browser in a performant way.  Reproducing this in userland using JavaScript alone, matching the same performance seems impossible.

3.  Knowing when an element, previously being monitored for, passes totally "out-of-scope", so that no more hard references to the element remain.  This would allow for cleanup of no longer needed weak references without requiring polling.

###  Most significant use cases.

The amount of code necessary to accomplish these common tasks designed to improve the user experience is significant.  Building it into the platform would potentially:

1.  Give the developer a strong signal to do the right thing, by 
    1.  Making lazy loading of resource dependencies easy, to the benefit of users with expensive networks.
    2.  Supporting "binding from a distance" that can allow SSR to provide common, shared data using the "DRY" philosophy, similar to how CSS can reduce the amount of repetitive styling instructions found inline within the HTML Markup.
    3.  Supporting "progressive enhancement."
2.  Allow numerous components / libraries to leverage this common functionality, which could potentially significantly reduce bandwidth.
3.  Potentially by allowing the platform to do more work in the low-level (c/c++/rust?) code, without as much context switching into the JavaScript memory space, which may reduce cpu cycles as well.
4.  To do the job right, polyfills really need to reexamine **all** the elements within the observed node for matches **anytime any element within the Shadow Root so much as sneezes (has attribute modified, changes custom state, etc)**, due to modern selectors such as the :has selector.  Surely, the platform has found ways to do this more efficiently?  

The extra flexibility this new primitive would provide could be quite useful to things other than lazy loading of custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.

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

which would work better with current bundlers, I suspect.  Also, we can do interesting things like merge multiple imports into one "module".  But should this API built into the platform, such functions wouldn't be necessary, as bundlers could start to recognize strings that are passed to the MountObserver's constructor.

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
      },
      onDismount: ...,
      onDisconnect: ...,
      onReconnect: ...,
      onReconfirm: ...
      onOutOfScope: ...,
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
  ...
});

observer.addEventListener('reconnect', e => {
  ...
});
observer.addEventListener('disconnect', e => {
  ...
});
observer.addEventListener('reconfirm', e => {
  ...
});
observer.addEventListener('out-of-scope', e => {
  ...
});
```

## Explanation of all states / events

Normally, an element stays in its place in the DOM tree, but the conditions that the MountObserver instance is monitoring for can change for the element, based on modifications to the attributes of the element itself, or its custom state, or to other peer elements within the shadowRoot, if any, or window resizing, etc.  As the element meets or doesn't meet all the conditions, the mountObserver will first call the corresponding mount/dismount callback, and then dispatch event "mount" or "dismount" according to whether the criteria are all met or not.

The moment a MountObserver instance's "observe" method is called (passing in a root node), it will inspect every element within its subtree (not counting ShadowRoots), and then call the "mount" callback, and dispatch event "mount" for those elements that match the criteria.  It will *not* dispatch "dismount" for elements that don't.

If an element that is in "mounted" state according to a MountObserver instance is moved from one parent DOM element to another:

1)  "disconnect" event is dispatched from the MountObserver instance the moment the element is disconnected from the DOM fragment.
2)  If/when the element is added somewhere else in the DOM tree, the mountObserver instance will dispatch event "reconnect", regardless of where. [Note:  can't polyfill this very easily]
3)  If the element is added outside the rootNode being observed, the mountObserver instance will dispatch event "outside-root-node", and the MountObserver instance will relinquish any further responsibility for this element.  Ideally this would also be dispatched when the platform garbage collects the element as well after all hard references are relinquished.
4)  If the new place it was added remains within the original rootNode and remains either dismounted or mounted, the MountObserver instance dispatches event "reconfirmed".
5)  If the element no longer satisfies the criteria of the MountObserver instance, the MountObserver instance will dispatch event "dismount".  The same is done in reverse for moved elements that started out in a "dismounted" state. 

## Special support for observable attributes

Extra support is provided for monitoring attributes.

Example:

```html
<div id=div>
   <span id=span></span>
</div>
<script type=module>
   import {MountObserver} from '../MountObserver.js';
   const mo = new MountObserver({
      match: '#span',
      attribMatches:[
         {
            names: ['test-1']
         }
      ]
   });
   mo.addEventListener('attr-change', e => {
      console.log(e);
   });
   mo.observe(div);
   setTimeout(() => {
      span.setAttribute('test-1', 'hello')
   }, 1000);
</script>
```



## Preemptive downloading

There are two significant steps to imports, each of which imposes a cost:  

1.  Downloading the resource.
2.  Loading the resource into memory.

What if we want to download the resource ahead of time, but only load into memory when needed?

The link rel=modulepreload option provides an already existing platform support for this, but the browser complains when no use of the resource is used within a short time span of page load.  That doesn't really fit the bill for lazy loading custom elements and other resources.

So for this we add option:

```JavaScript
const observer = new MountObserver({
   match: 'my-element',
   loading: 'eager',
   import: './my-element.js',
   do:{
      onMount: (matchingElement, {module}) => customElements.define(module.MyElement)
   }
})
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.


