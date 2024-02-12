[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">


# The MountObserver api.

Author:  Bruce B. Anderson

Issues / pr's / polyfill:  [mount-observer](https://github.com/bahrus/mount-observer)

Last Update: 2024-2-11

## Benefits of this API

What follows is a far more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of the MountObserver api are more encompassing, and less focused on registering custom elements.  In fact, this proposal addresses numerous use cases in one api.  It is basically mapping common filtering conditions in the DOM, to mounting a "campaign" of some sort, like importing a resource, and/or progressively enhancing an element, and/or "binding from a distance".

["Binding from a distance"](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) refers to empowering the developer to essentially manage their own "stylesheets" -- but rather than for purposes of styling, using these rules to attach behaviors, set property values, etc, to the HTML as it streams in.  Libraries that take this approach include [Corset](https://corset.dev/) and [trans-render](https://github.com/bahrus/trans-render).  The concept has been promoted by a [number](https://bkardell.com/blog/CSSLike.html) [of](https://www.w3.org/TR/NOTE-AS)  prominent voices in the community. 

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
    2.  Supporting "binding from a distance" that can set property values of elements in bulk as the HTML streams in.  For example, say a web page is streaming in HTML with thousands of input elements (say a long tax form).  We want to have some indication in the head tag of the HTML (for example) to make all the input elements read only as they stream through the page. With css, we could do similar things, for example set the background to red of all input elements. Why can't we do something similar with setting properties like readOnly, disabled, etc?  With this api, giving developers the "keys" to css filtering, so they can "mount a campaign" to apply common settings on them all feels like something that almost every web developer has mentally screamed to themselves "why can't I do that?", doesn't it? 
    3.  Supporting "progressive enhancement" more effectively.
2.  Potentially by allowing the platform to do more work in the low-level (c/c++/rust?) code, without as much context switching into the JavaScript memory space, which may reduce cpu cycles as well.  This is done by passing into the API substantial number of conditions, which can all be evaluated at a lower level, before surfacing up the developer "found one!".
3.  As discussed earlier, to do the job right, polyfills really need to reexamine **all** the elements within the observed node for matches **anytime any element within the Shadow Root so much as sneezes (has attribute modified, changes custom state, etc)**, due to modern selectors such as the :has selector.  Surely, the platform has found ways to do this more efficiently?  

The extra flexibility this new primitive would provide could be quite useful to things other than lazy loading of custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.

## First use case -- lazy loading custom elements

To specify the equivalent of what the alternative proposal linked to above would do, we can do the following:

```JavaScript
const observer = new MountObserver({
   on:'my-element',
   import: './my-element.js',
   do: {
      mount: ({localName}, {module}) => {
        if(!customElements.get(localName)) {
            customElements.define(localName, module.MyElement);
        }
      }
   }
});
observer.observe(document);
```

If no import is specified, it would go straight to do.* (if any such callbacks are specified), and it will also dispatch events as discussed below.

This only searches for elements matching 'my-element' outside any shadow DOM.

But the observe method can accept a node within the document, or a shadowRoot, or a node inside a shadowRoot as well.

The import can also be a function:

```JavaScript
const observer = new MountObserver({
   on: 'my-element',
   import: async (matchingElement, {module}) => await import('./my-element.js');
});
observer.observe(myRootNode);
```

which would work better with current bundlers, I suspect.  Also, we can do interesting things like merge multiple imports into one "module".  But should this API be built into the platform, such functions wouldn't be necessary, as bundlers could start to recognize strings that are passed to the MountObserver's constructor.

This proposal would also include support for CSS, JSON, HTML module imports. 

The "observer" constant above is a class instance that inherits from EventTarget, which means it can be subscribed to by outside interests.

## Binding from a distance

It is important to note that "on" is a css query with no restrictions.  So something like:

```JavaScript
const observer = new MountObserver({
   on:'div > p + p ~ span[class$="name"]',
   do:{
      mount: (matchingElement) => {
         //attach some behavior or set some property value or add an event listener, etc.
         matchingElement.textContent = 'hello';
      }
   }
})
```

This would allow developers to create "stylesheet" like capabilities.


##  Extra lazy loading

By default, the matches would be reported as soon as an element matching the criterion is found or added into the DOM, inside the node specified by rootNode.

However, we could make the loading even more lazy by specifying intersection options:

```JavaScript
const observer = new MountObserver({
   on: 'my-element',
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
   on: 'div > p + p ~ span[class$="name"]',
   whereMediaMatches: '(max-width: 1250px)',
   whereSizeOfContainerMatches: '(min-width: 700px)',
   whereInstanceOf: [HTMLMarqueeElement],
   whereSatisfies: async (matchingElement, context) => true,
   whereLangIn: ['en-GB'],
   whereConnection:{
      effectiveTypeIn: ["slow-2g"],
   },
   import: ['./my-element-small.css', {type: 'css'}],
   do: {
      mount: ({localName}, {module}) => {
        ...
      },
      dismount: ...,
      disconnect: ...,
      reconnect: ...,
      reconfirm: ...,
      exit: ...,
      forget: ...,
   }
})
```

Callbacks like we see above are useful for tight coupling, and probably are unmatched in terms of performance.  However, since these rules may be of interest to multiple parties, it is useful to also provide the ability for multiple parties to subscribe to these css rules.  This can be done via:

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
observer.addEventListener('disconnect', e => {
  ...
});
observer.addEventListener('reconnect', e => {
  ...
});
observer.addEventListener('reconfirm', e => {
  ...
});
observer.addEventListener('exit', e => {
  ...
});
observer.addEventListener('forget', e => {
  ...
});
```

## Explanation of all states / events

Normally, an element stays in its place in the DOM tree, but the conditions that the MountObserver instance is monitoring for can change for the element, based on modifications to the attributes of the element itself, or its custom state, or to other peer elements within the shadowRoot, if any, or window resizing, etc.  As the element meets or doesn't meet all the conditions, the mountObserver will first call the corresponding mount/dismount callback, and then dispatch event "mount" or "dismount" according to whether the criteria are all met or not.

The moment a MountObserver instance's "observe" method is called (passing in a root node), it will inspect every element within its subtree (not counting ShadowRoots), and then call the "mount" callback, and dispatch event "mount" for those elements that match the criteria.  It will *not* dispatch "dismount" for elements that don't.

If an element that is in "mounted" state according to a MountObserver instance is moved from one parent DOM element to another:

1)  "disconnect" event is dispatched from the MountObserver instance the moment the mounted element is disconnected from the DOM fragment.
2)  If/when the element is added somewhere else in the DOM tree, the mountObserver instance will dispatch event "reconnect", regardless of where. [Note:  can't polyfill this very easily]
3)  If the mounted element is added outside the rootNode being observed, the mountObserver instance will dispatch event "exit", and the MountObserver instance will relinquish any further responsibility for this element.  
4)  Ideally event "forget" would be dispatched just before the platform garbage collects an element the MountObserver instance is still monitoring, after all hard references are relinquished (or is that self-contradictory?).
5)  If the new place it was added remains within the original rootNode and remains mounted, the MountObserver instance dispatches event "reconfirmed".
6)  If the element no longer satisfies the criteria of the MountObserver instance, the MountObserver instance will dispatch event "dismount".  

## A tribute to attributes

Extra support is provided for monitoring attributes.  There are two primary reasons for needing to provide special support for attribute with ths API:

Being that for both custom elements, as well as (hopefully) [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) we need to carefully work with sets of "owned" [observed](https://github.com/WICG/webcomponents/issues/1045) attributes, and in some cases we may need to manage combinations of prefixes and suffixes for better name-spacing management.

We want to be alerted by the presence of these attributes, but then continue to be alerted by changes of those values, and we can't enumerate which values we are interested in, so we must subscribe to all values as they change.

### Scenario 1 -- Custom Element integration with ObserveObservableAttributes API [WIP]

Example:

```html
<div id=div>
   <my-custom-element my-first-observed-attribute="hello"></my-custom-element>
</div>
<script type=module>
   import {MountObserver} from '../MountObserver.js';
   const mo = new MountObserver({
      on: '*',
      whereInstanceOf: [MyCustomElement]
   });
   mo.addEventListener('parsed-attrs-changed', e => {
      const {matchingElement, modifiedObjectFieldValues, preModifiedFieldValues} = e;
      console.log({matchingElement, modifiedObjectFieldValues, preModifiedFieldValues});
   });
   mo.observe(div);
   setTimeout(() => {
      const myCustomElement = document.querySelector('my-custom-element');
      myCustomElement.setAttribute('my-first-observed-attribute', 'good-bye');
   }, 1000);
</script>
```



### Scenario 2 -- Custom Enhancements in userland

Based on [the proposal as it currently stands](https://github.com/WICG/webcomponents/issues/1000), in this case the class prototype would *not* have the attributes defined as a static property of the class, so that the constructor arguments in the previous scenario wouldn't be sufficient.  So instead, what would seem to provide the most help for providing for custom enhancements in userland, and for any other kind of progressive enhancement based on attributes going forward.

Suppose we have a progressive enhancement that we want to apply based on the presence of 1 or more attributes.

To make this discussion concrete, let's suppose the "canonical" names of those attributes are:

```html
<div id=div>
   <section 
      my-enhancement=greetings 
      my-enhancement-first-aspect=hello 
      my-enhancement-second-aspect=goodbye
   ></section>
</div>
```

Now suppose we are worried about namespace clashes, plus we want to serve environments where HTML5 compliance is a must.

So we also want to recognize additional attributes that should map to these canonical attributes:

We want to also support:

```html
<div id=div>
   <section class=hello 
      data-my-enhancement=greetings 
      data-my-enhancement-first-aspect=hello 
      data-my-enhancement-second-aspect=goodbye
   ></section>
</div>
```

Based on the current unspoken rules, no one will raise an eyebrow with these attributes, because the platform has indicated it will generally avoid dashes in attributes (with an exception or two that will only happen in a blue moon, like aria-*).

But now when we consider applying this enhancement to custom elements, we have a new risk.  What's to prevent the custom element from having an attribute named my-enhancement-first-aspect?  (Okay, with this particular example, the names are so long and generic it's unlikely, but who would ever use such a long, generic name in practice?)

So let's say we want to insist that on custom elements, we must have the dat- prefix?

And we want to support an alternative prefix to data, say enh-*, endorsed by [this proposal](https://github.com/WICG/webcomponents/issues/1000).

Here's what the api provides:

## Option 1 -- The carpal syndrome syntax

```JavaScript
import {MountObserver} from '../MountObserver.js';
const mo = new MountObserver({
   on: '*',
   whereAttr:{
      isIn: [
         'data-my-enhancement',
         'data-my-enhancement-first-aspect', 
         'data-my-enhancement-second-aspect',
         'enh-my-enhancement',
         'enh-my-enhancement-first-aspect', 
         'enh-my-enhancement-second-aspect',
         {
            name: 'my-enhancement',
            builtIn: true
         },
         {
            name: 'my-enhancement-first-attr',
            builtIn: true
         },
         {
            name: 'my-enhancement-second-aspect',
            builtIn: true
         }
      ]
      
   }
});
```

## Option 2 -- The DRY Way

```JavaScript
import {MountObserver} from '../MountObserver.js';
const mo = new MountObserver({
   on: '*',
   whereAttr:{
      hasCommonPrefix: 'my-enhancement'
      endingWith: ['first-attr', 'second-attr', ''],
      supportedBuiltInPrefixes: ['data', 'enh', ''],
      supportedCEPrefixes: ['data', 'enh']
   }
});
```

MountObserver supports both.  The supportedBuiltInPrefixes and supportedCEPrefixes are defaulted to the values shown, so they don't need to be specified, so the savings are fairly significant compared to the previous example.

```html
<div id=div>
   <section class=hello my-enhancement-first-attr="hello"></section>
</div>
<script type=module>
   import {MountObserver} from '../MountObserver.js';
   const mo = new MountObserver({
      on: '*',
      whereAttr:{
         hasPrefixesIn: ['enh-', 'data-enh-'],
         hasSuffixesIn:[
            'my-enhancement-first-attr',
            'my-enhancement-second-aspect'
         ],
         
      }
   });
   mo.addEventListener('observed-attr-change', e => {
      console.log(e);
      // {
      //    matchingElement,
      //    attrChangeInfo:{
      //       fullName: 'data-enh-my-first-enhancement-attr',
      //       suffix: 'my-first-enhancement-attr',
      //       oldValue: null,
      //       newValue: 'hello'
      //       idx: 0,
      //    }
      // }
   });
   mo.observe(div);
   setTimeout(() => {
      const myCustomElement = document.querySelector('my-custom-element');
      myCustomElement.setAttribute('my-first-observed-attribute', 'good-bye');
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
   on: 'my-element',
   loading: 'eager',
   import: './my-element.js',
   do:{
      mount: (matchingElement, {module}) => customElements.define(module.MyElement)
   }
})
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.


