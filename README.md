[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">

Note that much of what is described below has not yet been polyfilled.

## Implementation Status

The following features have been implemented and tested:

### Core Functionality
- ✅ **whereElementMatches**: CSS selector-based element matching
- ✅ **whereAttr**: Complex attribute-based matching with:
  - Built-in vs custom element distinction
  - Attribute prefix variations (data-, enh-, data-enh-)
  - Hierarchical attribute branches with customizable delimiters
  - Coordinate system for attribute mapping
- ✅ **whereInstanceOf**: Constructor-based element filtering (single or array)
- ✅ **whereMediaMatches**: Media query-based conditional mounting (string or MediaQueryList)
- ✅ **whereOutside**: Donut hole scoping (exclude elements inside matching ancestors)

### Lifecycle & Events
- ✅ **mount/dismount/disconnect events**: Element lifecycle tracking
- ✅ **attrchange event**: Attribute change notifications with batching
- ✅ **mediamatch/mediaunmatch events**: Media query state change notifications (with `getPlayByPlay` option)
- ✅ **load event**: Import completion notification

### Advanced Features
- ✅ **Dynamic imports**: Lazy loading of JavaScript modules
- ✅ **assignGingerly**: Property assignment on mount
- ✅ **do callbacks**: Mount/dismount/disconnect/reconnect lifecycle hooks
- ✅ **map configuration**: Metadata mapping for attribute coordinates
- ✅ **once option**: Fire attrchange event only once per attribute
- ✅ **Shared MutationObserver**: Efficient observer sharing across instances
- ✅ **Code splitting**: Conditional features loaded on-demand
- ✅ **Memory management**: WeakRef usage for DOM node references

### Not Yet Implemented
- ❌ Intersection observer integration
- ❌ Container query support
- ❌ Shadow DOM traversal utilities
- ❌ Reconnect event handling
- ❌ Multiple import types (CSS, JSON, HTML)

# The MountObserver api.

Author:  Bruce B. Anderson (with valuable feedback from @doeixd )

Issues / pr's / polyfill:  [mount-observer](https://github.com/bahrus/mount-observer)

Last Update: Aug 7, 2025

## Benefits of this API

What follows is a far more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782).  The goals of the MountObserver api are more encompassing, and less focused on registering custom elements.  In fact, this proposal addresses numerous use cases in one api.  It is basically mapping common filtering conditions in the DOM, to mounting a "campaign" of some sort, like importing a resource, and/or progressively enhancing an element, and/or "binding from a distance".

["Binding from a distance"](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) refers to empowering the developer to essentially manage their own "stylesheets" -- but rather than for purposes of styling, using these rules to attach behaviors, set property values, etc, to the HTML as it streams in.  Libraries that take this approach include [Corset](https://corset.dev/) and [trans-render](https://github.com/bahrus/trans-render), [selector-observer](https://github.com/josh/selector-observer), [pure](http://web.archive.org/web/20160313152905/https://beebole.com/pure/), [weld](https://github.com/tmpvar/weld), [bess](https://github.com/bkardell/bess).  The concept has been promoted by a [number](https://bkardell.com/blog/CSSLike.html) [of](https://www.w3.org/TR/NOTE-AS)  [prominent](https://www.xanthir.com/blog/b4K_0) voices in the community. 

The underlying theme is this api is meant to make it easy for the developer to do the right thing, by encouraging lazy loading and smaller footprints. It rolls up most all the other observer api's into one, including, potentially, [a selector observer](https://github.com/whatwg/dom/issues/1285), which may be a similar duplicate to [the match-media counterpart proposal](https://github.com/whatwg/dom/issues/1225).

### Finite Element Analysis

Most every web application can be recursively broken down into logical regions, building blocks which are assembled together to form the whole site.

At the most micro level, utilizing highly reusable, generic custom elements -- elements that can extend the HTML vocabulary, elements that could be incorporated into the browser, even -- form a great foundation to build on.

But as one zooms out from the micro to the macro, the nature of the components changes in significant ways.

At the micro level, components will have few, if any, dependencies, and those dependencies will tend to be quite stable, and likely all be used. The dependencies will skew more towards tightly coupled utility libraries.

"Macro" level components will tend to be heavy on business-domain specific data, heavy on gluing / orchestrating smaller components, light on difficult, esoteric JavaScript. They aren't confined to static JS files, and likely will include dynamic content as well. They will also be heavy on conditional sections of the application only loading if requested by the user.

ES module based web components may or may not be the best fit for these application macro "modules". A better fit might be a server-centric solution, like Rails, just to take an example.

A significant pain point has to do with downloading all the third-party web components and/or (progressive) enhancements that these macro components / compositions require, and loading them into memory only when needed.


### Does this api make the impossible possible?

There is quite a bit of functionality this proposal would open up, that is exceedingly difficult to polyfill reliably:  

1.  It is unclear how to use mutation observers to observe changes to [custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet).  The closest thing might be a solution like [this](https://davidwalsh.name/detect-node-insertion), but that falls short for elements that aren't visible, or during template instantiation, and requires carefully constructed "negating" queries if needing to know when the css selector is no longer matching.

2.  For simple css matches, like "my-element", or "[name='hello']" it is enough to use a mutation observer, and only observe the elements within the specified DOM region (more on that below).  But as CSS has evolved, it is quite easy to think of numerous css selectors that would require us to expand our mutation observer to need to scan the entire Shadow DOM realm, or the entire DOM tree outside any Shadow DOM, for any and all mutations (including attribute changes), and re-evaluate every single element within the specified DOM region for new matches or old matches that no longer match.  Things like child selectors, :has, and so on. All this is done, miraculously, by the browser in a performant way.  Reproducing this in userland using JavaScript alone, matching the same performance seems impossible.  

3.  Knowing when an element, previously being monitored for, passes totally "out-of-scope", so that no more hard references to the element remain.  This would allow for cleanup of no longer needed weak references without requiring polling.

4.  Some css selectors, such as the [scope donut hole range](https://css-tricks.com/solved-by-css-donuts-scopes/#aa-donut-scoping-with-scope) aren't supported by oEl.querySelectorAll(...) or oEl.matches(...).

###  Most significant use cases.

The amount of code necessary to accomplish these common tasks designed to improve the user experience is significant.  Building it into the platform would potentially:

1.  Give the developer a strong signal to do the right thing, by 
    1.  Making lazy loading of resource dependencies easy, to the benefit of users with expensive networks.
    2.  Supporting "binding from a distance" that can set property values of elements in bulk as the HTML streams in.  For example, say a web page is streaming in HTML with thousands of input elements (say a long tax form).  We want to have some indication in the head tag of the HTML (for example) to make all the input elements read only as they stream through the page. With css, we could do similar things, for example set the background to red of all input elements. Why can't we do something similar with setting properties like readOnly, disabled, etc?  With this api, giving developers the "keys" to css filtering, so they can "mount a campaign" to apply common settings on them all feels like something that almost every web developer has mentally screamed to themselves "why can't I do that?", doesn't it? 
    3.  Supporting "progressive enhancement" more effectively.
2.  Potentially by allowing the platform to do more work in the low-level (c/c++/rust?) code, without as much context switching into the JavaScript memory space, which may reduce cpu cycles as well.  This is done by passing into the API substantial number of conditions, which can all be evaluated at a lower level, before the api needs to surface up to the developer "found one!".
3.  As discussed earlier, to do the job right, polyfills really need to reexamine **all** the elements within the observed node for matches **anytime any element within the Shadow Root so much as sneezes (has attribute modified, changes custom state, etc)**, due to modern selectors such as the :has selector.  Surely, the platform has found ways to do this more efficiently?  

The extra flexibility this new primitive would provide could be quite useful to things other than lazy loading of custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.
 

## First use case -- lazy loading custom elements

To specify the equivalent of what the alternative proposal linked to above would do, we can do the following:

```JavaScript
const observer = new MountObserver({
   select:'my-element', //not supported by this polyfill
   import: './my-element.js',
   do: ({localName}, {modules, observer, mountInit, rootNode}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
   
}, {disconnectedSignal: new AbortController().signal});
observer.observe(document);
```

The do function will *only be called once per matching element* -- i.e. if the element stops matching the "select" criteria, then matches again, the do function won't be called again.  It will be called for all elements when they match within the scope passed in to the observe method.  However, the events discussed below, will continue to be called repeatedly.

The constructor argument can also be an array of objects that fit the pattern shown above.

In fact, as we will see, where it makes sense, where we see examples that are strings, we will also allow for arrays of such strings.  For example, the "select" key can point to an array of CSS selectors (and in this case the mount/dismount callbacks would need to provide an index of which one matched).  I only recommend adding this complexity if what I suspect is true -- providing this support can reduce "context switching" between threads / memory spaces (c++ vs JavaScript), and thus improve performance.  If multiple "on" selectors are provided, and multiple ones match, I think it makes sense to indicate the one with the highest specifier that matches.  It would probably be helpful in this case to provide a special event that allows for knowing when the matching selector with the highest specificity changes for mounted elements.

If no imports are specified, it would go straight to do (if any such callbacks are specified), and it will also dispatch events as discussed below.

This only searches for elements matching 'my-element' outside any shadow DOM.

But the observe method can accept a node within the document, or a shadowRoot, or a node inside a shadowRoot as well.

The "observer" constant above is a class instance that inherits from EventTarget, which means it can be subscribed to by outside interests.

> [!Note]
> Reading through the historical links tied to the selector-observer proposal this proposal helped spawn, I may have painted an overly optimistic picture of [what the platform is capable of](https://github.com/whatwg/dom/issues/398).  It does leave me a little puzzled why this isn't an issue when it comes to styling, and also if some of the advances that were utilized to support :has could be applied to this problem space, so that maybe the arguments raised there have weakened.  Even if the concerns raised are as relevant today, I think considering the use cases this proposal envisions, that the objections could be overcome, for the following reasons: 1.  For scenarios where lazy loading is the primary objective, "bunching" multiple DOM mutations together and only reevaluating when things are quite idle is perfectly reasonable.  Also, for binding from a distance, most of the mutations that need responding to quickly will be when the *state of the host* changes, so DOM mutations play a somewhat muted role in that regard. Again, bunching multiple DOM mutations together, even if adds a bit of a delay, also seems reasonable.  I also think the platform could add an "analysis" step to look at the query and categorize it as "simple" queries vs complex.  Selector queries that are driven by the characteristics of the element itself (localName, attributes, etc) could be handled in a more expedited fashion.  Those that the platform does expect to require more babysitting could be monitored for less vigilantly.  Maybe in the latter case, a console.warning could be emitted during initialization.  The other use case, for lazy loading custom elements and custom enhancements based on attributes, I think most of the time this would fit the "simple" scenario, so again there wouldn't be much of an issue.

In fact, I have encountered statements made by the browser vendors that some queries supported by css can't be evaluated simply by looking at the layout of the HTML, but has to be made after rendering and performing style calculations.  This necessitates having to delay the notification, which would be unacceptable.

If the developer has a simple query in mind that needs no such nuance, I'm thinking it might be helpful to provide an alternative key to "select" that is used specifically for (a subset?) of queries supported by the existing "matches" method that elements support, maybe even after the browser vendors provide a selector-observer (if ever).

So the developer could use:

## Polyfill Supported Mount Observer

```JavaScript
const observer = new MountObserver({
   whereElementMatches:'my-element',
   import: './my-element.js',
   do: ({localName}, {modules, observer, mountInit, rootNode}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
   
}, {disconnectedSignal: new AbortController().signal});
observer.observe(document);
```

and could perhaps expect faster binding as a result of the more limited supported expressions.  Since "select" is not specified, it is assumed to be "*".

This polyfill in fact only supports this latter option ("whreElementMatches"), and leaves "select" for such a time as when a selector observer is available in the platform.

[Implemented as Requirement 1](requirements/Requirement1.md).

##  The import key

This proposal has been amended to support multiple imports, including of different types:

```JavaScript
const observer = new MountObserver({
   whereElementMatches:'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
   ],
   do: ({localName}, {modules, observer, mountInit, rootNode}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[1].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
});
observer.observe(document);
```

Once again, the key can accept either a single import, but alternatively it can also support multiple imports (via an array).

The do function won't be invoked until all the imports have been successfully completed and inserted into the modules array.

Previously, this proposal called for allowing arrow functions as well, thinking that could be a good interim way to support bundlers, as well as multiple imports.  But the valuable input provided by [doeixd](https://github.com/doeixd) makes me think that that interim support could more effectively be done by the developer in the do methods.

This proposal would also include support for JSON and HTML module imports (really, all types).

[Implemented as Requirement 1](requirements/Requirement1.md).

## Preemptive downloading

There are two significant steps to imports, each of which imposes a cost:  

1.  Downloading the resource.
2.  Loading the resource into memory.

What if we want to *download* the resource ahead of time, but only load into memory when needed?

The link rel=modulepreload option provides an already existing platform support for this, but the browser complains when no use of the resource is used within a short time span of page load.  That doesn't really fit the bill for lazy loading custom elements and other resources.

So for this we add loadingEagerness:

```JavaScript
const observer = new MountObserver({
   select: 'my-element', //not supported by this polyfill
   loadingEagerness: 'eager',
   import: './my-element.js',
   do: ({localName}, {modules}) => customElements.define(localName, modules[0].MyElement),
});
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.

> [!NOTE]
> As a result of the google IO 2024 talks, I became aware that there is some similarity between this proposal and the [speculation rules api](https://developer.chrome.com/blog/speculation-rules-improvements).  This motivated the change to the property from "loading" to loadingEagerness above.

## Separating JS imperative code from JSON serializable config



In order to support pure 100% declarative syntax in the passed in mountInit argument, we need to be able to import the do function.  This is done as follows:

```JavaScript
//module myActions.js
const  doFunction = function({localName}, {modules, observer, mountInit, rootNode}){
   if(!customElements.get(localName)) {
      // Find the first exported class constructor from the module
      const ElementClass = Object.values(modules[0]).find(exp => 
         typeof exp === 'function' && exp.prototype && exp.prototype.constructor === exp
      );
      if(ElementClass) {
         customElements.define(localName, ElementClass);
      }
   }
   observer.disconnectedSignal.abort();
}
export {doFunction as do}

// observer setup

const observer = new MountObserver({
   whereElementMatches:'my-element',
   import: [
      './my-element.js',
      ['./my-element-small.css', {type: 'css'}],
      './myActions.js'
   ],
   reference: 2
});
observer.observe(document);

```

Here "2" refers to the imported module index ('./myActions.js' in this case).

### How the reference property works

The `reference` property allows you to call `do` functions from imported modules, enabling 100% JSON-serializable configuration. This is useful when you want to separate imperative code from declarative configuration.

**Key behaviors:**
- The `reference` property can be a single number or an array of numbers, each referring to an import index
- Referenced modules must be JavaScript modules (not CSS, JSON, or HTML imports)
- If a referenced module exports a `do` function, it will be called after the inline `do` callback (if present)
- If a referenced module doesn't export a `do` function, it's silently skipped
- The inline `do` callback runs first, then referenced `do` functions run in the order specified

**Important:** Since `do` is a reserved keyword in JavaScript, you must export it using the syntax:
```javascript
const doFunction = function(element, context) { /* ... */ };
export { doFunction as do };
```

**Validation:** The `reference` property is validated in the constructor:
- Throws an error if `import` is not defined
- Throws an error if any index is out of bounds
- Throws an error if any index points to a non-JS module (e.g., CSS or JSON import)

Multiple references can also be made.

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

[Implemented as [Requirement11](requirements/Requirement11.md)]

### Referenced whereInstanceOf

Similar to the `do` function, the `whereInstanceOf` check can also be moved to imported modules for 100% JSON-serializable configuration:

```javascript
// module mySettings.js
const doFunction = function({localName}, {modules, observer, mountInit, rootNode}) {
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
};

const whereInstanceOf = [HTMLMarqueeElement, SVGElement];

export { doFunction as do, whereInstanceOf };

// my local module
const observer = new MountObserver({
   whereElementMatches: 'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
      './mySettings.js'
   ],
   reference: 2
});
observer.observe(document);
```

**Behavior:**
- **Combining checks**: If both inline `whereInstanceOf` and referenced `whereInstanceOf` exist, they are AND'd together (element must match both)
- **Multiple references**: If multiple referenced modules export `whereInstanceOf`, the element must match ALL of them (AND logic)
- **Validation**: Referenced `whereInstanceOf` is validated after imports load. Throws an error if not a Constructor or array of Constructors
- **Optional export**: If a referenced module doesn't export `whereInstanceOf`, it's silently ignored
- **Timing**: 
  - With lazy loading (default): Inline `whereInstanceOf` is checked first (before imports), then referenced checks happen after imports load
  - With `loadingEagerness: 'eager'`: Both inline and referenced checks happen together after imports are loaded

This optimization ensures that with lazy loading, elements that don't match the inline `whereInstanceOf` won't trigger unnecessary imports.

[Implemented as [Requirement12](requirements/Requirement12.md)]



## Mount Observer Script Elements (MOSEs)

Following an approach similar to the [speculation api](https://developer.chrome.com/blog/speculation-rules-improvements), we can add a script element anywhere in the DOM:

```JavaScript
// myPackage/myDefiner.js
//my all powerful custom element definer
const doFunction = function({localNme}, {modules, observer}){
   if(!customElements.get(localName)) {
      customElements.define(localName, modules[1].MyElement);
   }
   observer.disconnectedSignal.abort();
}
export { doFunction as do };
```

```html
<script type="mountobserver" >
{
   "select":"my-element",
   "import": [
      ["./my-element-small.css", {type: "css"}],
      "./my-element.js",
      "myPackage/myDefiner.js
   ],
   "reference": 2
}
</script>
```

To keep this proposal / polyfill of reasonable size, mount observer script elements has its own [repo / sub-proposal](https://github.com/bahrus/mount-observer-script-element).  There's much more to it, but it is awaiting implementation of scoped custom element registry before finalizing the requirements and (re)-implementing.

But I think it's important to think about this way of making the mount observer declarative, as it provides one significant reason why we place so much emphasis on making sure that the mount observer settings (mountInit) is as JSON serializable as possible.


## Binding from a distance

It is important to note that "whereElementMatches" is a css query with no restrictions.  So something like:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, mountInit, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, mountInit){
      mountedElement.textContent = 'goodbye';
   }
}

const observer = new MountObserver({
   // not supported by polyfill
   //select: 'div > p + p ~ span[class$="name"]' 
   // is supported:
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: (mountedElement, ctx) => {
      new MyHandler(mountedElement, ctx);
   },
});
observer.observe(document);
```


... would work.

EvtRt is a convenience class provided with the polyfill package, and is considered part of this proposal (see how it is used below  by built in handlers).

Note that in this example, "do" no longer points to a function.  When it did (above), we mentioned this would only be called once per element.  **Now it will be called every time the conditions flip from not all satisfied to satisfied"**.

This would allow developers to create "stylesheet" like capabilities.

## Registering reusable handlers with MountObserver.define

To make MountInit configurations more JSON-serializable and encourage code reuse, you can register handler classes with string names and reference them by name:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, mountInit, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, mountInit){
      mountedElement.textContent = 'bye';
   }
}

// Register the handler with a string name
MountObserver.define('myHandler', MyHandler);

// Reference it by name in the configuration
const observer = new MountObserver({
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: 'myHandler'  // String reference instead of inline function
});
observer.observe(document);
```

### Benefits of registered handlers

1. **JSON serialization**: Configurations using string references can be serialized to JSON
2. **Code reuse**: Define handlers once, use them in multiple observers
3. **Separation of concerns**: Keep handler logic separate from configuration

### Using arrays with mixed types

The `do` property can be a string, a function, or an array mixing both:

```JavaScript
MountObserver.define('logger', LoggerHandler);
MountObserver.define('validator', ValidatorHandler);

const observer = new MountObserver({
   whereElementMatches: 'input',
   do: [
      'logger',                    // Registered handler
      (element, ctx) => {          // Inline function
         element.dataset.processed = 'true';
      },
      'validator'                  // Another registered handler
   ]
});
```

Handlers execute in the order specified. If a handler constructor throws an error, execution stops and subsequent handlers won't run.

### Interaction with the reference property

When both `do` (with string/array) and `reference` are specified, the execution order is:

1. Inline `do` functions and registered handlers (from `do` strings), in whatever order they appear
2. Referenced `do` functions (from `reference` property)

```JavaScript
MountObserver.define('setup', SetupHandler);

const observer = new MountObserver({
   whereElementMatches: 'button',
   import: './button-actions.js',
   reference: 0,
   do: ['setup', (el) => { el.dataset.ready = 'true'; }]
});
// Execution order: setup handler, inline function, then imported do function
```

### Handler requirements

Registered handlers must be classes (constructors) that accept `(mountedElement: Element, ctx: MountContext)` as constructor parameters. They can be:

- ES6 classes extending `EvtRt` (recommended)
- ES6 classes with custom logic
- ES5-style constructor functions

```JavaScript
// ES5-style constructor function
function SimpleHandler(element, ctx) {
   element.textContent = 'Handled!';
}

MountObserver.define('simple', SimpleHandler);
```

### Error handling

**Validation at construction time**: If you reference an unregistered handler name, an error is thrown when creating the MountObserver:

```JavaScript
const observer = new MountObserver({
   do: 'nonexistent'  // Error: No handler defined for nonexistent
});
```

**Duplicate registration**: Attempting to register the same name twice throws an error:

```JavaScript
MountObserver.define('myHandler', Handler1);
MountObserver.define('myHandler', Handler2);  // Error: myHandler already in use
```



### Global registry

The handler registry is global and shared across all MountObserver instances, similar to the custom elements registry. Once a handler is registered, it can be used by any MountObserver instance in your application.

[Implemented as [Requirement14](requirements/Requirement14.md)]

### Built in handlers

This proposal advocates having the platform provide some built in handlers, that extend EvtRt, that is included with this Polyfill.

#### Log to console handler

const observer = new MountObserver({
   // not supported by polyfill
   //select: 'div > p + p ~ span[class$="name"]' 
   // is supported:
   whereElementMatches: 'div > p + p ~ span[class$="name"]',
   do: 'builtIns.logToConsole'
});
observer.observe(document);
```

This logs to console all the events (mount, dismount, disconnect)



## Applying properties with assignGingerly

For the common use case of setting properties on matching elements, MountObserver provides built-in support for the [assignGingerly](https://github.com/bahrus/assign-gingerly) library. This allows us to declaratively specify properties to apply to elements without writing custom mount callbacks:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'input',
   assignGingerly: {
      disabled: true,
      value: 'Default value',
      title: 'This is a tooltip'
   }
});
observer.observe(document);
```

This will automatically apply the specified properties to all matching input elements, both existing ones and those added dynamically.

[Implemented as [Requirement2](requirements/Requirement2.md)]

### Nested properties with dataset

The `assignGingerly` library supports nested property assignment using the `?.` notation. This is particularly useful for setting data attributes and style:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'button',
   assignGingerly: {
      disabled: false,
      '?.dataset?.action': 'submit',
      '?.dataset?.trackingId': '12345',
      '?.style': {
         color: 'white',
         height: '25px',
      }
   }
});
observer.observe(document);
```

The `?.` prefix tells assignGingerly to create nested properties if they don't exist. In this example, `?.dataset?.action` will set the `data-action` attribute on the button elements.

### Combining with imports

You can combine `assignGingerly` with lazy loading to both import resources and set properties:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'my-element',
   import: './my-element.js',
   assignGingerly: {
      theme: 'dark',
      '?.dataset?.initialized': 'true'
   },
   do: ({localName}, {modules}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
   }
});
observer.observe(document);
```

The `assignGingerly` properties are applied after imports are loaded but before the `do` callback is invoked, ensuring that elements are properly configured before any custom initialization logic runs.

### Performance benefits

Using `assignGingerly` provides several benefits:

1. **Lazy loading**: The assign-gingerly library is only loaded when needed (when the `assignGingerly` property is specified)
2. **Bulk operations**: Properties are applied efficiently to all matching elements
3. **Declarative**: No need to write custom mount callbacks for simple property assignments
4. **Consistent**: The same property values are applied uniformly across all matching elements

### Dynamically updating assignGingerly configuration

The `MountObserver` class provides a public `assignGingerly()` method that allows you to merge new updates into the  observer. This is useful for responding to user actions or application state changes:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'input',
   assignGingerly: {
      disabled: true,
      value: 'Initial value'
   }
});
observer.observe(document);

// Later, update the configuration
await observer.assignGingerly({
   title: 'Updated tooltip',
   placeholder: 'New placeholder'
});
```

**Key behaviors:**

1. **Merging**: New properties are merged with existing configuration. In the example above, future elements will receive all properties: `disabled`, `value`, `title`, and `placeholder`.

2. **Applies to existing elements**: The new properties are immediately applied to all currently mounted elements.

3. **Applies to future elements**: Future elements that mount will receive the merged configuration.

4. **Starting without initial config**: You can call the method even if no `assignGingerly` was specified in the constructor:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'input'
});
observer.observe(document);

// Set configuration later
await observer.assignGingerly({
   disabled: true,
   value: 'Set via method'
});
```

5. **Clearing configuration**: Pass `undefined` to clear the configuration for future elements (already-mounted elements keep their properties):

```JavaScript
await observer.assignGingerly(undefined);
// Future elements will not have properties applied
// Existing elements retain their current properties
```

**Method signature:**
```TypeScript
async assignGingerly(config: Record<string, any> | undefined): Promise<void>
```

The method is async because the assign-gingerly library is loaded dynamically when needed.

[Implemented as [Requirement9](requirements/Requirement9.md)]

## Emitting events from mounted elements

MountObserver can automatically dispatch custom events from elements when they mount. This is useful for:

1. **Signaling readiness**: Notify parent components or listeners that an element is ready
2. **Initialization events**: Trigger workflows when elements appear in the DOM
3. **Decoupled communication**: Allow elements to announce their presence without tight coupling

### Basic event emission

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'button[data-action]',
   mountedElemEmits: {
      event: 'Event',
      args: 'custom-ready'
   }
});
observer.observe(document);
```

This dispatches a `custom-ready` event from each matching button element when it mounts. Events bubble by default, so you can listen at the document level:

```JavaScript
document.addEventListener('custom-ready', (e) => {
   console.log('Button ready:', e.target);
});
```

### Event constructors

You can specify any event constructor available in `globalThis`:

```JavaScript
mountedElemEmits: {
   event: 'CustomEvent',
   args: ['element-ready', { detail: { timestamp: Date.now() } }]
}
```

Or pass a constructor directly:

```JavaScript
mountedElemEmits: {
   event: CustomEvent,
   args: ['element-ready', { detail: { timestamp: Date.now() } }]
}
```

### Magic string substitution

Use magic strings to inject dynamic values into event data:

- `{{mountedElement}}` - The element that just mounted
- `{{mountInit}}` - The MountInit configuration object

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'button[data-test]',
   mountedElemEmits: {
      event: 'CustomEvent',
      args: ['element-mounted', { 
         detail: { 
            element: '{{mountedElement}}',
            config: '{{mountInit}}'
         }
      }]
   }
});
```

Magic strings work at any depth in nested objects and arrays:

```JavaScript
mountedElemEmits: {
   event: 'CustomEvent',
   args: ['data-ready', {
      detail: {
         nested: {
            deep: {
               element: '{{mountedElement}}'
            }
         }
      }
   }]
}
```

### Multiple events

Emit multiple events in sequence by providing an array:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'my-component',
   mountedElemEmits: [
      { event: 'Event', args: 'component-loading' },
      { event: 'Event', args: 'component-ready' },
      { event: 'CustomEvent', args: ['component-initialized', { detail: { version: '1.0' } }] }
   ]
});
```

Events are dispatched in the order specified.

### Event properties with eventProps

Apply additional properties to the event object using `eventProps`:

```JavaScript
mountedElemEmits: {
   event: 'CustomEvent',
   args: ['ready', { detail: {} }],
   eventProps: {
      timestamp: Date.now(),
      source: 'mount-observer',
      element: '{{mountedElement}}'
   }
}
```

Properties are applied using the [assignGingerly](https://github.com/bahrus/assign-gingerly) library, which supports nested property assignment with the `?.` notation.

### Fire once per element

Use `oncePerMountedElement` to ensure an event only fires the first time an element mounts:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'button[data-once]',
   mountedElemEmits: {
      event: 'Event',
      args: 'initialized',
      oncePerMountedElement: true
   }
});
```

If the element is removed and re-added to the DOM, the event will not fire again. This is useful for initialization events that should only happen once per element instance.

### Performance considerations

The event emission logic is code-split into a separate module (`emitEvents.js`) that is only loaded when `mountedElemEmits` is configured. This keeps the core MountObserver lean for users who don't need this feature.

### Complete example

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'my-widget',
   import: './my-widget.js',
   mountedElemEmits: [
      {
         event: 'CustomEvent',
         args: ['widget-loading', { 
            detail: { 
               element: '{{mountedElement}}',
               timestamp: Date.now()
            }
         }],
         oncePerMountedElement: true
      },
      {
         event: 'Event',
         args: 'widget-ready'
      }
   ],
   do: ({localName}, {modules}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyWidget);
      }
   }
});

// Listen for events
document.addEventListener('widget-loading', (e) => {
   console.log('Widget loading:', e.detail.element);
});

document.addEventListener('widget-ready', (e) => {
   console.log('Widget ready:', e.target);
});

observer.observe(document);
```

[Implemented as [Requirement10](requirements/Requirement10.md)]

## Element-specific lifecycle notifications with getNotifier

While the MountObserver dispatches lifecycle events (mount, dismount, disconnect, attrchange) at the observer level, sometimes you need to listen for events specific to a single element. The `getNotifier()` method returns an EventTarget that dispatches filtered events for only that element.

### Basic usage

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'button',
   do: (mountedElement, {observer}) => {
      const notifier = observer.getNotifier(mountedElement);
      
      notifier.addEventListener('mount', (e) => {
         console.log('This specific button mounted', e.mountedElement);
      });
      
      notifier.addEventListener('dismount', (e) => {
         console.log('This specific button dismounted', e.mountedElement, e.reason);
      });
      
      notifier.addEventListener('disconnect', (e) => {
         console.log('This specific button disconnected', e.mountedElement);
      });
   }
});
observer.observe(document);
```

### When mount events fire on notifiers

The notifier follows a specific rule for mount events:

- **First mount**: If `getNotifier()` is called during the `do` callback (when the element is mounting), the mount event does NOT fire on the notifier
- **Subsequent mounts**: After the element dismounts and mounts again, the mount event WILL fire on the notifier

This prevents duplicate mount notifications when setting up listeners during the initial mount.

```JavaScript
const observer = new MountObserver({
   whereElementMatches: '#my-button',
   do: (element, {observer}) => {
      const notifier = observer.getNotifier(element);
      
      // This listener won't fire for the current mount
      // (since we're inside the do callback)
      notifier.addEventListener('mount', () => {
         console.log('Element re-mounted after being removed');
      });
   }
});
```

### Creating notifiers before mounting

You can call `getNotifier()` at any time, even before an element mounts:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: '#future-button'
});
observer.observe(document);

// Get notifier before element exists
const button = document.createElement('button');
button.id = 'future-button';

const notifier = observer.getNotifier(button);
notifier.addEventListener('mount', () => {
   console.log('Button mounted!'); // This WILL fire
});

// Add to DOM later
document.body.appendChild(button);
```

When the notifier is created before the element mounts, the mount event fires normally.

### Filtered attrchange events

For `attrchange` events, the notifier receives a filtered version containing only changes for that specific element:

```JavaScript
const observer = new MountObserver({
   whereElementMatches: 'input',
   whereAttr: {
      hasBuiltInRootIn: ['data'],
      hasCERootIn: ['data'],
      hasBase: 'value',
      hasBranchIn: ['']
   },
   do: (element, {observer}) => {
      const notifier = observer.getNotifier(element);
      
      notifier.addEventListener('attrchange', (e) => {
         // e.changes only contains changes for this specific input
         console.log('Attribute changed on this input:', e.changes);
      });
   }
});
```

Even if multiple elements have attribute changes in the same mutation batch, each notifier only receives the changes relevant to its element.

### Use cases

Element-specific notifiers are useful for:

1. **Progressive enhancement**: Attach/detach behaviors when elements mount/dismount
2. **Cleanup on disconnect**: Remove event listeners or cancel timers when elements are removed
3. **Peer element coordination**: React to changes in related elements
4. **Lifecycle-aware components**: Build components that respond to their own mounting state

### Performance notes

- Notifiers are cached in a WeakMap, so calling `getNotifier()` multiple times for the same element returns the same EventTarget
- No explicit cleanup is needed - notifiers are garbage collected when their elements are
- The notifier continues to exist even after the element disconnects, allowing it to receive mount events if the element is re-added

**Method signature:**
```TypeScript
getNotifier(element: Element): EventTarget
```

[Implemented as [Requirement13](requirements/Requirement13.md)]


##  Extra lazy loading

By default, the matches would be reported as soon as an element matching the criterion is found or added into the DOM, inside the node specified by rootNode.

However, we could make the loading even more lazy by specifying intersection options:

```JavaScript
const observer = new MountObserver({
   select: 'my-element', //not supported by polyfill
   whereElementIntersectsWith:{
      rootMargin: "0px",
      threshold: 1.0,
   },
   import: './my-element.js'
});
```

## Media / container queries / instanceOf / custom checks [TODO] out of date

Unlike traditional CSS @import, CSS Modules don't support specifying different imports based on media queries.  That can be another condition we can attach (and why not throw in container queries, based on the rootNode?):

```JavaScript
const observer = new MountObserver({
   select: 'div > p + p ~ span[class$="name"]',
   whereMediaMatches: '(max-width: 1250px)',
   whereSizeOfContainerMatches: '(min-width: 700px)',
   whereContainerHas: '[itemprop=isActive][value="true"]',
   whereInstanceOf: [HTMLMarqueeElement], //or ['HTMLMarqueeElement']
   whereLangIn: ['en-GB'],
   whereConnectionHas:{
      effectiveTypeIn: ["slow-2g"],
   },
   import: ['./my-element-small.css', {type: 'css'}],
   do: {
      confirm: (mountedElement, (e: MountObserverConfirmEvent) => {
         e.isSatisfied = true;
         e.preventDefault();
      }),
      mount: ({localName}, {modules}) => {
        ...
      },
      dismount: ...,
      disconnect: ...,
      move: ...,
      reconnect: ...,
      confirm: ...,
      reconfirm: ...,
      exit: ...,
      forget: ...,
   }
});
```

[whereInstanceOf implemented as [Requirement5](requirements/Requirement5.md)]

[whereMediaMatches implemented as [Requirement6](requirements/Requirement6.md)]

## InstanceOf checks in detail

Carving out the special "whereInstanceOf" check is provided based on the assumption that there's a performance benefit from doing so. If not, the developer could just add that check inside the "confirm" callback logic (discussed later).  For built-in elements, we can alternatively provide the string name, as indicated in the comment above, which certainly makes it JSON serializable, thus making it easy as pie to include in the MOSE JSON payload.  I don't think there would be any ambiguity in doing so, which means I believe that answers the mystery in my mind whether it could be part of the low-level checklist that could be done within the c++/rust code / thread.

The picture becomes murkier for custom elements.  The best solution in that case seems to be to utilize customElements.getName(...) as a basis for the match, but at first glance, that could  preclude being able to use base classes which a family of custom elements subclass, if that superclass isn't itself a custom element.  I suppose the solution to this conundrum, when warranted, is simply to burden the developer with defining a custom element for the superclass, and thus assigning it a name, applicable within ShadowDOM scopes as needed, even though it isn't actually necessarily used for any live custom elements. This would require already having imported the base class, only benefitting from lazy loading the code needed for each sub class, which might not always be all that high as a percentage, compared to the base class.

However, where this support for "whereInstanceOf" would be *most* helpful is when it comes to [*custom enhancements*](https://github.com/WICG/webcomponents/issues/1000) that only wish to lazily layer some heavy lifting functionality on top of certain families of already loaded and upgraded custom elements (possibly in addition to some (specified) built in elements).  Here, the lazy loading of the *entire custom **enhancement***, based on the presence in the DOM of a member of the family of custom elements, would, if my calculations are correct, result in providing a significant benefit. 
 

<!--

[TODO] Maybe should also (optionally?) pass back which checks failed and which succeeded on dismount.  Not sure I really see a use case for it, but leaving the thought here for now 

--> 

## Subscribing

Subscribing can be done via:

```JavaScript
observer.addEventListener('confirm', e => {
  e.isSatisfied = true; //or false to prevent the mount event below
});
observer.addEventListener('mount', e => {
  console.log({
      mountedElement: e.mountedElement, 
      module: e.module
   });
});
observer.addEventListener('dismount', e => {
  ...
});
observer.addEventListener('disconnect', e => {
  ...
});
observer.addEventListener('move', e => {
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

[mount, dismount, disconnect] events implemented

## Explanation of all states / events

Normally, an element stays in its place in the DOM tree, but the conditions that the MountObserver instance is monitoring for can change for the element, based on modifications to the attributes of the element itself, or its custom state, or to other peer elements within the shadowRoot, if any, or window resizing, etc.  As the element meets or doesn't meet all the conditions, the mountObserver will first call the corresponding mount/dismount callback, and then dispatch event "mount" or "dismount" according to whether the criteria are all met or not.

The moment a MountObserver instance's "observe" method is called (passing in a root node), it will inspect every element within its subtree (not counting ShadowRoots), and then call the "mount" callback, and dispatch event "mount" for those elements that match the criteria.  It will *not* dispatch "dismount" for elements that don't.

If an element that is in "mounted" state according to a MountObserver instance is moved from one parent DOM element to another:

1)  "disconnect" event is dispatched from the MountObserver instance the moment the mounted element is disconnected from the DOM fragment (but not if employing the experimental but promising atomic moving API).
2)  If/when the element is added somewhere else in the DOM tree, the mountObserver instance will dispatch event "reconnect", regardless of where. [Note:  can't polyfill this very easily]
3)  If the mounted element is added outside the rootNode being observed, the mountObserver instance will dispatch event "exit", and the MountObserver instance will relinquish any further responsibility for this element.  
4)  Ideally event "forget" would be dispatched just before the platform garbage collects an element the MountObserver instance is still monitoring, after all hard references are relinquished (or is that self-contradictory?).
5)  If the new place it was added remains within the original rootNode and remains mounted, the MountObserver instance dispatches event "reconfirmed".
6)  If the element no longer satisfies the criteria of the MountObserver instance, the MountObserver instance will dispatch event "dismount". 

The move event would become available at the outset of the [atomic moving](https://github.com/whatwg/dom/issues/1255) proposal getting shipped universally.

## Justification for callbacks as well as events, and discussion of the signature

Callbacks like we saw in our earlier examples above are useful for tight coupling, and probably are unmatched in terms of performance.  The expression that the "do" field points to could in fact be a (stateful) user defined class instance.

However, since these rules may be of interest to multiple parties, it is useful to also provide the ability for multiple parties to subscribe to these DOM filtering events.

If the performance isn't impacted, I think it would be most convenient for the developer if, at a minimum, the second argument of the callbacks above in fact precisely match the loosely coupled events.  The callback would get the first dibs on the event, and have the opportunity to prevent the event from going any further before getting dispatched, using something like stopPropagation. I don't yet have any compelling use cases for that scenario, but I think there probably are some.

In which case the argument becomes quite strong that the inconsistency of making the callback methods above  have a separate parameter where the matching element is passed is unwise. Simply making the matching element be part of the event payload, as is done for the loosely coupled events discussed above, would reduce the learning curve, and make it easier to share logic between the two.  

On the other hand, providing the matching element as a separate parameter makes the ergonomics a tiny bit smoother as far as dynamically ascertaining the local name and other properties of the element (i.e. destructuring requires one more step for lazily defining the custom element).  

I'm on the fence on that one.   I think the benefits either way to DX are so small, that performance metrics should probably dictate which way to go.

## Dismounting

[TODO] This section is out of date

In many cases, it will be critical to inform the developer **why** the element no longer satisfies all the criteria.  For example, we may be using an intersection observer, and when we've scrolled away from view, we can "shut down" until the element is (nearly) scrolled back into view.  We may also be displaying things differently depending on the network speed.  How we should respond when one of the original conditions, but not the other, no longer applies, is of paramount importance.

So the dismount event should provide a "checklist" of all the conditions, and their current value:

```JavaScript
mediaMatches: true,
containerMatches: true,
satisfiesCustomConditiselect: true,
whereLangIn: ['en-GB'],
whereConnectiselect:{
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

[Implemented with [Requirement6](requirements/Requirement6.md)]


## Support for "donut hole scoping"

While browsers are getting support for css based donut hole scoping, such support appears to be elusive for oElement.querySelectorAll(...) and oElement.matches(...).  In fact it is unclear to me how oElement.matches(...) would ever be able to support it.  Such support would be quite useful for microdata-based binding.

Ideally, should this proposal be built into the browser, it would as a matter of course support donut hole scoping.

For the polyfill, we need to support it as follows:

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

The check for "whereOutside" is done via script:

```JavaScript
import {whereOutside} from 'mount-observer/whereOutside.js';
whereOutside(oContainerNode: Node, matchCandidate: Element, outside: string){
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

[Implemented as [Requirement7](requirements/Requirement7.md)]

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
   select: '*',
   observedAttrsWhenMounted: ['lang', 'contenteditable']
});

mo.addEventListener('attrChange', e => {
   console.log(e);
   // {
   //    mountedElement,
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
   select: '*',
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
      select: '*',
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
      //    mountedElement,
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
        hx-select:htmx:config-request="event.detail.parameters.example = 'Hello Scripting!'">
    Post Me!
</button>
```

To support such syntax, specify the delimiters thusly:

```JavaScript
const mo = new MountObserver({
   select: '*',
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
   select: '*',
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

This proposal "sneaks in" one more expansive feature, that perhaps should stand separately as its own proposal.  Because the MountObserver api allows us to attach behaviors on the fly based on css matching, and because the MountObserver would provide developers the "first point of contact" for such functionality, the efficiency argument seemingly "screams out" for this feature.

Also, this proposal is partly focused on better management of importing resources "from a distance", in particular via imports carried out via http.  Is it such a stretch to look closely at scenarios where that distance happens to be shorter, i.e. found somewhere [in the document tree structure](https://github.com/tc39/proposal-module-expressions)?

The need for importing templates by id is also demonstrated by Corset's [Todo list example](https://codepen.io/matthewp/details/ZEXpJYr):

```CSS
#todos {
   each-items: ${todos};
   each-template: select(#todo-template);
   each-key: title;
}
```

The mount-observer is always on the lookout for template tags with a src attribute starting with # (as well as url patterns):

```html
<template src=#id-of-source-template></template>
```

For example:

```html
<div>Your Mother Should Know</div>
<div>I Am the Walrus</div>
<template src=#id-of-source-template>
   <span part=greeting>hello</span>
   <span part=parting>goodbye<span>
</template>
<div>Strawberry Fields Forever</div>
```

Optionally, a rel=stream attribute can be specified.  Other values of the attribute will result in different behavior from what is described below:

```html
<template rel=stream src=#id-of-source-template>
   <span part=greeting>hello</span>
   <span part=parting>goodbye<span>
</template>
```

When it encounters such a thing, it searches "upwardly" through the chain of ShadowRoots for a template with id=id-of-source-template (in this case), and caches them as it finds them. 

Let's say the source template looks as follows:

```html
<template id=id-of-source-template>
   <div>
      You say, <span part=parting></span> and I say, 
      <span part=greeting></span>, <span part=greeting></span>, <span part=greeting></span>
   </div>
   <div>
      I don't know why you say 
      <span part=parting></span> 
       I say 
      <span part=greeting></span>
   </div>
</template>
```

What we end up with is:


```html
<div>Your Mother Should Know</div>
<div>I Am the Walrus</div>
<?+?>
<div>
   You say, <span part=parting>goodbye</span> and I say, 
   <span part=greeting>hello</span>, <span part=greeting>hello</span>, <span part=greeting>hello</span>
</div>
<div>
   I don't know why you say 
   <span part=parting>goodbye</span>
    I say 
   <span part=greeting>hello</span>
</div>
<?-?>
<div>Strawberry Fields Forever</div>
```

Some significant differences with slot support as used with (ShadowDOM'd) custom elements

1.  The mechanism to weave DOM together is more flexible here:  We are searching for DOM elements that match all the attributes of the children of the *target* template, that template that is pulling in the intra document source template.  The "part" attribute was used just as an example.
2.  There is no mechanism for updating slots.  That is something under investigation with this userland [custom enhancement](https://github.com/bahrus/be-inclusive) that allows for updating the existing DOM tree based on identical syntax.
2.  ShadowDOM's slots act on a "many to one" basis.  Multiple light children with identical slot identifiers all get merged into a single (first?) matching slot within the Shadow DOM.  These "birtual" (birth-only, virtual) streaming inclusions, instead, follow the opposite approach -- a single element can get cloned into multiple slot targets as it weaves itself into the templates as they get merged together.

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

The discussion there leads to an open question whether a processing instruction would be better.  I think the compose tag would make much more sense, vs a processing instruction, as it could then support slotted children (behaving similar to the Beatles' example above).  Or maybe another tag should be introduced that is the equivalent of the slot, to avoid confusion. But I strongly suspect supporting intra document HTML imports could significantly reduce the payload size of some documents, if we can reuse blocks of HTML, inserting sections of customized content for each instance.

The [add src attribute to template to load a template from file](https://github.com/whatwg/html/issues/10571) and an interesting [declarative shadow imports proposal that is coming from](https://github.com/htmlcomponents/declarative-shadow-imports/blob/main/examples/02-explainer-proposal/02-html.html) the Edge team [seem quite compatible](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/ShadowDOM/explainer.md#proposal-inline-declarative-css-module-scripts) with this idea.  Also [declarative partial updates](https://github.com/WICG/declarative-partial-updates).  Here's to hoping something actually lands in the browser.

## Applying DRY to templates

Recall that with the previous examples, there was an implicit value of the rel attribute:

```html
<template src=#source-template rel=stream>
   <span slot=slot1>hello</span>
   <span slot=slot2>goodbye<span>
</template>
```

Now we provide another scenario where we want to specify a different kind of use of the src attribute adorning the template element -- simply as a way of saying "here is a template to be used within this context as templates are traditionally used (for cloning reusable HTML), but the actual contents for the template is defined remotely (intra document or via http).

My timing experiments indicate that it is faster to extract out all the needed template elements defined within a repeating template -- keep the contents that need repeated cloning lighter, and only clone fragments as needed from an external reference.

```html
<html>
   <head>
      <template id=directory>
         My Shared Content
      </template>
   </head>
   <body>
      <div itemscope>
         <template id=directoryConsumer rel=preload src=#directory></template>
      </div>
   </body>
   <script type=module>
      import {waitForEvent} from 'mount-observer/waitForEvent.js'
      async function getContent(){
         if(directoryConsumer.remoteContent) return directoryConsumer.remoteContents;
         await waitForEvent(directoryConsumer, 'load');
         return directoryConsumer.remoteContents;
      }
      await getContent(directoryConsumer)
   </script>
</html>
```

This can allow for elegant "lazy-loaded recursive" patterns:

```html
<html>
   <head>
      ...
      <template id=dirs-files>
        <ul itemscope=DirList itemprop=subDirs>
            <li per-each="DirInfo of DirList">
                <details>
                    <summary itemprop=name></summary>
                    <template 🎚️="on when ^{details}." 
                        rel=preload src=#dirs-files></template>
                </details>
            </li>
        </ul>
        <ul itemscope=DirList itemprop=files>
            <li per-each="FileInfo of DirList">
                File: <span itemprop=name></span>
                <button name=delete>Delete</button>
            </li>
        </ul>        
    </template>
    ...
   </head>
   <body>
      ...
      <button name=dirPick disabled>Pick directory</button>

      <details itemscope=DirInfo data-kind="directory" 
         when-resolved="@dirPick+📁⛏️ set $0?.ish?.handle to directoryHandle">
         <summary itemprop=name></summary>
         <template 🎚️="on when ^{details}." rel=preload src=#dirs-files></template>
      </details>
      ...
   </body>
</html>
```

## Lazy Loading / Conditionally loading intra document imports [WIP specification]

Just as it is useful to be able lazy load external imports when needed, it would also be useful to do the same for intra document HTML imports.  The most straightforward way this could be done seems to be as follows, either introducing some attribute like "type=conditional", or defining a new element that inherits from the HTMLTemplateElement, for example:

```html
<template id=source-template rel=conditional-stream>

   <template mount='{
      "select": ":not([defer-loading])",
      "loadingEagerness": "eager",
      "whereMediaMatches": "(min-width: 700px)",
      "whereLangIn": ["en-GB"],
   }'>
      <div>I don't know why you say <slot name=slot2></slot> I say <slot name=slot1></slot></div>
   </template>

   <template mount='{
      "select": ":not([defer-loading])",
      "loadingEagerness": "lazy",
      "whereMediaMatches": "(max-width: 700px)",
      "whereLangIn": ["fr"],
   }'>
      <div>Je ne sais pas pourquoi tu dis  <slot name=slot2></slot> je dis  <slot name=slot1></slot></div>
   </template>
   
</template>

...
<template src=#source-template>
   <span slot=slot1>hello</span>
   <span slot=slot2>goodbye<span>
</template>

<!-- or, alternatively: -->

<compose src=#source-template>
   <span slot=slot1>hello</span>
   <span slot=slot2>goodbye<span>
</compose>
```

## Creating an Element-To-RefID DOM traversal API

The platform provides some nice help with managing forms, including IDREF dependency support:

```html
<input id=field2 name=field2 form=myForm>

<form id=myForm>
   <input name="field1">
</form>
<script>
   console.log(myForm.elements);
   // includes both field1 and field2
   console.log(field2.form)
   // form#myForm
</script>
```

This would be useful for other linkages as well, which the platform doesn't support currently.

Again, because of the mount-observer being the "first point of contact" with the DOM, this is supported by mount-observer as well.

```html
<section id=section>
   <div id=myDiv itemscope itemref="myID1 myID2">
      <span itemprop=greeting></span>
   </div>
</section>
...
<div id=myId1>
   <span itemprop=greeting2>hello</span>
</div>
<div id=myId2>...</div>
<script>
   console.log(myDiv.via.itemref.children);
   // [div#myId1, div#myId2]
   myDiv.via.itemref.addEventListener('change', e => {
      console.log({e});
      //{addedChildren, removedChildren}
   });
   
</script>
```

```html
<span
  id=mySpan
  role="checkbox"
  aria-checked="false"
  tabindex="0"
  aria-labelledby="tac tac2"></span>
  ...
<span id="tac">I agree to the Terms and Conditions.</span>

<span id="tac2">I agree to the other Terms and Conditions.</span>
<script>
   console.log(mySpan.via.ariaLabelledby.children);
   //[span#tac, span#tac2]


   mySpan.via.ariaLabelledby.addEventListener('change', e => {
      console.log({e});
      //{addedChildren, removedChildren}
   });


</script>
```



```html
<table>
   <thead>
      ...
   </thead>
   <tbody id=myTbody>
      <tr id=myTR1 data-parent-name=group1>
         <td>hello</td>
      <tr id=myTR2 data-parent-name=group1>
         <td>goodbye</td>
      </tr>
      <tr id=myTR3 data-parent-name=group2>
         <td>good morrow</td>
      </tr>
   </tbody>
</table>
<script>

   console.log(myTR1.joinMatching.dataParentName.fromClosest.tbody);
   // [tr#myTR1, tr#myTR2]
   console.log(myTR1.joinMatching.dataParentName.fromParent);
   // [tr#myTR1, tr#myTR2]
   
</script>
```

One quirk to consider:

In the case of multiple elements being linked to a "mother ship" element forming a concept of "children" like we've seen before, the "mother ship" element is the one that points outward to the children.

The one exception (or are there others?) is the form element, where outside elements can say "hey, I want to be considered part of the form".

To keep the api uniform, we hide this discrepancy by pretending the form element is like the others [TODO]:

```html
<input id=field2 name=field2 form=myForm>

<form id=myForm>
   <input name="field1">
</form>
<script>
   console.log(myForm.via.form.children);
   // includes both field1 and field2
   
</script>
```
