[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">

Note that much of what is described below has not yet been polyfilled.

# The MountObserver api.

Author:  Bruce B. Anderson (with valuable feedback from @doeixd )

Issues / pr's / polyfill:  [mount-observer](https://github.com/bahrus/mount-observer)

Last Update: Oct 6, 2024

## Benefits of this API

What follows is a far more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of the MountObserver api are more encompassing, and less focused on registering custom elements.  In fact, this proposal addresses numerous use cases in one api.  It is basically mapping common filtering conditions in the DOM, to mounting a "campaign" of some sort, like importing a resource, and/or progressively enhancing an element, and/or "binding from a distance".

["Binding from a distance"](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) refers to empowering the developer to essentially manage their own "stylesheets" -- but rather than for purposes of styling, using these rules to attach behaviors, set property values, etc, to the HTML as it streams in.  Libraries that take this approach include [Corset](https://corset.dev/) and [trans-render](https://github.com/bahrus/trans-render).  The concept has been promoted by a [number](https://bkardell.com/blog/CSSLike.html) [of](https://www.w3.org/TR/NOTE-AS)  [prominent](https://www.xanthir.com/blog/b4K_0) voices in the community. 

The underlying theme is this api is meant to make it easy for the developer to do the right thing, by encouraging lazy loading and smaller footprints. It rolls up most all the other observer api's into one, including, potentially, [a selector observor](https://github.com/whatwg/dom/issues/1285), which may be a similar duplicate to [the match-media counterpart proposal](https://github.com/whatwg/dom/issues/1225).

Most every web application can be recursively broken down into logical regions, building blocks which are assembled together to form the whole site.

At the most micro level, utilizing highly reusable, generic custom elements -- elements that can extend the HTML vocabulary, elements that could be incorporated into the browser, even -- form a great foundation to build on.

But as one zooms out from the micro to the macro, the nature of the components changes in significant ways.

At the micro level, components will have few, if any, dependencies, and those dependencies will tend to be quite stable, and likely all be used. The dependencies will skew more towards tightly coupled utility libraries.

"Macro" level components will tend to be heavy on business-domain specific data, heavy on gluing / orchestrating smaller components, light on difficult, esoteric JavaScript. They aren't confined to static JS files, and likely will include dynamic content as well. They will also be heavy on conditional sections of the application only loading if requested by the user.

ES module based web components may or may not be the best fit for these application macro "modules". A better fit might be a server-centric solution, like Rails, just to take an example.

A significant pain point has to do with loading all the third-party web components and/or (progressive) enhancements that these macro components / compositions require, and loading them into memory only when needed.


### Does this api make the impossible possible?

There is quite a bit of functionality this proposal would open up, that is exceedingly difficult to polyfill reliably:  

1.  It is unclear how to use mutation observers to observe changes to [custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet).  The closest thing might be a solution like [this](https://davidwalsh.name/detect-node-insertion), but that falls short for elements that aren't visible, or during template instantiation, and requires carefully constructed "negating" queries if needing to know when the css selector is no longer matching.

2.  For simple css matches, like "my-element", or "[name='hello']" it is enough to use a mutation observer, and only observe the elements within the specified DOM region (more on that below).  But as CSS has evolved, it is quite easy to think of numerous css selectors that would require us to expand our mutation observer to need to scan the entire Shadow DOM realm, or the entire DOM tree outside any Shadow DOM, for any and all mutations (including attribute changes), and re-evaluate every single element within the specified DOM region for new matches or old matches that no longer match.  Things like child selectors, :has, and so on. All this is done, miraculously, by the browser in a performant way.  Reproducing this in userland using JavaScript alone, matching the same performance seems impossible.  

3.  Knowing when an element, previously being monitored for, passes totally "out-of-scope", so that no more hard references to the element remain.  This would allow for cleanup of no longer needed weak references without requiring polling.

###  Most significant use cases.

The amount of code necessary to accomplish these common tasks designed to improve the user experience is significant.  Building it into the platform would potentially:

1.  Give the developer a strong signal to do the right thing, by 
    1.  Making lazy loading of resource dependencies easy, to the benefit of users with expensive networks.
    2.  Supporting "binding from a distance" that can set property values of elements in bulk as the HTML streams in.  For example, say a web page is streaming in HTML with thousands of input elements (say a long tax form).  We want to have some indication in the head tag of the HTML (for example) to make all the input elements read only as they stream through the page. With css, we could do similar things, for example set the background to red of all input elements. Why can't we do something similar with setting properties like readOnly, disabled, etc?  With this api, giving developers the "keys" to css filtering, so they can "mount a campaign" to apply common settings on them all feels like something that almost every web developer has mentally screamed to themselves "why can't I do that?", doesn't it? 
    3.  Supporting "progressive enhancement" more effectively.
2.  Potentially by allowing the platform to do more work in the low-level (c/c++/rust?) code, without as much context switching into the JavaScript memory space, which may reduce cpu cycles as well.  This is done by passing into the API substantial number of conditions, which can all be evaluated at a lower level, before the api needs to surface up to the developer "found one!".
3.  As discussed earlier, to do the job right, polyfills really need to reexamine **all** the elements within the observed node for matches **anytime any element within the Shadow Root so much as sneezes (has attribute modified, changes custom state, etc)**, due to modern selectors such as the :has selector.  Surely, the platform has found ways to do this more efficiently?  

The extra flexibility this new primitive would provide could be quite useful to things other than lazy loading of custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.

> [!Note]
> Reading through the historical links tied to the selector-observer proposal this proposal helped spawn, I may have painted an overly optimistic picture of [what the platform is capable of](https://github.com/whatwg/dom/issues/398).  It does leave me a little puzzled why this isn't an issue when it comes to styling, and also if some of the advances that were utilized to support :has could be applied to this problem space, so that maybe the arguments raised there have weakened.  Even if the concerns raised are as relevant today, I think considering the use cases this proposal envisions, that the objections could be overcome, for the following reasons: 1.  For scenarios where lazy loading is the primary objective, "bunching" multiple DOM mutations together and only reevaluating when things are quite idle is perfectly reasonable.  Also, for binding from a distance, most of the mutations that need responding to quickly will be when the *state of the host* changes, so DOM mutations play a somewhat muted role in that regard. Again, bunching multiple DOM mutations together, even if adds a bit of a delay, also seems reasonable.  I also think the platform could add an "analysis" step to look at the query and categorize it as "simple" queries vs complex.  Selector queries that are driven by the characteristics of the element itself (localName, attributes, etc) could be handled in a more expedited fashion.  Those that the platform does expect to require more babysitting could be monitored for less vigilantly.  Maybe in the latter case, a console.warning could be emitted during initialization.  The other use case, for lazy loading custom elements and custom enhancements based on attributes, I think most of the time this would fit the "simple" scenario, so again there wouldn't be much of an issue. 

## First use case -- lazy loading custom elements

To specify the equivalent of what the alternative proposal linked to above would do, we can do the following:

```JavaScript
const observer = new MountObserver({
   on:'my-element',
   import: './my-element.js',
   do: {
      mount: ({localName}, {modules, observer}) => {
        if(!customElements.get(localName)) {
            customElements.define(localName, modules[0].MyElement);
        }
        observer.disconnectedSignal.abort();
      },
   },
   disconnectedSignal: new AbortController().signal
});
observer.observe(document);
```

The constructor argument can also be an array of objects that fit the pattern shown above.

In fact, as we will see, where it makes sense, where we see examples that are strings, we will also allow for arrays of such strings.  For example, the "on" key can point to an array of CSS selectors (and in this case the mount/dismount callbacks would need to provide an index of which one matched).  I only recommend adding this complexity if what I suspect is true -- providing this support can reduce "context switching" between threads / memory spaces (c++ vs JavaScript), and thus improve performance.  If multiple "on" selectors are provided, and multiple ones match, I think it makes sense to indicate the one with the highest specifier that matches.  It would probably be helpful in this case to provide a special event that allows for knowing when the matching selector with the highest specificity changes for mounted elements.

If no imports are specified, it would go straight to do.* (if any such callbacks are specified), and it will also dispatch events as discussed below.

This only searches for elements matching 'my-element' outside any shadow DOM.

But the observe method can accept a node within the document, or a shadowRoot, or a node inside a shadowRoot as well.

The "observer" constant above is a class instance that inherits from EventTarget, which means it can be subscribed to by outside interests.

##  The import key

This proposal has been amended to support multiple imports, including of different types:

```JavaScript
const observer = new MountObserver({
   on:'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
   ],
   do: {
      mount: ({localName}, {modules, observer}) => {
        if(!customElements.get(localName)) {
            customElements.define(localName, modules[1].MyElement);
        }
        observer.disconnectedSignal.abort();
      }
   }
});
observer.observe(document);
```

Once again, the key can accept either a single import, but alternatively it can also support multiple imports (via an array).

The do event won't be invoked until all the imports have been successfully completed and inserted into the modules array.

Previously, this proposal called for allowing arrow functions as well, thinking that could be a good interim way to support bundlers, as well as multiple imports.  But the valuable input provided by [doeixd](https://github.com/doeixd) makes me think that that interim support could more effectively be done by the developer in the do methods.

This proposal would also include support for JSON and HTML module imports. 

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
   loadingEagerness: 'eager',
   import: './my-element.js',
   do:{
      mount: (matchingElement, {modules}) => customElements.define(modules[0].MyElement)
   }
})
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.

> [!NOTE]
> As a result of the google IO 2024 talks, I became aware that there is some similarity between this proposal and the [speculation rules api](https://developer.chrome.com/blog/speculation-rules-improvements).  This motivated the change to the property from "loading" to loadingEagerness above.



## Mount Observer Script Elements (MOSEs)

Following an approach similar to the [speculation api](https://developer.chrome.com/blog/speculation-rules-improvements), we can add a script element anywhere in the DOM:

```html
<script type="mountobserver" id=myMountObserver onload="{...}"  onmount="{
   const {matchingElement} = event;
   const {localName} = matchingElement;
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
}">
{
   "on":"my-element",
   "import": [
      ["./my-element-small.css", {type: "css"}],
      "./my-element.js",
   ]
}
</script>
```

The things that make this API work together, namely the "modules", "observer", and "mountedElements" (an array of an array of weak refs to elements that match all the criteria for the i<sup>th</sup> "on" selector) would be accessible as properties of the script element:

```JavaScript
const {modules, observer, mountedElements, mountInit} = myMountObserver;
```

The "scope" of the observer would be the ShadowRoot containing the script element (or the document outside Shadow if placed outside any shadow DOM, like in the head element).

No arrays of settings would be supported within a single tag (as this causes issues as far as supporting a single onmount, ondismount, etc event attributes), but remember that the "on" criteria can be an array of selectors.

> [!Note]
> To support the event handlers above, I believe it would require that CSP solutions factor in both the inner content of the script element as well as all the event handlers via the string concatenation operator.  I actually think such support is quite critical due to lack of support of import.meta.[some reference to the script element] not being available, as it was pre-ES Modules.


## Shadow Root inheritance

Inside a shadow root, we can plop a script element, also with type "mountobserver", optionally giving it the same id as above:

```html
#shadowRoot
<script id=myMountObserver type=mountobserver>
{
   "on":"your-element"
}
</script>
```

If no id is found in the parent ShadowRoot (or in the parent window if the shadow root is at the top level), then this becomes a new set of rules to observe.

But if a matching id is found, then the values from the parent script element get merged in with the one in the child, with the child settings, including the event handling attributes. 

> [!Note]
> The onload event is critical for a number of reasons, among them:
> 1. We need a way to inject non JSON serializable settings (described below) when necessary, and 
> 2. We need a way to override settings in child Shadow DOM's programmatically in some cases.

We will come back to some important [additional features](#creating-frameworks-that-revolve-around-moses) of using these script elements later, but first we want to cover the highlights of this proposal, in order to give more context as to what kinds of functionality these MOSEs can provide.


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

... would work.

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
      mount: ({localName}, {modules}) => {
        ...
      },
      dismount: ...,
      disconnect: ...,
      reconnect: ...,
      reconfirm: ...,
      exit: ...,
      forget: ...,
   }
});
```

Callbacks like we see above are useful for tight coupling, and probably are unmatched in terms of performance.  The expression that the "do" field points to could also be a (stateful) user defined class instance. 

<!--

[TODO] Maybe should also (optionally?) pass back which checks failed and which succeeded on dismount.  Not sure I really see a use case for it, but leaving the thought here for now 

--> 

However, since these rules may be of interest to multiple parties, it is useful to also provide the ability for multiple parties to subscribe to these css rules.  This can be done via:

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

Some of the events above are subject to change depending on the outcome of the [atomic moving](https://github.com/whatwg/dom/issues/1255) proposal.

## Dismounting

In many cases, it will be critical to inform the developer **why** the element no longer satisfies all the criteria.  For example, we may be using an intersection observer, and when we've scrolled away from view, we can "shut down" until the element is (nearly) scrolled back into view.  We may also be displaying things differently depending on the network speed.  How we should respond when one of the original conditions, but not the other, no longer applies, is of paramount importance.

So the dismount event should provide a "checklist" of all the conditions, and their current value:

```JavaScript
mediaMatches: true,
containerMatches: true,
satisfiesCustomCondition: true,
whereLangIn: ['en-GB'],
whereConnection:{
   effectiveTypeMatches: true
},
isIntersecting: false,
changedConditions: ['isIntersecting']
```

## Get play-by-play updates?

An issue raised by @doeixd, I think, is what if we want to be informed of the status of all the conditions that are applicable to an element being mounted / dismounted?  I can see scenarios where this would be useful, for reasons similar to wanting to know why the element dismounted.

Since this could have a negative impact on performance, I think it should be something we opt-in to:

```JavaScript
getPlayByPlay: true
```

Now the question is when should this progress reporting start?  It could either start the moment the element becomes mounted the first time.  Or it could happen the moment any of the conditions are satisfied.  But some of the conditions could be trivially satisfied for the vast majority of elements (e.g. network speed is 4g or greater).

So I believe the prudent thing to do is wait for all the conditions to be satisfied,  before engaging in this kind of commentary, i.e. after the first mount.

The alternative to providing this feature, which I'm leaning towards, is to just ask the developer to create "specialized" mountObserver construction arguments, that turn on and off precisely when the developer needs to know.

## A tribute to attributes

Attributes of DOM elements are tricky.  They've been around since the get-go of the Web, and they've survived multiple eras of web development, where different philosophies have prevailed, so prepare yourself for some esoteric discussions in what follows.

The MountObserver API provides explicit support for monitoring attributes.  There are two primary reasons for why it is important to provide this as part of the API:

Being that for both custom elements, as well as (hopefully) [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) we need to carefully work with sets of "owned" [observed](https://github.com/WICG/webcomponents/issues/1045) attributes, and in some cases we may need to manage combinations of prefixes and suffixes for better name-spacing management, creating the most effective css query becomes challenging.

We want to be alerted by the discovery of elements adorned by these attributes, but then continue to be alerted to changes of their values, and we can't enumerate which values we are interested in, so we must subscribe to all values as they change.

## Attributes of attributes

I think it is useful to divide [attributes](https://jakearchibald.com/2024/attributes-vs-properties/) that we would want to observe into two categories:

1.  Invariably named, prefix-less, "top-level" attributes that serve as the "source of truth" for key features of the DOM element itself.  We will refer to these attributes as "Source of Truth" attributes.  Please don't read too much into the name.  Whether the platform or custom element author developer chooses to make properties reflect to attributes, or attributes reflect to the properties, or some hybrid of some sort, is immaterial here.

By invariably named, I mean the name will be the same in all Shadow DOM realms.

Examples are many built-in global attributes, like lang, or contenteditable, or more specialized examples such as "content" for the meta tag.  It could also include attributes of third party custom elements we want to enhance in a cross-cutting way.

I think in the vast majority of cases, setting the property values corresponding to these attributes results in directly reflecting those property values to the attributes (and vice versa).  There are exceptions, especially for non-string attributes like the checked property of the input element / type=checkbox, and JSON based attributes for custom elements.

Usually, there are no events we can subscribe to in order to know when the property changes. Hijacking the property setter in order to observe changes may not always work or feel very resilient. So monitoring the attribute value associated with the property is often the most effective way of observing when the property/attribute state for these elements change.  And some attributes (like the microdata attributes such as itemprop) don't even have properties that they pair with! 
  

2.  In contrast, there are scenarios where we want to support somewhat fluid, renamable attributes within different Shadow DOM realms, which add behavior/enhancement capabilities on top of built-in or third party custom elements.  We'll refer to these attributes as "Enhancement Attributes."

We want our api to be able to distinguish between these two, and to be able to combine both types in one mount observer instance's set of observed attributes.

> [!NOTE]
> The most important reason for pointing out this distinction is this:  "Source of Truth" attributes will only be *observed*, and will **not** trigger mount/unmount states unless they are part of the "on" selector string. And unlike all the other "where" conditions this proposal supports, the where clauses for the "Enhancement Attributes" are "one-way" -- they trigger a "mount" event / callback, followed by the ability to observe the stream of changes (including removal of those attributes), but they never trigger a "dismount". 

### Counterpoint

Does it make sense to even support "Source of Truth" attributes in a "MountObserver" api, if they have no impact on mounted state?  

We think it does, because some Enhancement Attributes will need to work in conjunction with Source of Truth attributes, in order to provide the observer a coherent picture of the full state of the element.

This realization (hopefully correct) struck me while trying to implement a [userland implementation](https://github.com/bahrus/be-intl) of [this proposal](https://github.com/whatwg/html/issues/9294). 


### Source of Truth Attributes

Let's focus on the first scenario.  It doesn't make sense to use the word "where" for these, because we don't want these attributes to affect our mount/dismount state

```JavaScript
import {MountObserver} from 'mount-observer/MountObserver.js';
const mo = new MountObserver({
   on: '*',
   observedAttrsWhenMounted: ['lang', 'contenteditable']
});

mo.addEventListener('attrChange', e => {
   console.log(e);
   // {
   //    matchingElement,
   //    attrChangeInfo:[{
   //       idx: 0,
   //       name: 'lang'
   //       isSOfTAttr: true,
   //       oldValue: null,
   //       newValue: 'en-GB',
   //    }]
   // }
});
```

### Help with parsing?

This proposal is likely to evolve going forward, attempting to synthesize [separate ideas](https://github.com/WICG/webcomponents/issues/1045) for declaratively specifying how to interpret the attributes, parsing them so that they may be merged into properties of a class instance. 

But for now, such support is not part of this proposal (though we can see a glimpse of what that support might look like below).

### Custom Enhancements in userland

[This proposal, support for (progressive) enhancement of built-in or third-party custom elements, could take quite a while to see the light of day, if ever](https://github.com/WICG/webcomponents/issues/1000).

In the meantime, we want to provide the most help for providing for custom enhancements in userland, and for any other kind of (progressive) enhancement based on (server-rendered) attributes going forward.

Suppose we have a (progressive) enhancement that we want to apply based on the presence of 1 or more attributes.

To make this discussion concrete, let's suppose the "canonical" names of those attributes are:

```html
<div id=div>
   <section 
      my-enhancement=greetings 
      my-enhancement-first-aspect=hello 
      my-enhancement-second-aspect=goodbye
      my-enhancement-first-aspect-wow-this-is-deep
      my-enhancement-first-aspect-have-you-considered-using-json-for-this=just-saying
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
      data-my-enhancement-first-aspect-wow-this-is-deep
      data-my-enhancement-first-aspect-have-you-considered-using-json-for-this=just-saying
   ></section>
</div>
```

Based on the current unspoken rules, no one will raise an eyebrow with these attributes, because the platform has indicated it will generally avoid dashes in attributes (with an exception or two that will only happen in a blue moon, like aria-*).

But now when we consider applying this enhancement to third party custom elements, we have a new risk.  What's to prevent the custom element from having an attribute named my-enhancement?

So let's say we want to insist that on custom elements, we must have the data- prefix?

And we want to support an alternative, more semantic sounding prefix to data, say enh-*, endorsed by [this proposal](https://github.com/WICG/webcomponents/issues/1000).

Here's what the api **doesn't** provide (as originally proposed):

#### The carpal syndrome syntax

Using the same expression structure as above, we would end up with this avalanche of settings:

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
         //...some ten more combinations not listed
         {
            name: 'my-enhancement',
            builtIn: true
         },
         {
            name: 'my-enhancement-first-aspect',
            builtIn: true
         },
         {
            name: 'my-enhancement-second-aspect',
            builtIn: true
         },
         ...
      ]
      
   }
});
```

#### The DRY Way

This seems like a much better approach, and is supported by this proposal:

```JavaScript
import {MountObserver} from '../MountObserver.js';
const mo = new MountObserver({
   on: '*',
   whereAttr:{
      hasRootIn: ['data', 'enh', 'data-enh'],
      hasBase: 'my-enhancement',
      hasBranchIn: ['first-aspect', 'second-aspect', ''],
      hasLeafIn: {
         'first-aspect': ['wow-this-is-deep', 'have-you-considered-using-json-for-this'],
      }
   }
});
```

MountObserver provides a breakdown of the matching attribute when encountered:

```html
<div id=div>
   <section class=hello my-enhancement-first-aspect-wow-this-is-deep="hello"></section>
</div>
<script type=module>
   import {MountObserver} from '../MountObserver.js';
   const mo = new MountObserver({
      on: '*',
      whereAttr:{
         hasRootIn: ['data', 'enh', 'data-enh'],
         hasBase: 'my-enhancement',
         hasBranchIn: ['first-aspect', 'second-aspect', ''],
         hasLeafIn: {
            'first-aspect': ['wow-this-is-deep', 'have-you-considered-using-json-for-this'],
         }
      }
   });
   mo.addEventListener('attrChange', e => {
      console.log(e);
      // {
      //    matchingElement,
      //    attrChangeInfo:[{
      //       idx: 0,
      //       oldValue: null,
      //       newValue: 'good-bye',
      //       parts:{
      //          name: 'data-my-enhancement-first-aspect-wow-this-is-deep'
      //          root: 'data',
      //          base: 'my-enhancement',
      //          branch: 'first-aspect',
      //          leaf: 'wow-this-is-deep',
      //       }
      //    }]
      // }
   });
   mo.observe(div);
   setTimeout(() => {
      const myCustomElement = document.querySelector('my-custom-element');
      myCustomElement.setAttribute('data-my-enhancement-first-aspect-wow-this-is-deep', 'good-bye');
   }, 1000);
</script>
```

Some libraries prefer to use the colon (:) rather than a dash to separate these levels of settings:

Possibly some libraries may prefer to mix it up a bit:


```html
<div id=div>
   <section class=hello 
      data-my-enhancement=greetings 
      data-my-enhancement:first-aspect=hello 
      data-my-enhancement:second-aspect=goodbye
      data-my-enhancement:first-aspect--wow-this-is-deep
      data-my-enhancement:first-aspect--have-you-considered-using-json-for-this=just-saying
   ></section>
</div>
```

An example of this in the real world can be found with [HTMX](https://htmx.org/docs/#hx-on):

```html
<button hx-post="/example"
        hx-on:htmx:config-request="event.detail.parameters.example = 'Hello Scripting!'">
    Post Me!
</button>
```

To support such syntax, specify the delimiters thusly:

```JavaScript
const mo = new MountObserver({
   on: '*',
   whereAttr:{
      hasRootIn: ['data', 'enh', 'data-enh'],
      hasBase: ['-', 'my-enhancement'],
      hasBranchIn: [':', ['first-aspect', 'second-aspect', '']],
      hasLeafIn: {
         'first-aspect': ['--', ['wow-this-is-deep', 'have-you-considered-using-json-for-this']],
      }
   }
});
```

## Supporting userland security protections

As we saw with the HTMX example above, element enhancement libraries that (progressively) enhance server rendered HTML are finding it necessary to support inline event handling.  Since the platform has provided no support for hashing built-in event handlers, there's no real advantage for these libraries to utilize the built-in event handlers, so might as well create bespoke event handlers, which unfortunately might not be detected by browser security mechanisms. Perhaps some of these libraries only enable that functionality after confirming no such CSP rules are in place, or provide console warnings, who knows?  This reminds me of the plausible (but probably not universally held) belief that illegalizing relatively safe recreational drugs like hashish or beer pushes the illegal market to gravitate towards drugs/beverages which have more "bang for the buck", which are considerably less safe, leading to the conclusion that the "health and safety" laws end up causing more harm than good.

I am personally pursuing a [userland implementation of CSP tailored for attributes](https://github.com/bahrus/be-hashing-out).  What I'm finding necessary to support this is a way to quickly determine *the full list of* attributes a particular enhancement is monitoring for.

Thus the mountObserver does provide that information to the consumer as well:

```JavaScript
const mo = new MountObserver({
   on: '*',
   whereAttr:{
      hasRootIn: ['data', 'enh', 'data-enh'],
      hasBase: ['-', 'my-enhancement'],
      hasBranchIn: [':', ['first-aspect', 'second-aspect', '']],
      hasLeafIn: {
         'first-aspect': ['--', ['wow-this-is-deep', 'have-you-considered-using-json-for-this']],
      }
   }
});
const observedAttributes = await mo.observedAttrs();
```

## Resolving ambiguity

Because we want the multiple root values (enh-*, data-enh-*, *) to be treated as equivalent, from a developer point of view, we have a possible ambiguity -- what if more than one root is present for the same base, branch and leaf?  Which value prevails over the others?

Tentative rules:

1.  Roots must differ in length.
2.  If one value is null (attribute not present) and the other a string, the one with the string value prevails.
3.  If two or more equivalent attributes have string values, the one with the longer root prevails.

The thinking here is that longer roots indicate higher "specificity", so it is safer to use that one.



## Intra document html imports

This proposal "sneaks in" one more feature, that perhaps should stand separately as its own proposal.  Because the MountObserver api allows us to attach behaviors on the fly based on css matching, and because the MountObserver would provide developers the "first point of contact" for such functionality, the efficiency argument seemingly "screams out" for this feature.

Also, this proposal is partly focused on better management of importing resources "from a distance", in particular via imports carried out via http.  Is it such a stretch to look closely at scenarios where that distance happens to be shorter, i.e. found somewhere [in the document tree structure](https://github.com/tc39/proposal-module-expressions)?

The mount-observer is always on the lookout for template tags with a src attribute starting with #:

```html
<template src=#id-of-source-template></template>
```

For example:

```html
<div>Your Mother Should Know</div>
<div>I Am the Walrus</div>
<template src=#id-of-source-template>
   <span slot=slot1>hello</span>
   <span slot=slot2>goodbye<span>
</template>
<div>Strawberry Fields Forever</div>
```

When it encounters such a thing, it searches "upwardly" through the chain of ShadowRoots for a template with id=id-of-source-template (in this case), and caches them as it finds them. 

Let's say the source template looks as follows:

```html
<template id=id-of-source-template>
   <div>I don't know why you say <slot name=slot2></slot> I say <slot name=slot1></slot></div>
</template>
```

What we would end up with is:


```html
<div>Your Mother Should Know</div>
<div>I Am the Walrus</div>
<div>I don't know why you say <span>goodbye</span> I say <span>hello</span></div>
<div>Strawberry Fields Forever</div>
```

Some significant differences with genuine slot support as used with (ShadowDOM'd) custom elements

1.  There is no mechanism for updating the slots.  That is something under investigation with this userland [custom enhancement](https://github.com/bahrus/be-inclusive), that could possibly lead to a future implementation request tied to template instantiation.  It takes the approach of morphing from slots to a JS host object model that binds to where all the slots were "from a distance".
2.  ShadowDOM's slots act on a "many to one" basis.  Multiple light children with identical slot identifiers all get merged into a single (first?) matching slot within the Shadow DOM.  These "birtual" (birth-only, virtual) inclusions, instead, follow the opposite approach -- a single element with a slot identifier can get cloned into multiple slot targets as it weaves itself into the templates as they get merged together.

## Intra document html imports with Shadow DOM support

This proposal (and polyfill) also supports the option to utilize ShadowDOM / slot updates:

```html
<template id=chorus>
   <template src=#beautiful>
      <span slot=subjectIs>
            <slot name=subjectIs1></slot>
      </span>
   </template>

   <div>No matter what they say</div>
   <div prop-pronoun>Words
      <slot name=verb1></slot> bring
      <slot name=pronoun1></slot> down</div>
   <div>Oh no</div>
   <template src=#beautiful>
      <span slot=subjectIs>
            <slot name=subjectIs2></slot>
      </span>
   </template>
   <div>In every single way</div>
   <div>Yes words
      <slot name=verb2></slot> bring
      <slot name=pronoun2></slot> down
   </div>
   <div>Oh no</div>

   <template src=#down></template>
</template>

<div class=chorus>
   <template src=#chorus shadowRootModeOnLoad=open></template>
   <span slot=verb1>can't</span>
   <span slot=verb2>can't</span>
   <span slot=pronoun1>me</span>
   <span slot=pronoun2>me</span>
   <span slot=subjectIs1>I am</span>
   <span slot=subjectIs2>I am</span>
</div>
```

> [!NOTE]
> An intriguing sounding alternative to using the template tag that disappears, as shown above, is to use a new tag for this purpose.  I think something along the lines of what is [proposed here](https://github.com/WICG/webcomponents/issues/1059) has a much better semantic ring to it:

```html
<compose src="#sharedHeader"></compose>
<compose src="#productCard"></compose>
```

The discussion there leads to an open question whether a processing instruction would be better.  I think the compose tag would make much more sense, vs a processing instruction, as it could then support slotted children (behaving similar to the Beatles' example above).  Or maybe another tag should be introduced that is the equivalent of the slot, to avoid confusion. But I strongly suspect that could significantly reduce the payload size of some documents, if we can reuse blocks of HTML, inserting sections of customized content for each instance.

The [add src attribute to template to load a template from file](https://github.com/whatwg/html/issues/10571) and an interesting proposal that is [coming from](https://github.com/htmlcomponents/declarative-shadow-imports/blob/main/examples/02-explainer-proposal/02-html.html) the Edge team [seem quite compatible](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ShadowDOM/explainer.md#proposal-inline-declarative-css-module-scripts) with this idea.

## Creating "frameworks" that revolve around MOSEs.

Often, we will want to define a large number of "mount observer script elements (MOSEs)" programmatically, and we need it to be done in a generic way, that can be published and easily referenced.  

This is a problem space that [be-hive](https://github.com/bahrus/be-hive) is grappling with, and is used as an example for this section, to simply make things more concrete.  But we can certainly envision other "frameworks" that could leverage this feature for a variety of purposes, including other families of behaviors/enhancements, or "binding from a distance" syntaxes.  

In particular, *be-hive* supports publishing [enhancements](https://github.com/bahrus/be-enhanced) that take advantage of the DOM filtering ability that the MountObserver provides, that "ties the knot" based on CSS matches in the DOM to behaviors/enhancements that we want to attach directly onto the matching elements.  *be-hive* seeks to take advantage of the inheritable infrastructure that MOSEs provide, but we don't want to burden the developer with having to manually list all these configurations, we want it to happen automatically, only expecting manual intervention when we need some special customizations within a specific ShadowDOM realm.

To support this, we propose these highlights:

1.  Adding a static "synthesize" method to the MountObserver api.  This would provide a kind of passage-way from the imperative api to the declarative one.  
2.  As the *synthesize* method is called repeatedly from different packages that work within that framework, it creates a cluster of MOSEs wrapped inside the "synthesizing" custom element ("be-hive") that the framework developer authors.  It appends script elements with type="mountobserver" to the custom element instance sitting in the DOM, that dispatches events from the synthesizing custom element it gets appended to, so subscribers in child Shadow DOM's don't need to add a general mutation observer in order to know when parent shadow roots had a MOSE inserted that it needs to act on.  This allows the child Shadow DOM's to inherit (in this case) behaviors/enhancements from the parent Shadow DOM.

So framework developers can develop a bespoke custom element that inherits from the "abstract" class "*Synthesizer*" that is part of this package / proposal, that is used to group families of MountObserver's together. 

Some attributes that the base "Synthesizer" supports are listed below.  They are all related to allowing individual ShadowDOM realms to be able to easily opt in or opt out, depending on the level of control/trust that is exerted by a web component / Shadow Root, as far as the HTML it imports in. 

1.  passthrough.  Allows for the inheritance of behaviors to flow through from above (or from the root document), while not actually activating any of them within the Shadow DOM realm itself.
2.  exclude.  List of specific MOSE id's to block.  Allows them to flow through to child Shadow Roots.
3.  include.  List of specific MOSE id's to allow.

What functionality do these "synthesizing" custom elements provide, what value-add proposition do they fulfill over what is built into the MountObserver polyfill / package?

The sky is the limit, but focusing on the first example, be-hive, they are:

1.  Managing, interpreting and parsing the attributes that add semantic enhancement vocabularies onto exiting elements.
2.  Establishing the "handshake" that imports the enhancement package, instantiates the enhancement, and passes properties that were previously assigned to the pre-enhanced element to the attached enhancement/behavior.
3.  Providing an inheritable "registry" of reusable scriptlets that can be leveraged in a declarative way.

If one inspects the DOM, one will see grouped (already "parsed") MOSEs, like so:

```html
<be-hive>
   <script type=mountobserver id=be-hive.be-searching></script>
   <script type=mountobserver id=be-hive.be-counted></script>
</be-hive>
```

Without the help of the synthesize method / Synthesizer base class, the developer would need to set these up manually, so this lifts a significant burden from the shoulders of people who want to leverage these behaviors/enhancements in a seamless way.  

The developer of each package defines their MOSE "template", and then syndicates it via the synthesize method:

```JavaScript
MountObserver.synthesize(root: document | shadowRootNode, ctr:  ({new() => Synthesizer}), mose: MOSE)
```

What this method does is it:

1.  Uses [customElements.getName](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/getName) to get the name of the custom element (say it is 'be-hive') from the provided constructor.
2.  Searches for a be-hive tag inside the root node (with special logic for the "head" element).  If not found, creates it.
3.  Places the MOSE inside.


Then in our shadowroot, rather than adding a script type=mountobserver for every single mount observer we want to inherit, we could reference the group via simply:

```html
<be-hive></be-hive>
```

And we can give each inheriting ShadowRoot a personality of its own by customizing the settings within that shadow scope, by manually adding a MOSE with matching id that overrides the inheriting settings with custom settings:

```html
<be-hive>
   <script type=mountobserver id=be-hive.be-searching>
      {
         ...my custom settings
      }
   </script>
</be-hive>
```



