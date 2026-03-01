[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">


## Implementation Status

The following features have been implemented and tested:

### Core Functionality
- ✅ **matching**: CSS selector-based element matching
- ✅ **whereInstanceOf**: Constructor-based element filtering (single or array)
- ✅ **Registry matching**: Automatic filtering by customElementRegistry (Chrome 146+)
- ✅ **withMediaMatching**: Media query-based conditional mounting (string or MediaQueryList)
- ✅ **whereObservedRootSizeMatches**: Container query-based conditional mounting (observes root element size)
- ✅ **whereElementIntersectsWith**: Intersection observer-based conditional mounting (observes element visibility)
- ✅ **whereConnectionHas**: Network connection-based conditional mounting (observes connection speed/type)
- ✅ **withScopePerimeter**: Donut hole scoping (exclude elements inside matching ancestors)

### Lifecycle & Events
- ✅ **mount/dismount/disconnect events**: Element lifecycle tracking
- ✅ **mediamatch/mediaunmatch events**: Media query state change notifications (with `getPlayByPlay` option)
- ✅ **load event**: Import completion notification

### Advanced Features
- ✅ **Dynamic imports**: Lazy loading of JavaScript modules
- ✅ **assignOnMount**: Property assignment when elements mount
- ✅ **assignOnDismount**: Property assignment when elements dismount
- ✅ **stageOnMount**: Reversible property assignment (auto-restores on dismount)
- ✅ **do callbacks**: Mount/dismount/disconnect/reconnect lifecycle hooks
- ✅ **Element mount extension**: element.mount() method for scoped registry observation
- ✅ **Shared MutationObserver**: Efficient observer sharing across instances
- ✅ **Code splitting**: Conditional features loaded on-demand
- ✅ **Memory management**: WeakRef usage for DOM node references

### Not Yet Implemented
- ❌ Reconnect event handling

# The MountObserver API

Author: Bruce B. Anderson (with valuable feedback from @doeixd)

Issues / PRs / polyfill: [mount-observer](https://github.com/bahrus/mount-observer/tree/v2)

Last Update: Feb 23, 2026

## Benefits of this API

What follows is a far more ambitious alternative to the [lazy custom element proposal](https://github.com/w3c/webcomponents/issues/782). The goals of the MountObserver API are more encompassing and less focused on registering custom elements. In fact, this proposal addresses numerous use cases in one API. It basically maps common filtering conditions in the DOM to mounting a "campaign" of some sort, like importing a resource, and/or progressively enhancing an element, and/or "binding from a distance".

["Binding from a distance"](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) refers to empowering the developer to essentially manage their own "stylesheets" -- but rather than for purposes of styling, using these rules to attach behaviors, set property values, etc, to the HTML as it streams in.  Libraries that take this approach include [Corset](https://corset.dev/) and [trans-render](https://github.com/bahrus/trans-render), [selector-observer](https://github.com/josh/selector-observer), [pure](http://web.archive.org/web/20160313152905/https://beebole.com/pure/), [weld](https://github.com/tmpvar/weld), [bess](https://github.com/bkardell/bess).  The concept has been promoted by a [number](https://bkardell.com/blog/CSSLike.html) [of](https://www.w3.org/TR/NOTE-AS)  [prominent](https://www.xanthir.com/blog/b4K_0) voices in the community. 

The underlying theme is that this API is meant to make it easy for developers to do the right thing by encouraging lazy loading and smaller footprints. It rolls up most of the other observer APIs into one, including, potentially, [a selector observer](https://github.com/whatwg/dom/issues/1285), which may be a similar duplicate to [the match-media counterpart proposal](https://github.com/whatwg/dom/issues/1225).

### Finite Element Analysis

Most every web application can be recursively broken down into logical regions, building blocks which are assembled together to form the whole site.

At the most micro level, utilizing highly reusable, generic custom elements -- elements that can extend the HTML vocabulary, elements that could be incorporated into the browser, even -- form a great foundation to build on.

But as one zooms out from the micro to the macro, the nature of the components changes in significant ways.

At the micro level, components will have few, if any, dependencies, and those dependencies will tend to be quite stable, and likely all be used. The dependencies will skew more towards tightly coupled utility libraries.

"Macro" level components will tend to be heavy on business-domain specific data, heavy on gluing / orchestrating smaller components, light on difficult, esoteric JavaScript. They aren't confined to static JS files, and likely will include dynamic content as well. They will also be heavy on conditional sections of the application only loading if requested by the user.

ES module based web components may or may not be the best fit for these application macro "modules". A better fit might be a server-centric solution, like Rails, just to take an example.

A significant pain point has to do with downloading all the third-party web components and/or (progressive) enhancements that these macro components / compositions require, and loading them into memory only when needed.


### Does this API make the impossible possible?

There is quite a bit of functionality this proposal would open up that is exceedingly difficult to polyfill reliably:  

1. It is unclear how to use mutation observers to observe changes to [custom state](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet). The closest thing might be a solution like [this](https://davidwalsh.name/detect-node-insertion), but that falls short for elements that aren't visible or during template instantiation, and requires carefully constructed "negating" queries if needing to know when the CSS selector is no longer matching.

2. For simple CSS matches, like "my-element" or "[name='hello']", it is enough to use a mutation observer and only observe the elements within the specified DOM region (more on that below). But as CSS has evolved, it is quite easy to think of numerous CSS selectors that would require us to expand our mutation observer to scan the entire Shadow DOM realm, or the entire DOM tree outside any Shadow DOM, for any and all mutations (including attribute changes), and re-evaluate every single element within the specified DOM region for new matches or old matches that no longer match. Things like child selectors, :has, and so on. All this is done miraculously by the browser in a performant way. Reproducing this in userland using JavaScript alone while matching the same performance seems impossible.  

3. Knowing when an element previously being monitored passes totally "out-of-scope" so that no more hard references to the element remain. This would allow for cleanup of no longer needed weak references without requiring polling.

4. Some CSS selectors, such as the [donut hole scope range](https://css-tricks.com/solved-by-css-donuts-scopes/#aa-donut-scoping-with-scope), aren't supported by oEl.querySelectorAll(...) or oEl.matches(...).

5. Scoped custom element registries form natural "islands" of DOM that has many commonalities with css "donut hole scoping", and which mutation observers aren't really designed around.  The mount-observer is designed to work with scoped custom element registries as first-class citizens. 


###  Most significant use cases

The amount of code necessary to accomplish these common tasks designed to improve the user experience is significant. Building it into the platform would potentially:

1. Give developers a strong signal to do the right thing by:
    1. Making lazy loading of resource dependencies easy, to the benefit of users with expensive networks.
    2. Supporting "binding from a distance" that can set property values of elements in bulk as the HTML streams in. For example, say a web page is streaming in HTML with thousands of input elements (say a long tax form). We want to have some indication in the head tag of the HTML (for example) to make all the input elements read-only as they stream through the page. With CSS, we could do similar things, for example set the background to red of all input elements. Why can't we do something similar with setting properties like readOnly, disabled, etc? With this API, giving developers the "keys" to CSS filtering so they can "mount a campaign" to apply common settings on them all feels like something that almost every web developer has mentally screamed to themselves "why can't I do that?", doesn't it?
    3. Supporting "progressive enhancement" more effectively.
2. Potentially allow the platform to do more work in low-level (C/C++/Rust?) code without as much context switching into the JavaScript memory space, which may reduce CPU cycles as well. This is done by passing a substantial number of conditions into the API, which can all be evaluated at a lower level before the API needs to surface up to the developer "found one!".
3. As discussed earlier, to do the job right, polyfills really need to reexamine **all** the elements within the observed node for matches **anytime any element within the Shadow Root so much as sneezes (has an attribute modified, changes custom state, etc)**, due to modern selectors such as the :has selector. Surely the platform has found ways to do this more efficiently?  

The extra flexibility this new primitive would provide could be quite useful to things other than lazy loading of custom elements, such as implementing [custom enhancements](https://github.com/WICG/webcomponents/issues/1000) as well as [binding from a distance](https://github.com/WICG/webcomponents/issues/1035#issuecomment-1806393525) in userland.

## Quick Examples of the Most Common Use Cases

Before getting into the weeds, let's demonstrate the two most prominent use cases:

### Use Case 1:  Custom Attribute Enhancement

```html
<body>
    <div log-to-console="clicked on a div">hello</div>

    <script type=module>
        document.body.mount({
            matching: '[log-to-console]',
            do: (el) => {
                el.addEventListener('click', e => {
                  console.log(e.target.getAttribute('log-to-console'));
                });
            }
        })
    </script>
</body>
```



### Use Case 2: Lazy Global Custom Element Definition

To specify the equivalent of what the [alternative proposal linked to above would do](https://github.com/WICG/webcomponents/issues/782), we can do the following:

```JavaScript
// MyElement.js
export default class MyElement extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Hello!';
    }
}

// main.js
import 'mount-observer/ElementMountExtension.js';

document.mount({
    matching: 'my-element',
    import: './MyElement.js',
    do: 'builtIns.defineCustomElement'
});

// HTML - elements will be upgraded when discovered
// by the mount observer
<my-element></my-element>

```

This registers custom elements with the global customElements registry.

See [this extending package](https://github.com/bahrus/mount-observer-script-element) that provides for a more declarative approach.

### Scoped

To register the class in the same custom element registry as the element which calls the "mount" method (element in this case), use "builtIns.defineScopedCustomElement":

```JavaScript
element.mount({
    matching: 'my-element',
    import: './MyElement.js',
    do: 'builtIns.defineScopedCustomElement'
});
```

## Enhancing Elements with assign-gingerly

The `builtIns.enhanceMountedElement` handler automatically enhances mounted elements using the [assign-gingerly](https://www.npmjs.com/package/assign-gingerly) enhancement system. This allows us to attach behavior and state to elements without subclassing.

```JavaScript
// MyEnhancement.js
class ButtonEnhancement {
    constructor(element, ctx, initVals) {
        this.element = new WeakRef(element);
        this.ctx = ctx;
        this.clickCount = 0;
        
        element.addEventListener('click', ({target}) => {
            this.clickCount++;
            target.setAttribute('data-clicks', this.clickCount);
        });
    }
}

export default {
    spawn: ButtonEnhancement,
    enhKey: 'buttonEnh'
};

document.mount({
    matching: '.enhance-me',
    import: './MyEnhancement.js',
    do: 'builtIns.enhanceMountedElement'
});

// HTML
<button class="enhance-me">Click me</button>

// Access the enhancement
const button = document.querySelector('.enhance-me');
console.log(button.enh.buttonEnh.clickCount); // 0
button.click();
console.log(button.enh.buttonEnh.clickCount); // 1
```

The handler:
1. Searches the imported module for an export with a `spawn` property (the enhancement class)
2. Calls `element.enh.get(registryItem, context)` to spawn the enhancement
3. Stores the enhancement instance on `element.enh[enhKey]` if an `enhKey` is provided

This works with browsers that don't support scoped custom element registries by polyfilling the `customElementRegistry` property on elements.


# Thorough Exposition Begins Here

Okay, let's get into the weeds.  First, we strongly recommend studying the core package that mount-observer extends, [assign-gingerly](https://www.npmjs.com/package/assign-gingerly).

## First use case -- lazy loading custom elements without sugar coating

This registers the custom element in the global registry.

```JavaScript
const observer = new MountObserver({
   select:'my-element', //not supported by this polyfill
   import: './my-element.js',
   do: ({localName}, {modules, observer, MountConfig, rootNode}) => {
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

In fact, I have encountered statements made by the browser vendors that some queries supported by css can't be evaluated simply by looking at the layout of the HTML, but have to be made after rendering and performing style calculations.  This necessitates having to delay the notification, which would be unacceptable in some circumstances.

If the developer has a simple query in mind that needs no such nuance, I'm thinking it might be helpful to provide an alternative key to "select" that is used specifically for (a subset?) of queries supported by the existing "matches" method that elements support, maybe even after the browser vendors provide a selector-observer (if ever).

So the developer could use:

## Polyfill Supported Mount Observer

```JavaScript
const observer = new MountObserver({
   //supported by this polyfill
   matching:'my-element',
   import: './my-element.js',
   do: ({localName}, {modules, observer, MountConfig, rootNode}) => {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
   
}, {disconnectedSignal: new AbortController().signal});
observer.observe(document);
```

and could perhaps expect faster binding as a result of the more limited supported expressions.  Since "select" is not specified, it is assumed to be "*".

This polyfill in fact only supports this latter option ("matching"), and leaves "select" for such a time as when a selector observer is available in the platform.

[Implemented as Requirement 1](requirements/Done/Requirement1.md).

## The observe() method

The `observe()` method begins observation of elements within the provided node:

```typescript
async observe(observedNode: Node): Promise<void>
```

**Parameter: `observedNode`**

The `observedNode` parameter is the node where observation takes place. In order to support the polyfill, a mutation observer is registered on this node to detect when matching elements are added or removed. All matching elements within this node and its descendants will trigger mount callbacks, as long as it belongs to the same scoped custom element registry as the observed node.

**Common usage:**
```javascript
const observer = new MountObserver({
    matching: '.my-element',
    do: (el) => console.log('Mounted:', el)
});

// Observe the entire document
await observer.observe(document);

// Or observe a specific subtree
const container = document.querySelector('#container');
await observer.observe(container);

// Or observe within a shadow DOM
const shadowRoot = element.shadowRoot;
await observer.observe(shadowRoot);
```

**Note:** An observer can only observe one node at a time. Calling `observe()` again will throw an error. Call `disconnect()` first to observe a different node.

**Relationship with element.mount():**

When using the `element.mount()` convenience method, it internally determines which node to pass to `observe()` based on the `scope` option:
- `'self'` - Observes the element itself
- `'registryRoot'` - Finds and observes the element's registry root
- `'registry'` - [WIP] Finds and observers all DOM nodes that have the same custom element registry
- `'shadow'` - Observes the element's shadow root
- `'root'` - Observes the element's root node (via `getRootNode()`)

##  The import key

This proposal has been amended to support multiple imports, including of different types:

```JavaScript
const observer = new MountObserver({
   matching:'my-element',
   import: [
      ['./my-element-small.css', {type: 'css'}],
      './my-element.js',
   ],
   do: ({localName}, {modules, observer, MountConfig, rootNode}) => {
      ...
   }
});
observer.observe(document);
```

Once again, the key can accept either a single import, but alternatively it can also support multiple imports (via an array).

The do function won't be invoked until all the imports have been successfully completed and inserted into the modules array.

Previously, this proposal called for allowing arrow functions as well, thinking that could be a good interim way to support bundlers, as well as multiple imports.  But the valuable input provided by [doeixd](https://github.com/doeixd) makes me think that that interim support could more effectively be done by the developer in the do methods.

This proposal would also include support for JSON and HTML module imports (really, all types).

[Implemented as Requirement 1](requirements/Done/Requirement1.md).

## Preemptive downloading

There are two significant steps to imports, each of which imposes a cost:  

1.  Downloading the resource.
2.  Loading the resource into memory.

What if we want to *download* the resource ahead of time, but only load into memory when needed?

The link rel=modulepreload option (and maybe the new defer tc39 proposal) provides an already existing platform support for this, but the browser complains when no use of the resource is used within a short time span of page load.  That doesn't really fit the bill for lazy loading custom elements and other resources.

So for this we add loadingEagerness:

```JavaScript
const observer = new MountObserver({
   select: 'my-element', //not supported by this polyfill
   loadingEagerness: 'eager', //partially supported by this polyfill
   import: './my-element.js',
   do: ({localName}, {modules}) => customElements.define(localName, modules[0].MyElement),
});
```

So what this does is only check for the presence of an element with tag name "my-element", and it starts downloading the resource, even before the element has "mounted" based on other criteria.

The polyfill just loads the module into memory right away.

> [!NOTE]
> As a result of the google IO 2024 talks, I became aware that there is some similarity between this proposal and the [speculation rules api](https://developer.chrome.com/blog/speculation-rules-improvements).  This motivated the change to the property from "loading" to loadingEagerness above.

## Importing Configuration with configFrom

The `configFrom` property provides a clean way to import MountConfig settings from external modules, enabling better code organization and reusability.

**Key benefit for JSON serialization**: One of the most important advantages of `configFrom` is that it allows us to separate non-JSON-serializable settings (like functions and class constructors) from JSON-serializable settings. This makes it possible to keep our inline MountConfig 100% JSON-serializable while still leveraging the full power of JavaScript in our imported configuration modules when needed.

```JavaScript
// Inline config - 100% JSON serializable
const observer = new MountObserver({
   matching: '.my-element',
   configFrom: './my-handlers.js'  // Non-serializable code lives here
});

// my-handlers.js - Contains functions and class references
export const mountConfig = {
   whereInstanceOf: HTMLButtonElement,  // Class constructor
   do: (element, context) => {          // Function
      element.addEventListener('click', () => console.log('clicked'));
   }
};
```

This separation is crucial for scenarios like Mount Observer Script Elements (MOSEs) where configuration needs to be embedded in HTML as JSON, but we still want to leverage imperative JavaScript code.

### Basic Usage

Create a configuration module that exports a `mountConfig` constant:

```JavaScript
// my-config.js
export const mountConfig = {
   matching: '.my-element',
   do: (element, context) => {
      element.textContent = 'Configured!';
   }
};
```

Then reference it in your observer:

```JavaScript
const observer = new MountObserver({
   configFrom: './my-config.js'
});
observer.observe(document);
```

### Multiple Configuration Modules

You can import multiple config modules. Later configs override earlier ones (left-to-right merge):

```JavaScript
const observer = new MountObserver({
   configFrom: ['./base-config.js', './override-config.js']
});
```

### Inline Config Takes Precedence

Inline configuration always overrides imported configuration:

```JavaScript
const observer = new MountObserver({
   configFrom: './base-config.js',
   matching: '.custom-selector'  // Overrides matching from base-config.js
});
```

### Merge Semantics

- **Shallow merge**: Uses `Object.assign()` for merging
- **Merge order**: First configFrom module → second configFrom module → ... → inline config
- **Arrays are replaced**: If multiple configs define the same array property, the later array completely replaces the earlier one
- **Inline wins**: Inline configuration always takes final precedence

### Supported Properties

Config modules can export any valid MountConfig property, including:
- `matching`, `whereInstanceOf`, `withMediaMatching`
- `whereObservedRootSizeMatches`, `whereElementIntersectsWith`
- `whereConnectionHas`, `withScopePerimeter`
- `import`, `do`, `loadingEagerness`
- `assignOnMount`, `assignOnDismount`, `stageOnMount`
- `mountedElemEmits`, `customData`, `getPlayByPlay`

### Functions and Class References

Config modules can include non-JSON-serializable values like functions and class constructors:

```JavaScript
// button-config.js
export const mountConfig = {
   matching: 'button',
   whereInstanceOf: HTMLButtonElement,
   do: (element, context) => {
      element.addEventListener('click', () => {
         console.log('Button clicked!');
      });
   }
};
```

### Error Handling

**Missing mountConfig export:**
```JavaScript
// This will throw an error
const observer = new MountObserver({
   configFrom: './module-without-mountConfig.js'
});
// Error: Module './module-without-mountConfig.js' does not export 'mountConfig'
```

**Duplicate modules:**
```JavaScript
// This will throw an error
const observer = new MountObserver({
   configFrom: ['./config.js', './config.js']
});
// Error: Duplicate configFrom module: './config.js'
```

### Circular Dependency Warning

Be careful to avoid circular dependencies when using `configFrom`. Config modules should only export configuration and avoid importing modules that create MountObserver instances.

**Safe pattern:**
```JavaScript
// config.js - Only exports configuration
export const mountConfig = {
   matching: '.element',
   do: (el) => { /* ... */ }
};
```

**Avoid:**
```JavaScript
// config.js - Creates circular dependency
import { MountObserver } from 'mount-observer';
// This could cause issues if the importing module also imports MountObserver
```

## Media / container queries / instanceOf / custom checks [TODO] out of date

Unlike traditional CSS @import, CSS Modules don't support specifying different imports based on media queries.  That can be another condition we can attach (and why not throw in container queries, based on the rootNode?):

```JavaScript
const observer = new MountObserver({
   select: 'div > p + p ~ span[class$="name"]', // not supported by polyfill
   withMediaMatching: '(max-width: 1250px)',
   whereObservedRootSizeMatches: '(min-width: 700px)',
   whereElementIntersectsWith:{
      rootMargin: "0px",
      threshold: 1.0,
   },
   whereInstanceOf: [HTMLMarqueeElement], //or 'HTMLMarqueeElement'
   whereLangIn: ['en-GB'], // Cannot be implemented - see https://github.com/whatwg/html/issues/7039
   whereConnectionHas:{
      effectiveTypeIn: ["slow-2g"],
   },
   import: ['./my-element-small.css', {type: 'css'}],
   do: function(mountedElement, ctx){
      console.log({mountedElement, ctx});
   }
});
```

[whereInstanceOf implemented as [Requirement5](requirements/Done/Requirement5.md)]
[whereObservedRootSizeMatches implemented]
[whereElementIntersectsWith implemented]
[whereConnectionHas implemented]

[withMediaMatching implemented as [Requirement6](requirements/Done/Requirement6.md)]

## InstanceOf checks in detail

Carving out the special "whereInstanceOf" check is provided based on the assumption that there's a performance benefit from doing so. If not, the developer could just add that check inside the "confirm" callback logic (discussed later).  For built-in elements, we can alternatively provide the string name, as indicated in the comment above, which certainly makes it JSON serializable, thus making it easy as pie to include in the MOSE JSON payload.  I don't think there would be any ambiguity in doing so, which means I believe that answers the mystery in my mind whether it could be part of the low-level checklist that could be done within the c++/rust code / thread.

The picture becomes murkier for custom elements.  The best solution in that case seems to be to utilize customElements.getName(...) as a basis for the match, but at first glance, that could  preclude being able to use base classes which a family of custom elements subclass, if that superclass isn't itself a custom element.  I suppose the solution to this conundrum, when warranted, is simply to burden the developer with defining a custom element for the superclass, and thus assigning it a name, applicable within ShadowDOM scopes as needed, even though it isn't actually necessarily used for any live custom elements. This would require already having imported the base class, only benefitting from lazy loading the code needed for each sub class, which might not always be all that high as a percentage, compared to the base class.

However, where this support for "whereInstanceOf" would be *most* helpful is when it comes to [*custom enhancements*](https://github.com/WICG/webcomponents/issues/1000) that only wish to lazily layer some heavy lifting functionality on top of certain families of already loaded and upgraded custom elements (possibly in addition to some (specified) built in elements).  Here, the lazy loading of the *entire custom **enhancement***, based on the presence in the DOM of a member of the family of custom elements, would, if my calculations are correct, result in providing a significant benefit. 
 

<!--

[TODO] Maybe should also (optionally?) pass back which checks failed and which succeeded on dismount.  Not sure I really see a use case for it, but leaving the thought here for now 

-->

## Custom Element Registry Matching

MountObserver automatically respects scoped custom element registry boundaries. When observing a root node, only elements that share the same `customElementRegistry` as the root node will be mounted. This is an implicit AND condition that applies to all observations.

**How it works:**

```javascript
// Observe document - only mounts elements in the global registry
const observer1 = new MountObserver({
    matching: '.my-element',
    do: (el) => { /* ... */ }
});
observer1.observe(document);

// Observe shadow root - only mounts elements in that shadow root's registry
const shadowRoot = host.attachShadow({ mode: 'open' });
const observer2 = new MountObserver({
    matching: '.my-element',
    do: (el) => { /* ... */ }
});
observer2.observe(shadowRoot);
```

**Behavior across browser versions:**
- **Pre-Chrome 146**: Both `customElementRegistry` properties are `undefined`, so all elements within the observed scope match (backward compatible)
- **Chrome 146+ with scoped registries**: Elements are filtered by registry reference equality
  - Elements in the same registry scope as the root node → mount ✓
  - Elements in different registry scopes → don't mount ✓

This ensures that when we observe a shadow root with a scoped registry, we won't accidentally mount elements from the parent document or other shadow roots with different registries. The registry check happens automatically before any other `where*` conditions are evaluated.

[Implemented as [ExcludeMatchingElementsWhereCustomElementRegistriesDon'tMatch](requirements/ExcludeMatchingElementsWhereCustomElementRegistriesDon'tMatch.md)]

## Element Mount Extension

For even more convenience, we can use the `element.mount()` method to observe elements within their scoped custom element registry context. This is particularly useful with scoped custom element registries (Chrome 146+, latest WebKit/Safari).

```JavaScript
import 'mount-observer/ElementMountExtension.js';

// Mount with MountConfig
await document.body.mount({
    matching: 'button',
    do: (element) => {
        element.classList.add('enhanced');
    }
});
```

The `mount()` method:
- Automatically finds the highest scoped container with the same `customElementRegistry` as the element (default behavior)
- Creates a `MountObserver` with the provided config
- Observes the determined scope
- Returns the element for chaining (as a Promise)

Scope options (via `options.scope`):
- `'registry'` (default): Observes the root registry container (highest element with same customElementRegistry)
- `'self'`: Observes only this element
- `'root'`: Observes the root node (document or shadow root)
- `'shadow'`: Observes the element's shadowRoot (throws error if none exists)
- `Element`: Observes a custom element we specify

This is especially useful for web components that want to observe their own shadow DOM or scoped registry:

```JavaScript
class MyComponent extends HTMLElement {
    async connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open', registry: new CustomElementRegistry() });
        shadow.innerHTML = `<button data-action="click">Click me</button>`;
        
        // Default: Observe within this component's scoped registry
        await shadow.mount([{
            spawn: ButtonHandler,
            enhKey: 'handler',
            withAttrs: { action: 'data-action' }
        }]);
        
        // Or observe just the shadow root itself
        await this.mount([{
            spawn: ShadowHandler,
            enhKey: 'shadow'
        }], { scope: 'shadow' });
        
        // Or observe the entire document
        await this.mount({
            matching: '.global-button',
            do: (el) => console.log('Global button found')
        }, { scope: 'root' });
    }
}
```

Browser support: Works in all browsers, but scoped registry features require Chrome 146+ or latest WebKit/Safari.

[Implemented as CustomElementRegistryMounting requirement](requirements/Done/CustomElementRegistryMounting.md).
 








## Mount Observer Script Elements (MOSEs)

Following an approach similar to the [speculation api](https://developer.chrome.com/blog/speculation-rules-improvements), we can add a script element anywhere in the DOM:

```JavaScript
// myPackage/myDefiner.js
// My all powerful custom element definer
export const mountConfig = {
   do: function({localName}, {modules, observer}) {
      if(!customElements.get(localName)) {
         customElements.define(localName, modules[1].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
};
```

```html
<script type="mountobserver" >
{
   "select":"my-element",
   "import": [
      ["./my-element-small.css", {"type": "css"}],
      "./my-element.js"
   ],
   "configFrom": "myPackage/myDefiner.js"
}
</script>
```

To keep this proposal / polyfill of reasonable size, mount observer script elements has its own [repo / sub-proposal](https://github.com/bahrus/mount-observer-script-element).  There's much more to it, including support for inheritance across containing scoped custom element registries.

But I think it's important to think about this way of making the mount observer declarative, as it provides one significant reason why we place so much emphasis on making sure that the mount observer settings (MountConfig) is as JSON serializable as possible.


## Binding from a distance

It is important to note that "matching" (and especially the non polyfillable "select") is a css query with no restrictions.  So something like:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'goodbye';
   }
}

const observer = new MountObserver({
   // not supported by polyfill
   //select: 'div > p + p ~ span[class$="name"]' 
   // is supported by polyfill, and even after select is also supported:
   matching: 'div > p + p ~ span[class$="name"]',
   do: (mountedElement, ctx) => {
      new MyHandler(mountedElement, ctx);
   },
});
observer.observe(document);
```


... would work.

EvtRt is a convenience class provided with the polyfill package, and is considered part of this proposal (see how it is used below  by built in handlers).

This allows developers to create "stylesheet" like capabilities.

## Registering reusable handlers with MountObserver.define

To make MountConfig configurations more JSON-serializable and encourage code reuse, we can register handler classes with string names and reference them by name:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
}

// Register the handler with a string name
MountObserver.define('myHandler', MyHandler);

// Reference it by name in the configuration
const observer = new MountObserver({
   matching: 'div > p + p ~ span[class$="name"]',
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
   matching: 'input',
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

[Implemented as [Requirement14](requirements/Done/Requirement14.md)]

### Handler defaults with static properties

Registered handler classes can specify default MountConfig properties using static class properties. When we reference a handler by name, its static properties are automatically merged with your inline configuration, with inline config always taking precedence:

```JavaScript
import {EvtRt} from 'mount-observer/EvtRt.js';

class MyHandler extends EvtRt {
   static matching = 'div > p + p ~ span[class$="name"]';
   static whereInstanceOf = HTMLSpanElement;
   
   mount(mountedElement, MountConfig, context){
      mountedElement.textContent = 'hello';
   }
   dismount(mountedElement, MountConfig){
      mountedElement.textContent = 'bye';
   }
}

// Register the handler
MountObserver.define('myHandler', MyHandler);

// Use with defaults - will use handler's matching and whereInstanceOf
const observer1 = new MountObserver({
   do: 'myHandler'
});
observer1.observe(document);

// Override specific properties - inline config trumps handler defaults
const observer2 = new MountObserver({
   matching: 'span.special',  // This overrides the handler's matching
   do: 'myHandler'            // Still uses handler's whereInstanceOf
});
observer2.observe(document);
```

**How it works:**
1. When `do` is a string reference to a registered handler, the handler's static properties are extracted
2. Static properties are merged with the inline config using object spread
3. Inline config properties always override handler defaults (inline trumps)
4. All MountConfig properties can be specified as static properties (matching, whereInstanceOf, withMediaMatching, etc.)

**Benefits:**
- **DRY principle**: Define common configuration once in the handler class
- **Flexibility**: Override any property when needed for specific use cases
- **Composability**: Handlers become self-contained with their own default behavior
- **JSON serialization**: Configurations remain JSON-serializable since only the handler name is referenced

**Example with multiple properties:**

```JavaScript
class InputHandler extends EvtRt {
   static matching = 'input[type="text"]';
   static whereInstanceOf = HTMLInputElement;
   static withMediaMatching = '(min-width: 768px)';
   
   mount(mountedElement, MountConfig, context){
      mountedElement.placeholder = 'Enter text...';
   }
}

MountObserver.define('inputHandler', InputHandler);

// Uses all handler defaults
const observer = new MountObserver({
   do: 'inputHandler'
});

// Partially override - keeps whereInstanceOf and withMediaMatching from handler
const observer2 = new MountObserver({
   matching: 'input[type="email"]',  // Override matching only
   do: 'inputHandler'
});
```

[Implemented as [SupportWhereCriteriaWithRegisteredActions](requirements/SupportWhereCriteriaWithRegisteredActions.md)]

### Built in handlers

This proposal advocates having the platform provide some built in handlers, that extend EvtRt, that is included with this Polyfill.

#### Log to console handler

```JavaScript
const observer = new MountObserver({
   // not supported by polyfill
   //select: 'div > p + p ~ span[class$="name"]' 
   // is supported:
   matching: 'div > p + p ~ span[class$="name"]',
   do: 'builtIns.logToConsole'
});
observer.observe(document);
```

This logs to console all the events (mount, dismount, disconnect)

### Lazy custom element handler

```JavaScript
// MyElement.js
export default class MyElement extends HTMLElement {
    connectedCallback() {
        this.textContent = 'Hello!';
    }
}

// main.js
import { MountObserver } from 'mount-observer';

const observer = new MountObserver({
    matching: 'my-element',
    import: './MyElement.js',
    do: 'builtIns.defineCustomElement'
});
observer.observe(document);

// HTML - elements will be upgraded when discovered
// by the mount observer
<my-element></my-element>

```

## Applying properties on mount and dismount

For the common use case of setting properties on matching elements, MountObserver provides built-in support for the [assignGingerly](https://github.com/bahrus/assign-gingerly) library. This allows us to declaratively specify properties to apply to elements during their lifecycle without writing custom mount callbacks:

```JavaScript
const observer = new MountObserver({
   matching: 'input',
   assignOnMount: {
      disabled: true,
      value: 'Default value',
      title: 'This is a tooltip'
   }
});
observer.observe(document);
```

This will automatically apply the specified properties to all matching input elements, both existing ones and those added dynamically.

[Implemented as [Requirement2](requirements/Done/Requirement2.md) and [Requirement16](requirements/Done/Requirement16.md)]

### Assigning properties on dismount

You can also specify properties to apply when elements are removed from the DOM using `assignOnDismount`:

```JavaScript
const observer = new MountObserver({
   matching: '.status-indicator',
   assignOnMount: {
      '?.style?.color': 'green',
      '?.dataset?.status': 'active'
   },
   assignOnDismount: {
      '?.style?.color': 'red',
      '?.dataset?.status': 'inactive'
   }
});
observer.observe(document);
```

This is useful for cleanup operations, visual feedback, or maintaining state on elements that may be temporarily removed from the DOM but still referenced elsewhere in your code.

**Note:** The `assignOnDismount` properties are applied before the element is removed from the mounted elements tracking, so the element still has access to its DOM context.

#### Practical use case: Form validation feedback

A common use case is providing visual feedback for form validation:

```JavaScript
const observer = new MountObserver({
   matching: 'input.validated',
   assignOnMount: {
      '?.style?.borderColor': 'green',
      '?.style?.backgroundColor': '#f0fff0',
      '?.setAttribute': ['aria-invalid', 'false']
   },
   assignOnDismount: {
      '?.style?.borderColor': '',
      '?.style?.backgroundColor': '',
      '?.removeAttribute': 'aria-invalid'
   }
});
observer.observe(document);
```

When an input gains the `validated` class, it gets green styling. When the class is removed (dismount), the styling is cleaned up.

#### Remounting behavior

If an element is removed and then re-added to the DOM, the `assignOnMount` properties will be reapplied:

```JavaScript
const input = document.querySelector('input');
input.classList.add('validated');  // assignOnMount applied
input.classList.remove('validated'); // assignOnDismount applied
input.classList.add('validated');  // assignOnMount applied again
```

This ensures consistent behavior across the element's lifecycle.

### Nested properties with dataset

The `assignGingerly` library supports nested property assignment using the `?.` notation. This is particularly useful for setting data attributes and style:

```JavaScript
const observer = new MountObserver({
   matching: 'button',
   assignOnMount: {
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

You can combine `assignOn*` with lazy loading to both import resources and set properties:

```JavaScript
const observer = new MountObserver({
   matching: 'my-element',
   import: './my-element.js',
   assignOnMount: {
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

Using `assignOn*` provides several benefits:

1. **Lazy loading**: The assign-gingerly library is only loaded when needed (when the `assignGingerly` property is specified)
2. **Bulk operations**: Properties are applied efficiently to all matching elements
3. **Declarative**: No need to write custom mount callbacks for simple property assignments
4. **Consistent**: The same property values are applied uniformly across all matching elements

### Dynamically updating assignGingerly configuration

The `MountObserver` class provides a public `assignGingerly()` method that allows us to merge new updates into the  observer. This is useful for responding to user actions or application state changes:

```JavaScript
const observer = new MountObserver({
   matching: 'input',
   assignOnMount: {
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

4. **Starting without initial config**: We can call the method even if no `assignGingerly` was specified in the constructor:

```JavaScript
const observer = new MountObserver({
   matching: 'input'
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

[Implemented as [Requirement9](requirements/Done/Requirement9.md)]

## Reversible property assignment with stageOnMount

While `assignOnMount` and `assignOnDismount` provide permanent property assignments, sometimes we need temporary changes that automatically reverse when elements dismount. The `stageOnMount` property provides this capability using the `assignTentatively` function from assign-gingerly:

```JavaScript
const observer = new MountObserver({
   matching: 'button.async-action',
   stageOnMount: {
      disabled: true,
      title: 'Processing...',
      '?.dataset?.loading': 'true'
   }
});
observer.observe(document);
```

When a matching button mounts, these properties are applied. When it dismounts (e.g., loses the `async-action` class), the original values are automatically restored.

### How it works

`stageOnMount` uses `assignTentatively` under the hood, which:

1. **Captures original values** before making changes
2. **Applies the new properties** when elements mount
3. **Automatically reverses** to original values when elements dismount

This is different from `assignOnMount`/`assignOnDismount`, where we must explicitly specify both the mount and dismount values.

### When to use stageOnMount vs assignOnMount

**Use `stageOnMount` when:**
- You want temporary state changes that should automatically reverse
- The original values matter and should be restored
- You're toggling states (disabled/enabled, hidden/visible)
- Setting temporary ARIA states or loading indicators

**Use `assignOnMount`/`assignOnDismount` when:**
- You need different values on mount vs dismount (not just reversal)
- You want permanent enhancements that shouldn't be reversed
- You need explicit control over both mount and dismount behavior
- The dismount value is not simply "restore original"

### Comparison example

```JavaScript
// With assignOnMount/assignOnDismount - explicit control
const observer1 = new MountObserver({
   matching: 'input.validated',
   assignOnMount: {
      '?.style?.borderColor': 'green'
   },
   assignOnDismount: {
      '?.style?.borderColor': 'red'  // Different value, not restoration
   }
});

// With stageOnMount - automatic reversal
const observer2 = new MountObserver({
   matching: 'button.loading',
   stageOnMount: {
      disabled: true,  // Automatically restores original disabled state on dismount
      '?.dataset?.loading': 'true'  // Automatically removes on dismount
   }
});
```

### Combining with assignOnMount

You can use both `assignOnMount` and `stageOnMount` together. The order of operations is:

1. **On mount**: `assignOnMount` applied first, then `stageOnMount`
2. **On dismount**: `stageOnMount` reversed first, then `assignOnDismount` applied

```JavaScript
const observer = new MountObserver({
   matching: 'form',
   assignOnMount: {
      noValidate: true  // Permanent enhancement
   },
   stageOnMount: {
      '?.dataset?.submitting': 'true'  // Temporary state
   }
});
```

### Nested properties

Like `assignOnMount`, `stageOnMount` supports nested property paths:

```JavaScript
const observer = new MountObserver({
   matching: '.modal',
   stageOnMount: {
      '?.style?.display': 'block',
      '?.style?.opacity': '1',
      '?.dataset?.visible': 'true',
      '?.setAttribute': ['aria-hidden', 'false']
   }
});
```

### Re-mounting behavior

If an element dismounts and then re-mounts, `stageOnMount` will:

1. Capture the current values (which may have changed since last mount)
2. Apply the staged properties again
3. Store new reversal information for the next dismount

```JavaScript
const button = document.querySelector('button');
button.disabled = false;  // Original state

button.classList.add('loading');  // Mount: disabled becomes true
button.classList.remove('loading');  // Dismount: disabled restored to false

button.disabled = true;  // Manually changed
button.classList.add('loading');  // Re-mount: disabled becomes true (staged value)
button.classList.remove('loading');  // Dismount: disabled restored to true (the value before re-mount)
```

### Performance and memory

- The assign-gingerly library is only loaded when `stageOnMount` is specified
- Reversal objects are stored in a WeakMap, allowing garbage collection when elements are removed
- Each element's reversal data is cleaned up when it dismounts

[Implemented as [Requirement13](requirements/Done/Requirement13.md)]

## Emitting events from mounted elements

MountObserver can automatically dispatch custom events from elements when they mount. This is useful for:

1. **Signaling readiness**: Notify parent components or listeners that an element is ready
2. **Initialization events**: Trigger workflows when elements appear in the DOM
3. **Decoupled communication**: Allow elements to announce their presence without tight coupling

### Basic event emission

```JavaScript
const observer = new MountObserver({
   matching: 'button[data-action]',
   mountedElemEmits: {
      event: 'Event',
      args: 'custom-ready'
   }
});
observer.observe(document);
```

This dispatches a `custom-ready` event from each matching button element when it mounts. Events bubble by default, so we can listen at the document level:

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
- `{{MountConfig}}` - The MountConfig configuration object

```JavaScript
const observer = new MountObserver({
   matching: 'button[data-test]',
   mountedElemEmits: {
      event: 'CustomEvent',
      args: ['element-mounted', { 
         detail: { 
            element: '{{mountedElement}}',
            config: '{{MountConfig}}'
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
   matching: 'my-component',
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
      timestamp: Date.now(),  //TODO:  magic string?
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
   matching: 'button[data-once]',
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
   matching: 'my-widget',
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

[Implemented as [Requirement10](requirements/Done/Requirement10.md)]

## Element-specific lifecycle notifications with getNotifier

While the MountObserver dispatches lifecycle events (mount, dismount, disconnect) at the observer level, sometimes we need to listen for events specific to a single element. The `getNotifier()` method returns an EventTarget that dispatches filtered events for only that element.

### Basic usage

```JavaScript
const observer = new MountObserver({
   matching: 'button',
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
   matching: '#my-button',
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
   matching: '#future-button'
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

[Implemented as [Requirement13](requirements/Done/Requirement13.md)]


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
// whereLangIn: ['en-GB'], // Not implemented - requires platform support
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

[Implemented with [Requirement6](requirements/Done/Requirement6.md)]


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
   matching:'[itemprop]',
   withScopePerimeter: '[itemscope]'
   do: ({localName}, {modules, observer}) => {
      ...
   },
   disconnectedSignal: new AbortController().signal
});
observer.observe(oContainerNode);
```

The check for "withScopePerimeter" is done via script:

```JavaScript
import {withScopePerimeter} from 'mount-observer/withScopePerimeter.js';
withScopePerimeter(oContainerNode: Node, matchCandidate: Element, outside: string){
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

[Implemented as [Requirement7](requirements/Done/Requirement7.md)]

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
      "withMediaMatching": "(min-width: 700px)"
   }'>
      <div>I don't know why you say <slot name=slot2></slot> I say <slot name=slot1></slot></div>
   </template>

   <template mount='{
      "select": ":not([defer-loading])",
      "loadingEagerness": "lazy",
      "withMediaMatching": "(max-width: 700px)"
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
