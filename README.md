[![Playwright Tests](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml/badge.svg)](https://github.com/bahrus/mount-observer/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/mount-observer.png)](http://badge.fury.io/js/mount-observer)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/mount-observer?style=for-the-badge)](https://bundlephobia.com/result?p=mount-observer)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/mount-observer?compression=gzip">


## Implementation Status

The following features have been implemented and tested:

### Core Functionality
- ✅ **matching**: CSS selector-based element matching
- ✅ **whenDefined**: Wait for custom elements to be defined before mounting
- ✅ **whereInstanceOf**: Constructor-based element filtering (single or array)
- ✅ **whereLocalNameMatches**: Regular expression-based localName filtering
- ✅ **shouldMount**: Custom JavaScript check for complex mounting conditions
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
- ✅ **with property**: Hierarchical observer composition with sub-observers
- ✅ **Element mount extension**: element.mount() method for scoped registry observation
- ✅ **Shared MutationObserver**: Efficient observer sharing across instances
- ✅ **Code splitting**: Conditional features loaded on-demand
- ✅ **Memory management**: WeakRef usage for DOM node references
- ✅ **Cede Scripts**: Declarative custom element definition via `<script type="cede">`

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

5. Scoped custom element registries form natural "islands" of DOM that have many commonalities with css "donut hole scoping", and which mutation observers aren't really designed around.  The mount-observer is designed to work with scoped custom element registries as first-class citizens. Learn more about [scoped custom element registries](https://developer.chrome.com/blog/scoped-registries). 


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

Before getting into the weeds, let's demonstrate a few of the most prominent use cases:

### Use Case 1:  Custom Attribute Enhancement

```html
<body>
    <div log-to-console="clicked on a div">hello</div>

    <script type=module>
        document.mount({
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

// main.js

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
1. Searches the imported module for an export with a `spawn` property (the enhancement class), starting with default.
2. Calls `element.enh.get(registryItem, context)` to spawn the enhancement
3. Stores the enhancement instance on `element.enh[enhKey]` if an `enhKey` is provided


## Exposing Module Exports from Script Elements

The `builtIns.scriptExport` handler solves a long-standing limitation: accessing ES module exports from script elements. It also provides a clean way to import JSON and other data formats declaratively.

### Problem 1: ES Module Export Access

The browser doesn't expose module exports from `<script type="module">` elements. There's been a [decade-old proposal](https://github.com/whatwg/html/issues/1013) to add this, but it remains unimplemented.

**The Solution:**

```html
<!-- Use nomodule to prevent browser from loading it separately -->
<script nomodule src="./config.js" id="myConfig"></script>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    const observer = new MountObserver({
        do: 'builtIns.scriptExport'
    });
    observer.observe(document);
    
    // Access the module's exports via element.export
    const config = document.getElementById('myConfig').export;
    console.log(config.apiKey);
    console.log(config.endpoints);
</script>
```

**Why `nomodule`?**
- Prevents the browser from loading the module separately
- Avoids having the module loaded twice in memory
- The handler imports it once and exposes exports via `element.export`

### Problem 2: Declarative JSON Import

Importing JSON typically requires `fetch()` or dynamic `import()` with assertions. This handler provides a declarative alternative.

**The Solution:**

```html
<!-- Load JSON data -->
<script src="./data.json" type="json" id="myData"></script>

<!-- Also supports full MIME types -->
<script src="./config.json" type="application/json" id="config"></script>
<script src="./linked-data.json" type="application/ld+json" id="linkedData"></script>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    const observer = new MountObserver({
        do: 'builtIns.scriptExport'
    });
    observer.observe(document);
    
    // Access the JSON data via element.export.default
    const data = document.getElementById('myData').export.default;
    console.log(data.items);
    console.log(data.config);
</script>
```

<details>
   <summary>Talking points</summary>

**Why no `nomodule` for JSON?**
- The browser ignores script elements with non-standard type attributes
- No risk of double-loading since the browser won't load it at all
- The handler imports it with the appropriate JSON assertion

**Supported JSON types:**
- `type="json"` - Simple and clean
- `type="application/json"` - Standard MIME type
- `type="application/ld+json"` - JSON-LD linked data
- Any type containing "json" triggers JSON import assertion

**How it works:**
1. Matches `script[src]` elements (via static properties)
2. Skips `type="module"` scripts (browser-handled)
3. Processes scripts with `nomodule` attribute OR type containing "json"
4. Resolves the `src` relative to the document
5. Imports with appropriate assertion (JSON if type contains "json")
6. Stores the imported module on `element.export`
7. Dispatches a `resolved` event with the imported module

**Reusing imported modules:**

The handler stores the imported module on the script element's `export` property and dispatches a `resolved` event. This allows other code to access the module without re-importing:

```html
<script src="./data.json" type="json" id="myData"></script>

<script type="module">
    const dataScript = document.getElementById('myData');
    
    // Listen for the resolved event
    dataScript.addEventListener('resolved', (e) => {
        console.log('Data loaded:', e.export);
        // e.export contains the imported module
        // For JSON: e.export.default contains the data
    });
    
    // Or access directly after processing
    // dataScript.export will contain the imported module
</script>
```

This is particularly useful when multiple components need to access the same data or configuration without triggering multiple imports.

**Benefits:**
- Access ES module exports from script elements (finally!)
- Declarative JSON loading without fetch
- Prevents double-loading of modules
- Clean, intuitive syntax
- Works with relative and absolute URLs
- No need to specify `matching` or `whereInstanceOf` (handler provides defaults)

**Use cases:**
- Accessing configuration module exports in HTML
- Loading JSON data declaratively
- Progressive enhancement with module loading
- Declarative dependency management
- Loading JSON-LD structured data

</details>

## Mount Observer Script Elements (MOSEs)

Inspired by the [speculation rules api](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) `builtIns.mountObserverScript` handler enables fully declarative mount observer configuration using `<script type="mountobserver">` elements. This provides the ultimate in HTML-first progressive enhancement.

```html
<!-- Inline JSON configuration -->
<script type="mountobserver">
{
    "matching": "my-fancy-button",
    "import": "./fancy-button.js",
    "do": "builtIns.defineCustomElement"
}
</script>

<!-- External JSON configuration -->
<script type="mountobserver" src="./observer-config.json"></script>

<!-- Bootstrap the handler -->
<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Handler provides matching and whereInstanceOf via static properties
    const observer = new MountObserver({
        do: 'builtIns.mountObserverScript'
    });
    observer.observe(document);
</script>
```

<details>
<summary>Talking points</summary>

**How it works:**
1. The handler matches `script[type="mountobserver"]` elements (via static properties)
2. If the script has a `src` attribute, imports JSON from that URL
3. Otherwise, parses the script's textContent as JSON
4. Supports both single config objects and arrays of configs
5. Stores the parsed config on `scriptElement.export` for reuse
6. Dispatches a `resolved` event with the parsed config
7. Calls `scriptElement.mount(config)` for each configuration
8. The `mount()` method creates a MountObserver for that configuration

**Reusing parsed configurations:**

The handler optimizes performance by storing the parsed configuration on the script element's `export` property and dispatching a `resolved` event. When the same script element is observed again (e.g., after being cloned or moved), the handler reuses the existing `export` instead of re-parsing:

```html
<script type="mountobserver" id="myConfig">
{
    "matching": ".my-element",
    "do": "builtIns.logToConsole"
}
</script>

<script type="module">
    const configScript = document.getElementById('myConfig');
    
    // Listen for the resolved event (fires only once on first parse)
    configScript.addEventListener('resolved', (e) => {
        console.log('Config loaded:', e.export);
        // e.export contains the parsed configuration
    });
    
    // Or access directly after processing
    // configScript.export will contain the parsed config
    
    // If observed again, the handler will reuse configScript.export
    // without re-parsing or firing the resolved event
</script>
```

This is particularly useful when inheriting mount observer configurations across shadow DOM boundaries, as the parsed config can be reused without re-parsing JSON. The `resolved` event fires only once (on first parse), but the handler will still process the configuration on subsequent observations.

**Multiple configs in one script:**

You can define multiple mount observer configurations in a single script element using a JSON array:

```html
<script type="mountobserver">
[
    {
        "do": "builtIns.hoistTemplate"
    },
    {
        "do": "builtIns.HTMLInclude"
    },
    {
        "matching": "my-button",
        "import": "./my-button.js",
        "do": "builtIns.defineCustomElement"
    }
]
</script>
```

This is equivalent to having three separate `<script type="mountobserver">` elements, but more concise. Each config in the array is processed independently and creates its own MountObserver.

**Benefits:**
- Zero JavaScript required for observer configuration
- Configurations are pure JSON (fully serializable)
- Easy to generate server-side or from build tools
- Supports both inline and external configurations
- Leverages the `element.mount()` API for automatic scope management
- No need to specify `matching` or `whereInstanceOf` for the handler itself

**Use cases:**
- Server-side rendering with progressive enhancement
- Build-time generation of observer configurations
- CMS-driven component loading
- Declarative micro-frontend architecture
- Configuration management without JavaScript bundling

**Example with multiple configurations:**
```html
<!-- Load custom elements -->
<script type="mountobserver">
{
    "matching": "my-button",
    "import": "./components/my-button.js",
    "do": "builtIns.defineCustomElement"
}
</script>

<!-- Enhance existing elements -->
<script type="mountobserver">
{
    "matching": ".interactive",
    "import": "./enhancements/interactive.js",
    "do": "builtIns.enhanceMountedElement"
}
</script>

<!-- Single bootstrap script activates all configurations -->
<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
</script>
```

</details>

## Hoisting Templates for Performance

The `builtIns.hoistTemplate` handler optimizes template usage by moving a template element's content from shadow roots to `document.head`. 

**Why hoist templates?**

Template hoisting is particularly useful when you need to share conditional or repeated templates across multiple custom element instances.

When HTML-first custom elements repeat throughout a page, each instance typically contains its own copy of template content. Moving these templates to a centralized location:
- Reduces memory usage (one template instead of many copies)
- Improves cloning performance (single source of truth)
- Maintains the same API through the `remoteContent` getter

**Basic usage:**

```html
<my-web-component>
    #shadow
        <template id="my-template">
            <div>My content</div>
        </template>
</my-web-component>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    const observer = new MountObserver({
        do: 'builtIns.hoistTemplate'
    });
    observer.observe(document);
</script>
```

**What happens:**
1. The handler finds templates with IDs in shadow roots
2. Moves the template content to a new template in `<head>`
3. Updates the original template with `src="#mount-observer-0"` (unique ID)
4. Defines a `remoteContent` getter that returns the hoisted template's content

**Accessing hoisted content:**

```javascript
const template = shadowRoot.querySelector('#my-template');

// After hoisting, use remoteContent to access the content
const content = template.remoteContent;  // Returns DocumentFragment
const clone = content.cloneNode(true);   // Clone the content
```
<details>
   <summary>Matching criteria

The handler automatically hoists templates that:
- Have an `id` attribute
- Don't already have a `src` attribute
- Are in a shadow root (or disconnected, being cloned)
- Have content (empty templates are skipped)

**Declarative usage with MOSE:**

```html
<script type="mountobserver">
{
    "do": "builtIns.hoistTemplate"
}
</script>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
</script>
```

[Implemented as HoistingTemplates requirement](requirements/Done/HoistingTemplates.md)

</details>

## Element Mount Configuration (EMC) Scripts

The `builtIns.emcScript` handler provides declarative element enhancement using `<script type="emc">` elements. EMC scripts combine mount observation with the [assign-gingerly](https://github.com/bahrus/assign-gingerly) enhancement system to apply behaviors, properties, and classes to elements as they mount.

**Why use EMC scripts?**

- Declaratively enhance elements without writing JavaScript
- Lazy load enhancement classes only when needed
- Automatically register and spawn enhancements
- Works with scoped custom element registries
- Supports attribute-based element matching
- Reuses enhancement definitions across multiple elements

**Basic usage:**

```html
<!-- Define enhancement configuration -->
<script type="emc">
{
    "matching": ".interactive",
    "enhConfig": {
        "spawn": "./my-enhancement.js",
        "enhKey": "myEnhancement"
    }
}
</script>

<!-- Elements matching the selector get enhanced -->
<div class="interactive">This will be enhanced</div>
<div class="interactive">This too</div>
```

**External JSON configuration:**

```html
<!-- Load configuration from external file -->
<script type="emc" src="./enh-config.json"></script>
```

**With attribute matching:**

```html
<script type="emc">
{
    "matching": "button",
    "enhConfig": {
        "spawn": "./button-enhancement.js",
        "enhKey": "fancyButton",
        "withAttrs": {
            "base": "variant"
        }
    }
}
</script>

<!-- Only buttons with variant="primary" get enhanced -->
<button variant="primary">Enhanced</button>
<button>Not enhanced</button>
```

**How it works:**

1. EMC script is parsed (inline JSON or external via `src`)
2. Configuration is stored on `scriptElement.export`
3. `resolved` event is dispatched
4. Script ID is auto-generated as `${parentElement.localName}.${enhKey}` if not specified
5. MountObserver watches for elements matching the configuration
6. When element mounts:
   - Checks if already enhanced (via `element.enh[enhKey]`)
   - Registers enhancement class if not already registered
   - Spawns enhancement instance via `element.enh.get(enhancementConfig)`

**Enhancement class example:**

```javascript
// my-enhancement.js
export default class MyEnhancement {
    constructor(element, ctx, initVals) {
        this.element = element;
        // Apply enhancement
        this.element.classList.add('enhanced');
    }
    
    dispose() {
        // Cleanup
        this.element.classList.remove('enhanced');
    }
}
```

**Requirements:**

- Must import `ElementMountExtension.js` to enable `element.enh` property
- Must import `assign-gingerly/object-extension.js` for enhancement registry
- Enhancement classes should be constructors that accept `(element, ctx, initVals)`

[Implemented as EMCScript requirement](requirements/Done/EMCScript.md)

## Custom Element Definition (Cede) Scripts

The `builtIns.cedeScript` handler enables declarative custom element definition using `<script type="cede">` elements. "Cede" stands for **C**ustom **E**lement **De**finition. It creates a new class that extends an existing custom element class and defines it in the appropriate registry — all without writing any JavaScript.

**Why use Cede Scripts?**

- Define custom elements declaratively in HTML
- Extend existing base classes without writing boilerplate
- Works with scoped custom element registries
- Enables template-based custom elements where the parent's fragment becomes the template
- Zero JavaScript required for element definition

**Basic usage:**

```html
<time-ticker>
    <script type="cede" data-extends="xtal-element"></script>
</time-ticker>
```

**What happens:**

1. The handler finds the script element's `customElementRegistry` (falls back to global `customElements`)
2. Awaits `registry.whenDefined('xtal-element')` to get the base class constructor
3. Creates a new class extending the base: `class extends baseCtr {}`
4. Sets `NewCtr.seedRef = new WeakRef(scriptEl)` — allowing the CE to access the script element
5. If `registry.get('time-ticker')` already exists, does nothing (first definition wins)
6. Otherwise calls `registry.define('time-ticker', NewCtr)`

The tag name comes from the `localName` of the script element's parent.

**Accessing the seed reference:**

The `seedRef` static property gives the custom element class access to the original script element. The primary use case is extracting the parent's (Shadow) Fragment to create a cloneable template for other instances:

```javascript
class XtalElement extends HTMLElement {
    connectedCallback() {
        const seedScript = this.constructor.seedRef?.deref();
        if (seedScript) {
            const parentFragment = seedScript.parentElement.shadowRoot;
            // Use parentFragment as a template for cloning
        }
    }
}
```

**With scoped registries:**

```html
<my-app>
    #shadow (with scoped registry)
        <time-ticker>
            <script type="cede" data-extends="xtal-element"></script>
        </time-ticker>
</my-app>
```

The handler uses the script element's `customElementRegistry` property, so it naturally works with [scoped custom element registries](https://developer.chrome.com/blog/scoped-registries) (Chrome 146+, latest WebKit/Safari). If no scoped registry is present, it falls back to the global `customElements` registry.

**Bootstrapping:**

```html
<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';

    // Handler provides matching and whereInstanceOf via static properties
    const observer = new MountObserver({
        do: 'builtIns.cedeScript'
    });
    observer.observe(document);
</script>
```

Or declaratively via a MOSE:

```html
<script type="mountobserver">
{
    "do": "builtIns.cedeScript"
}
</script>
```

**Key behaviors:**

- If the parent element's tag is already defined in the registry, the handler silently no-ops
- If multiple cede scripts exist under the same parent, the first one to resolve wins
- The script element must have a `parentElement` or the handler throws
- `whenDefined` awaits indefinitely — the base class must eventually be registered

[Implemented as SupportForCedeScripts requirement](requirements/SupportForCedeScripts.md)

## Syndicating Mount Observers with Synthesizer

The `Synthesizer` abstract base class enables automatic propagation of mount observer configurations across shadow DOM boundaries. It acts as a "syndicator-subscriber" pattern where a syndicator in the document root broadcasts script elements to subscribers in shadow roots.

**Why use Synthesizer?**

- Automatically share mount observer configurations across shadow roots
- Eliminates manual observer setup in each shadow root
- Ensures consistent behavior across component boundaries
- Works with both MOSE and EMC script elements
- Provides a declarative, inheritance-based approach

**How it works:**

1. **Syndicator** (in document root): Watches for `script[type="mountobserver"]` and `script[type="emc"]` elements and broadcasts them to subscribers
2. **Subscriber** (in shadow roots): Receives and clones script elements from the syndicator
3. **Automatic activation**: Both syndicator and subscriber activate 7 built-in handlers in their respective root nodes

**Basic usage:**

```html
<!-- Define your Synthesizer custom element -->
<script type="module">
    import { Synthesizer } from 'mount-observer/Synthesizer.js';
    
    class AppSynthesizer extends Synthesizer {}
    customElements.define('app-synthesizer', AppSynthesizer);
</script>

<!-- Syndicator in document root with mount observer scripts -->
<app-synthesizer>
    <script type="mountobserver">
    {
        "matching": "button.primary",
        "import": "./primary-button.js",
        "do": "builtIns.defineCustomElement"
    }
    </script>
    
    <script type="emc">
    {
        "matching": ".interactive",
        "enhConfig": {
            "spawn": "./interactive.js",
            "enhKey": "interactive"
        }
    }
    </script>
</app-synthesizer>

<!-- Component with shadow root -->
<my-component>
    #shadow
        <!-- Subscriber automatically receives scripts from syndicator -->
        <app-synthesizer></app-synthesizer>
        
        <!-- These elements will be enhanced by the syndicated observers -->
        <button class="primary">Click me</button>
        <div class="interactive">Interactive content</div>
</my-component>
```

**What happens:**

1. The syndicator (`<app-synthesizer>` in document root) activates 7 built-in handlers:
   - `builtIns.mountObserverScript` - Process MOSE scripts
   - `builtIns.scriptExport` - Expose module exports from script elements
   - `builtIns.HTMLInclude` - Enable intra-document HTML includes
   - `builtIns.hoistTemplate` - Optimize template usage
   - `builtIns.generateIds` - Auto-generate unique IDs
   - `builtIns.emcParserScript` - Load parsers for EMC scripts
   - `builtIns.emcScript` - Process EMC scripts

<details>
<summary>Why these handlers?</summary>

These handlers form the core infrastructure for declarative progressive enhancement:

- **mountObserverScript**: Enables fully declarative mount observer configuration via `<script type="mountobserver">` elements
- **scriptExport**: Makes ES module exports accessible from script elements, enabling configuration sharing
- **HTMLInclude**: Allows template reuse and inheritance patterns with `<template src="#id">`
- **hoistTemplate**: Optimizes memory usage by centralizing template content
- **generateIds**: Automates ID generation for forms and accessibility features
- **emcParserScript**: Enables lazy-loading of complex parsers for enhancement attributes
- **emcScript**: Processes enhancement configurations for progressive enhancement

Together, these handlers enable a complete HTML-first development workflow where behaviors, enhancements, and configurations can be declared in HTML and automatically propagated across shadow DOM boundaries.

</details>

2. The syndicator watches for script elements being added to its light children

3. When a script is added, it waits for the `resolved` event (ensuring the script is parsed)

4. The syndicator dispatches an `AddedScriptElementEvent` with the script element

5. Subscribers in shadow roots:
   - Find the syndicator in the document root (matching localName)
   - Process existing scripts from the syndicator
   - Subscribe to `addedscriptelement` events for new scripts
   - Clone each script element and copy its `export` property
   - Append cloned scripts to their own light children
   - Activate the same 7 built-in handlers in their shadow root

**Syndicator vs Subscriber:**

The Synthesizer automatically determines its role based on its root node:
- **Document root** → Acts as syndicator (broadcasts scripts)
- **Shadow root** → Acts as subscriber (receives scripts)

**Activation of built-in handlers:**

Both syndicator and subscriber call `element.mount()` to activate handlers in their respective scopes:

```javascript
// Activated in both syndicator and subscriber root nodes
await this.getRootNode().mount({
    do: 'builtIns.mountObserverScript'
});
await this.getRootNode().mount({
    do: 'builtIns.scriptExport'
});
await this.getRootNode().mount({
    do: 'builtIns.HTMLInclude'
});
await this.getRootNode().mount({
    do: 'builtIns.hoistTemplate'
});
await this.getRootNode().mount({
    do: 'builtIns.generateIds'
});
await this.getRootNode().mount({
    do: 'builtIns.emcParserScript'
});
await this.getRootNode().mount({
    do: 'builtIns.emcScript'
});
```

This ensures that:
- MOSE scripts are processed in each scope
- Script exports are available
- HTML includes work within each shadow root
- Templates are hoisted for performance
- IDs are auto-generated in forms and components
- Parsers are loaded for EMC scripts
- EMC scripts enhance elements in each scope

**Script processing:**

When a subscriber receives a script element:

1. Checks if the script has an `export` property (parsed configuration)
2. If not, waits for the `resolved` event (with 5-second timeout)
3. Clones the script element
4. Copies the `export` property from source to clone (by reference)
5. Appends the cloned script to the subscriber's light children
6. The activated handlers process the cloned script in the shadow root's scope

**Benefits:**

- **Declarative**: Define observers once in the document root
- **Automatic**: Scripts propagate to all shadow roots automatically
- **Scoped**: Each shadow root gets its own observer instances
- **Efficient**: Parsed configurations are shared (not re-parsed)
- **Maintainable**: Update observers in one place, changes propagate everywhere

**Example - Multiple components:**

```html
<!-- Syndicator with shared observers -->
<app-synthesizer>
    <script type="mountobserver">
    {
        "matching": "button",
        "import": "./button-enhancement.js",
        "do": "builtIns.enhanceMountedElement"
    }
    </script>
</app-synthesizer>

<!-- Component 1 -->
<my-header>
    #shadow
        <app-synthesizer></app-synthesizer>
        <button>Header Button</button>  <!-- Enhanced -->
</my-header>

<!-- Component 2 -->
<my-footer>
    #shadow
        <app-synthesizer></app-synthesizer>
        <button>Footer Button</button>  <!-- Enhanced -->
</my-footer>
```

Both components receive the button enhancement observer automatically.

**Error handling:**

- Logs errors if handler activation fails
- Logs errors if script processing fails
- Continues processing other scripts even if one fails
- Provides 5-second timeout for waiting on `resolved` events

**Requirements:**

- Must extend the `Synthesizer` abstract class
- Must be defined as a custom element
- Syndicator must be in the document root
- Subscribers must be in shadow roots
- All handlers must be imported and registered before use

**Comparison with `mountGlobally()`:**

Unlike `mountGlobally()`, which discovers shadow roots by observing custom elements, Synthesizer:
- Uses explicit syndicator-subscriber pattern
- Provides more control over which scripts are syndicated
- Works with any shadow root structure
- Doesn't rely on custom element discovery
- Allows for selective script propagation

[Implemented as Syndicating Mount Observers With Synthesizer requirement](requirements/Done/Syndicating Mount Observers With Synthesizer.md)

## Intra-Document HTML Includes with HTMLInclude

The `builtIns.HTMLInclude` handler enables declarative HTML fragment reuse within a document using `<template src="#id">` syntax. Think of it as "constants for HTML" - define content once with an ID, then reference it multiple times throughout your document.

**Why use HTML includes?**

- Reduces duplication of repeated HTML structures
- Enables template-based content generation
- Supports partial updates via matching insertions
- Works across shadow DOM boundaries
- Supports declarative shadow DOM attachment
- Caches lookups for performance
- Detects circular references automatically
- Can be used to inherit from MOSEs

**Basic usage - Simple cloning:**

```html
<!-- Define reusable content -->
<div id="reusable">
    <p>This content can be reused</p>
    <button>Click me</button>
</div>

<!-- Reference it with a template -->
<template src="#reusable"></template>

<!-- Results in: -->
<div>
    <p>This content can be reused</p>
    <button>Click me</button>
</div>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    const observer = new MountObserver({
        do: 'builtIns.HTMLInclude'
    });
    observer.observe(document);
</script>
```

<details>
   <summary>More discussion

**What happens:**
1. The handler finds templates with `src` attributes starting with `#`
2. Searches for an element with that ID (across shadow boundaries)
3. Clones the content from the source element
4. Replaces the template with the cloned content
5. Removes the `id` attribute from cloned elements to avoid duplicate IDs

**Cloning priority:**
1. `remoteContent` property (hoisted templates) - highest priority
2. `content` property (regular templates)
3. The element itself (any element with an ID)

**Works with hoisted templates:**

```html
<my-web-component>
    #shadow
        <template id="my-template">
            <div>Hoisted content</div>
        </template>
</my-web-component>

<!-- After hoisting, this still works -->
<template src="#my-template"></template>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // First hoist templates
    new MountObserver({
        do: 'builtIns.hoistTemplate'
    }).observe(document);
    
    // Then use them
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
</script>
```

</details>

### Shadow DOM Support

The HTMLInclude handler supports declarative shadow DOM attachment using the `shadowrootmodeonload` attribute. This allows you to attach cloned content directly to a parent element's shadow root, similar to the platform's [declarative shadow DOM](https://web.dev/articles/declarative-shadow-dom) feature.

**Basic shadow DOM usage:**

```html
<!-- Define reusable shadow content -->
<template id="shadow-content">
    <style>
        :host {
            display: block;
            padding: 10px;
        }
        .shadow-text {
            color: blue;
        }
    </style>
    <div class="shadow-text">
        <slot name="greeting"></slot>
        <slot></slot>
    </div>
</template>

<!-- Attach to shadow root -->
<div class="host-element">
    <template src="#shadow-content" shadowrootmodeonload="open"></template>
    <span slot="greeting">Hello</span>
    <span>World!</span>
</div>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
</script>
```

**What happens:**
1. The handler checks for the `shadowrootmodeonload` attribute (case-insensitive)
2. If present, it attaches the cloned content to the parent element's shadow root
3. If the parent doesn't have a shadow root, one is created with the specified mode
4. If a shadow root already exists, the content is appended to it
5. The template is removed as usual

**Shadow root modes:**
- `open` - Shadow root is accessible via `element.shadowRoot`
- `closed` - Shadow root is not accessible from outside

**Slots work automatically:**

The native browser slot mechanism handles content distribution. Light DOM elements with `slot` attributes are automatically projected into the corresponding `<slot>` elements in the shadow DOM.

**Example - Complex nested structure:**

```html
<template id="chorus">
    <template src="#beautiful">
        <span slot="subjectIs">
            <slot name="subjectIs1"></slot>
        </span>
    </template>
    <div>No matter what they say</div>
    <div>Words <slot name="verb1"></slot> bring <slot name="pronoun1"></slot> down</div>
</template>

<div class="chorus">
    <template src="#chorus" shadowrootmodeonload="open"></template>
    <span slot="verb1">can't</span>
    <span slot="pronoun1">me</span>
    <span slot="subjectIs1">I am</span>
</div>
```

**Nested templates in shadow DOM:**

Templates inside shadow roots are not automatically processed by the parent observer. To process nested templates, you need to observe the shadow root separately:

```javascript
const host = document.querySelector('.host-element');
if (host.shadowRoot) {
    const shadowObserver = new MountObserver({
        do: 'builtIns.HTMLInclude'
    });
    await shadowObserver.observe(host.shadowRoot);
}
```

**Error handling:**

- Invalid mode values: Logs warning if mode is not `"open"` or `"closed"`
- Missing parent: Logs warning if template has no parent element
- Attachment failures: Logs error if shadow root cannot be attached

### Matching Insertions - Partial Updates

When a template has children, they are used to match elements in the cloned content and selectively update them. This enables partial modifications and "nulling out" content without duplicating the entire structure.

**How it works:**
1. Template children generate CSS selectors (tag, classes, attributes)
2. Matching elements in the cloned content are found
3. Matched elements have their children replaced and attributes updated
4. The `-i` attribute specifies which attributes to update

**Example - Updating attributes:**

```html
<!-- Source content -->
<div itemscope id="love">
    <data value="false" itemprop="todayIsFriday">It's Thursday</data>
</div>

<!-- Template with matching insertion -->
<template src="#love">
    <data value="true" itemprop="todayIsFriday" -i="value"></data>
</template>

<!-- Results in: -->
<div itemscope>
    <data value="true" itemprop="todayIsFriday">It's Thursday</data>
</div>
<!-- The value attribute is updated, but content stays "It's Thursday" -->
```

**The `-i` attribute:**

The `-i` (insert) attribute is a space-separated list of attribute names to update on matched elements. Attributes listed in `-i` are:
- Excluded from the CSS selector (allows matching elements with different values)
- Updated on matched elements with values from the template child

```html
<template src="#form">
    <!-- Update both value and placeholder -->
    <input type="text" name="username" value="new" placeholder="Updated" -i="value placeholder">
</template>
```

**Example - Replacing content:**

```html
<!-- Source -->
<div id="greeting">
    <p class="message">Hello</p>
</div>

<!-- Template replaces content -->
<template src="#greeting">
    <p class="message">Goodbye</p>
</template>

<!-- Results in: -->
<div>
    <p class="message">Goodbye</p>
</div>
```

**Example - Multiple matching elements:**

```html
<!-- Source with multiple items -->
<div id="list">
    <span class="item">Item 1</span>
    <span class="item">Item 2</span>
    <span class="item">Item 3</span>
</div>

<!-- Update all matching items -->
<template src="#list">
    <span class="item">Updated</span>
</template>

<!-- Results in: -->
<div>
    <span class="item">Updated</span>
    <span class="item">Updated</span>
    <span class="item">Updated</span>
</div>
```

**Example - Nulling out content:**

```html
<!-- Source -->
<div id="status">
    <span data-active="false" class="indicator">Inactive</span>
</div>

<!-- Update attribute, remove content -->
<template src="#status">
    <span data-active="true" class="indicator" -i="data-active"></span>
</template>

<!-- Results in: -->
<div>
    <span data-active="true" class="indicator"></span>
</div>
<!-- Content is removed, attribute is updated -->
```

### Use Case: Inheriting Groups of Mount-Observers

Matching insertions become particularly powerful when combined with Mount Observer Script Elements (MOSEs) for inheriting and customizing groups of mount-observers across shadow DOM boundaries.

**Scenario:** You have a base component with a set of mount-observers defined in its shadow root, and you want to reuse those observers in other components while making targeted modifications.

```html
<!-- Base component with mount-observers -->
<template id="base-observers">
    <script type="mountobserver">
    {
        "matching": "button.primary",
        "import": "./primary-button.js",
        "do": "builtIns.defineCustomElement"
    }
    </script>
    
    <script type="mountobserver">
    {
        "matching": ".interactive",
        "import": "./interactive.js",
        "do": "builtIns.enhanceMountedElement"
    }
    </script>
    
    <script type="mountobserver">
    {
        "matching": "form",
        "import": "./form-validator.js",
        "do": "builtIns.enhanceMountedElement"
    }
    </script>
</template>

<!-- Derived component - inherit and customize -->
<my-derived-component>
    #shadow
        <!-- Include base observers -->
        <template src="#base-observers">
            <!-- Override the form validator with a different one -->
            <script type="mountobserver">
            {
                "matching": "form",
                "import": "./custom-form-validator.js",
                "do": "builtIns.enhanceMountedElement"
            }
            </script>
        </template>
        
        <!-- Component content -->
        <form>...</form>
        <button class="primary">Submit</button>
</my-derived-component>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Bootstrap HTMLInclude handler
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
    
    // Bootstrap MOSE handler to activate the observers
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
</script>
```

**What happens:**
1. The `<template src="#base-observers">` clones all three MOSE scripts
2. The matching insertion finds the form validator script (matching by `matching` attribute)
3. Replaces its content with the custom validator configuration
4. All three scripts are inserted into the shadow root
5. The MOSE handler activates all observers in the shadow root's registry scope

**Benefits:**
- **Composition**: Build complex observer configurations from reusable pieces
- **Inheritance**: Derive new components with modified observer behavior
- **Scoped registries**: Each shadow root gets its own set of observers
- **Declarative**: No JavaScript required for observer inheritance
- **Maintainable**: Update base observers in one place, changes propagate

**Advanced pattern - Multiple inheritance:**

```html
<!-- Base UI observers -->
<template id="ui-observers">
    <script type="mountobserver">{"matching": "button", ...}</script>
    <script type="mountobserver">{"matching": "input", ...}</script>
</template>

<!-- Base data observers -->
<template id="data-observers">
    <script type="mountobserver">{"matching": "[itemscope]", ...}</script>
</template>

<!-- Component combines both -->
<my-component>
    #shadow
        <template src="#ui-observers"></template>
        <template src="#data-observers"></template>
        
        <!-- Add component-specific observers -->
        <script type="mountobserver">
        {
            "matching": ".special",
            "import": "./special.js",
            "do": "builtIns.enhanceMountedElement"
        }
        </script>
</my-component>
```

This pattern enables:
- **Mixins**: Combine multiple observer groups
- **Layering**: Stack observers from different concerns (UI, data, behavior)
- **Customization**: Override specific observers while keeping others
- **Reusability**: Share observer configurations across components

**Declarative usage with MOSE:**

```html
<script type="mountobserver">
{
    "do": "builtIns.HTMLInclude"
}
</script>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
</script>
```

**Error handling:**

The handler provides helpful error messages:
- Missing elements: `data-include-error="Element with id='foo' not found"`
- Circular references: `data-include-error="Circular reference detected: #foo"`
- Clone failures: `data-include-error="Unable to clone content from #foo"`

**Performance:**

- Uses WeakMap caching for repeated ID lookups
- Efficient for scenarios like periodic tables with many repeated elements
- Searches across shadow boundaries using `upShadowSearch` (registry-aware)
- Respects scoped custom element registry boundaries
- Cleans up cache entries when elements are garbage collected

**MOSE Export Optimization:**

When cloning live DOM elements (not templates) that contain Mount Observer Script Elements (MOSEs) across shadow DOM boundaries, the HTMLInclude handler automatically copies the parsed `export` property from source scripts to cloned scripts. This optimization avoids re-parsing JSON when the same MOSE configuration is reused in multiple shadow roots.

**How it works:**
1. Detects when cloning a live element (not a template) from a different root node
2. Finds all `script[type="mountobserver"]` elements in both source and clone
3. Matches scripts by their `id` attribute
4. Copies the `export` property from source to clone (by reference)
5. If source script hasn't been processed yet, waits for the `resolved` event

**Example:**

```html
<!-- Source element with MOSE in light DOM -->
<div id="observer-config">
    <script type="mountobserver" id="my-config">
    {
        "matching": ".interactive",
        "import": "./interactive.js",
        "do": "builtIns.enhanceMountedElement"
    }
    </script>
    <div class="interactive">Content</div>
</div>

<!-- Clone into shadow DOM -->
<my-component>
    #shadow
        <template src="#observer-config"></template>
</my-component>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Process MOSEs in light DOM
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document.body);
    
    // Clone into shadow roots
    new MountObserver({
        do: 'builtIns.HTMLInclude'
    }).observe(document);
</script>
```

**Benefits:**
- **Performance**: JSON is parsed only once, not for each clone
- **Memory efficiency**: Cloned scripts share the same export object
- **Consistency**: All clones use identical configuration
- **Automatic**: No manual intervention required

**Requirements:**
- Source and clone must be in different root nodes (document vs shadow root)
- MOSE scripts must have `id` attributes for matching
- Source script must be processed by `builtIns.mountObserverScript` or `builtIns.scriptExport` before cloning

[Implemented as MatchingInsertionsAndDeletionsWithIntraDocumentHTMLIncludes requirement](requirements/Done/MatchingInsertionsAndDeletionsWithIntraDocumentHTMLIncludes.md)

## Automatic ID Generation with genIds

The `builtIns.generateIds` handler automatically generates unique IDs for elements within scoped containers using the [id-generation](https://www.npmjs.com/package/id-generation) package. This is particularly useful for forms, microdata structures, and any scenario where you need unique IDs for accessibility or linking purposes.

**Why use automatic ID generation?**

- Eliminates manual ID management and conflicts
- Supports scoped ID generation within fieldsets or itemscope containers
- Automatically updates ID references in attributes (aria-labelledby, for, etc.)
- Provides shorthand syntax for common patterns
- Handles deferred attribute activation
- Removes `disabled` from fieldsets after processing

**Basic usage:**

```html
<fieldset disabled>
    <label>
        LHS: <input data-id={{lhs}}>
    </label>
    
    <label for=rhs>
        RHS: <input data-id={{rhs}}>
    </label>
    
    <template -id defer-🎚️ 🎚️='on if isEqual, based on #{{lhs}} and #{{rhs}}.'>
        <div>LHS === RHS</div>
    </template>
</fieldset>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    const observer = new MountObserver({
        do: 'builtIns.generateIds'
    });
    observer.observe(document);
</script>
```

**What happens:**

1. The handler watches for elements with the `-id` attribute (the trigger)
2. Finds the nearest scope container (fieldset, [itemscope], or root)
3. Generates unique IDs for elements with `data-id={{name}}`, `#`, `@`, or `|` attributes
4. Replaces `#{{name}}` references with generated IDs in attributes
5. Removes `-id` and `defer-*` attributes after processing
6. Removes `disabled` from fieldset containers

**Result:**

```html
<fieldset>
    <label>
        LHS: <input id=gid-0 data-id=lhs>
    </label>
    
    <label for=rhs>
        RHS: <input id=gid-1 data-id=rhs>
    </label>
    
    <template 🎚️='on if isEqual, based on #gid-0 and #gid-1.'>
        <div>LHS === RHS</div>
    </template>
</fieldset>
```

**Shorthand attributes:**

```html
<fieldset disabled>
    <!-- # uses element's tag name -->
    <my-element #></my-element>  <!-- becomes id=gid-0 data-id=my-element -->
    
    <!-- @ uses element's name attribute -->
    <input @ name="email" type="email">  <!-- becomes id=gid-1 data-id=email -->
    
    <!-- | uses element's itemprop attribute -->
    <span | itemprop="price">$99</span>  <!-- becomes id=gid-2 data-id=price -->
    
    <button -id>Generate IDs</button>
</fieldset>
```

**Side effects with data-id:**

The `data-id` attribute supports special symbols that trigger side effects:

```html
<form>
    <fieldset disabled>
        <label>
            LHS: <input data-id="{{@. lhs}}">
        </label>
        
        <label for=rhs>
            RHS: <span contenteditable data-id="{{|.% rhs}}">
        </label>
        
        <template -id defer-🎚️ 🎚️='on if isEqual, based on #{{lhs}} and #{{rhs}}.'>
            <div>LHS === RHS</div>
        </template>
    </fieldset>
</form>
```

**Result:**

```html
<form>
    <fieldset>
        <label>
            LHS: <input name=lhs class=lhs id=gid-0 data-id=lhs>
        </label>
        
        <label for=rhs>
            RHS: <span contenteditable itemprop=rhs class=rhs part=rhs id=gid-1 data-id=rhs>
        </label>
        
        <template 🎚️='on if isEqual, based on #gid-0 and #gid-1.'>
            <div>LHS === RHS</div>
        </template>
    </fieldset>
</form>
```

**Symbol meanings:**

| Symbol | Attribute         | Meaning                                                                      |
|--------|-------------------|------------------------------------------------------------------------------|
| @      | name              | Second letter of name, common in social media for selecting names            |
| \|     | itemprop          | "Pipe" resembles itemprop, half of dollar sign, looks like an I              |
| $      | itemscope+itemprop| Combination of S for Scope and Pipe                                          |
| %      | part              | Starts with p, percent indicates proportion                                  |
| .      | class             | CSS selector                                                                 |

Multiple symbols can be combined: `data-id="{{@.% myName}}"` adds name, class, and part attributes.

**Deferred attributes:**

Use `defer-*` prefix to prevent attributes from being applied until IDs are generated:

```html
<fieldset disabled>
    <!-- These attributes won't work until IDs are generated -->
    <label defer-for="for: #{{email}}">Email:</label>
    <input data-id={{email}} type="email">
    
    <button -id>Activate Form</button>
</fieldset>
```

**Supported reference attributes:**

The handler automatically replaces `#{{name}}` references in these attributes:
- ARIA: `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`, `aria-flowto`, `aria-activedescendant`
- Form: `for`, `form`, `list`
- Microdata: `itemref`
- Any `data-*` attribute
- Any attribute with a `defer-*` prefix

**Declarative usage with MOSE:**

```html
<script type="mountobserver">
{
    "do": "builtIns.generateIds"
}
</script>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    new MountObserver({
        do: 'builtIns.mountObserverScript'
    }).observe(document);
</script>
```

**Scope containers:**

The handler looks for the nearest scope container using `.closest()`:
- `<fieldset>` elements
- Elements with `[itemscope]` attribute
- Falls back to the root node if no scope is found

**Global counter:**

IDs are generated using a global counter (via `Symbol.for`) to ensure uniqueness across multiple module instances. Generated IDs follow the pattern `gid-0`, `gid-1`, `gid-2`, etc.

## Scoped Parser Registry for EMC Scripts

The scoped parser registry system enables lazy-loading of complex parsers for enhancement attributes while maintaining framework isolation. Each synthesizer element (be-hive, htmx-container, alpine-scope, etc.) maintains its own parser registry to prevent conflicts between different framework libraries.

**Why use scoped parser registries?**

- Lazy load complex parsers only when needed (e.g., nested-regex-groups)
- Maintain framework isolation (HTMX, Alpine, be-hive can coexist)
- Declarative parser loading via HTML script tags
- Programmatic parser registration for dynamic scenarios
- Automatic parser waiting before enhancement initialization
- Built-in parsers remain globally available

### Basic Usage - Declarative Parser Loading

Load parsers declaratively using `<script type="emc-parser">` elements:

```html
<be-hive>
    <!-- Load parser first -->
    <script type="emc-parser" 
            src="nested-regex-groups/parser.js" 
            parser-name="nestedRegexGroups"></script>
    
    <!-- Then load enhancement that depends on it -->
    <script type="emc" 
            src="be-switched/emc.json" 
            wait-for-parsers="nestedRegexGroups"></script>
</be-hive>

<script type="module">
    import { MountObserver } from 'mount-observer/MountObserver.js';
    
    // Bootstrap the handlers
    new MountObserver({
        do: 'builtIns.emcScript'
    }).observe(document);
</script>
```

**What happens:**

1. The `emc-parser` script loads the parser module via dynamic import
2. Parser is registered in the be-hive element's scoped registry
3. `parser-registered` event is dispatched
4. The `emc` script waits for the parser to be registered
5. Once ready, the enhancement is processed with access to the parser

### Multiple Parsers

Wait for multiple parsers using space-delimited names:

```html
<be-hive>
    <script type="emc-parser" src="parser1.js" parser-name="parser1"></script>
    <script type="emc-parser" src="parser2.js" parser-name="parser2"></script>
    
    <!-- Wait for both parsers -->
    <script type="emc" 
            src="my-enhancement/emc.json" 
            wait-for-parsers="parser1 parser2"></script>
</be-hive>
```

### Custom Timeout

Configure parser loading timeout (default: 60 seconds):

```html
<be-hive>
    <script type="emc-parser" src="slow-parser.js" parser-name="slowParser"></script>
    
    <!-- Wait up to 2 minutes -->
    <script type="emc" 
            src="my-enhancement/emc.json" 
            wait-for-parsers="slowParser"
            data-parser-timeout="120000"></script>
</be-hive>
```

### Programmatic Parser Registration

Register parsers programmatically via JavaScript:

```html
<be-hive id="myHive">
    <script type="emc" 
            src="my-enhancement/emc.json" 
            wait-for-parsers="customParser"></script>
</be-hive>

<script type="module">
    import { registerParser } from 'assign-gingerly/parserRegistry.js';
    
    // Load parser programmatically
    const parser = await import('./custom-parser.js');
    const beHive = document.getElementById('myHive');
    
    registerParser(beHive, 'customParser', parser.default);
</script>
```

### Parser Interface

Parsers are simple functions that transform attribute string values:

```javascript
// my-parser.js
export default function parse(value) {
    // Transform the string value
    if (value === null) return null;
    
    // Your parsing logic here
    return parsedValue;
}
```

**Requirements:**
- Parser must be a function with signature `(v: string | null) => any`
- Must be exported as the default export
- Should handle `null` values appropriately
- Should throw descriptive errors for invalid input

### Scoped vs Global Parsers

**Scoped parsers** (registered in be-hive elements):
- Isolated to a specific synthesizer element and its descendants
- Different frameworks can use the same parser names without conflicts
- Registered via `emc-parser` scripts or `registerParser()`

**Global parsers** (built-in):
- Available everywhere without registration
- Includes: `timestamp`, `date`, `csv`, `int`, `float`, `boolean`, `json`
- Fallback when parser not found in scoped registry

**Resolution order:**
1. Check scoped registry (if synthesizer element exists)
2. Fall back to global registry
3. Throw error if not found in either

### Shadow DOM Syndication

Parser registries are scoped to synthesizer elements and apply to all shadow roots within that scope:

```html
<!-- Syndicator in document root -->
<be-hive>
    <script type="emc-parser" src="parser.js" parser-name="myParser"></script>
    <script type="emc" src="enhancement/emc.json" wait-for-parsers="myParser"></script>
</be-hive>

<!-- Component with shadow root -->
<my-component>
    #shadow
        <!-- Subscriber receives scripts from syndicator -->
        <be-hive></be-hive>
        
        <!-- Elements here can use the parser -->
        <div be-switched="...">Content</div>
</my-component>
```

**How it works:**
1. Parser script is syndicated to shadow root's be-hive
2. Parser is registered in the shadow root's scoped registry
3. EMC script is syndicated and waits for parser
4. Enhancements in shadow root have access to the parser

### Error Handling

**Parser loading errors:**

```html
<!-- Parser module fails to load -->
<script type="emc-parser" 
        src="broken-parser.js" 
        parser-name="broken"
        data-parser-error="Module not found"></script>
```

**Parser waiting timeout:**

```html
<!-- EMC script times out waiting for parser -->
<script type="emc" 
        src="my-enhancement/emc.json" 
        wait-for-parsers="missingParser"
        data-emc-error="Timeout waiting for parsers: missingParser"></script>
```

**Error messages include:**
- Which parser(s) are missing
- Which EMC script is waiting
- Suggestions to check parser-name and script order

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { MountObserver } from 'mount-observer/MountObserver.js';
        import { Synthesizer } from 'mount-observer/Synthesizer.js';
        
        // Define synthesizer element
        class BeHive extends Synthesizer {}
        customElements.define('be-hive', BeHive);
    </script>
</head>
<body>
    <!-- Syndicator with parser and enhancement -->
    <be-hive>
        <!-- Load complex parser -->
        <script type="emc-parser" 
                src="nested-regex-groups/parser.js" 
                parser-name="nestedRegexGroups"></script>
        
        <!-- Enhancement that uses the parser -->
        <script type="emc" 
                src="be-switched/emc.json" 
                wait-for-parsers="nestedRegexGroups"></script>
    </be-hive>
    
    <!-- Component using the enhancement -->
    <my-component>
        #shadow
            <be-hive></be-hive>
            
            <!-- This element will be enhanced -->
            <div be-switched="case1: /pattern1/ | case2: /pattern2/">
                Content
            </div>
    </my-component>
</body>
</html>
```

### Benefits

- **Lazy loading**: Load parsers only when needed
- **Framework isolation**: Different frameworks don't conflict
- **Declarative**: HTML-first approach with script tags
- **Flexible**: Supports both declarative and programmatic registration
- **Automatic**: Parser waiting handled by the framework
- **Scoped**: Each synthesizer has its own parser registry
- **Efficient**: Parsers are cached and reused

### Requirements

- Must import `mount-observer/handlers/EMCParserScript.js` for parser loading
- Must import `mount-observer/handlers/EMCScript.js` for EMC processing
- Must use a synthesizer element (be-hive, etc.) for scoped registries
- Parser modules must export a function as default export
- EMC scripts must specify `wait-for-parsers` attribute to wait for parsers

[Implemented as Scoped Parser Registry requirement](.kiro/specs/scoped-parser-registry-requirements.md)


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
- `'registry'` - Finds and observes all DOM nodes that have the same custom element registry
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
import { MountObserver } from 'mount-observer/MountObserver.js';
// This could cause issues if the importing module also imports MountObserver
```

## Media / container queries / instanceOf

Unlike traditional CSS @import, CSS Modules don't support specifying different imports based on media queries.  That can be another condition we can attach (and why not throw in container queries, based on the rootNode?):

```JavaScript
const observer = new MountObserver({
   // not supported by polyfill
   select: 'div > p + p ~ span[class$="name"]', 
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
[whereLocalNameMatches implemented as [RegularExpressionNameMatching](requirements/Done/RegularExpressionNameMatching.md)]

[withMediaMatching implemented as [Requirement6](requirements/Done/Requirement6.md)]

## Waiting for Custom Element Definitions

The `whenDefined` property allows you to wait for custom elements to be defined before mounting elements. This ensures that elements are only processed after their custom element definitions are available, preventing issues with undefined custom elements.

```javascript
const observer = new MountObserver({
    matching: 'my-element',
    whenDefined: 'my-element',  // Wait for my-element to be defined
    do: (element) => {
        console.log('my-element is now defined and mounted');
    }
});
observer.observe(document);

// Later, when the custom element is defined
customElements.define('my-element', class extends HTMLElement {
    // ...
});
```

**Waiting for multiple custom elements:**

You can specify an array of tag names to wait for all of them to be defined:

```javascript
const observer = new MountObserver({
    matching: 'my-element, another-element',
    whenDefined: ['my-element', 'another-element'],  // Wait for both
    do: (element) => {
        console.log('Both elements are defined, mounting:', element.localName);
    }
});
```

**How it works:**

1. The check happens first, before any other `where*` conditions
2. Uses `customElements.whenDefined()` for each specified tag name
3. Uses the `customElementRegistry` of the observed root node
4. Only checks once per observer instance (doesn't re-check on subsequent mounts)
5. The `observe()` method waits for all definitions before processing elements

**Common use cases:**

```javascript
// Lazy load and wait for custom element definition
const observer = new MountObserver({
    matching: 'my-button',
    whenDefined: 'my-button',
    import: './my-button.js',
    do: 'builtIns.defineCustomElement'
});

// Wait for dependencies before enhancing
const observer = new MountObserver({
    matching: '.needs-custom-elements',
    whenDefined: ['base-element', 'helper-element'],
    do: (element) => {
        // Safe to interact with custom elements now
        const base = element.querySelector('base-element');
        const helper = element.querySelector('helper-element');
    }
});
```

**AND condition logic:**

Like all `where*` properties, `whenDefined` forms an AND condition with other filters. However, it's checked first as a prerequisite before evaluating other conditions:

```javascript
const observer = new MountObserver({
    matching: 'my-element',
    whenDefined: 'my-element',           // Checked FIRST
    whereInstanceOf: HTMLElement,        // Then checked
    whereLocalNameMatches: /^my-/,       // Then checked
    do: (element) => { /* ... */ }
});
```

[whenDefined implemented as [SupportForWhenDefined](requirements/SupportForWhenDefined.md)]

## LocalName Pattern Matching

The `whereLocalNameMatches` property allows filtering elements by their `localName` using regular expressions. This is useful when you need to match elements based on naming patterns rather than CSS selectors.

```javascript
const observer = new MountObserver({
    matching: '*',  // Match all elements
    whereLocalNameMatches: /^my-/,  // Only mount elements starting with 'my-'
    do: (element) => {
        console.log('Mounted:', element.localName);
    }
});
observer.observe(document);
```

**String patterns are automatically converted to RegExp:**

```javascript
// These are equivalent
whereLocalNameMatches: 'button|input'
whereLocalNameMatches: /button|input/
```

**Common use cases:**

```javascript
// Match custom elements with a specific prefix
whereLocalNameMatches: /^app-/

// Match elements ending with a suffix
whereLocalNameMatches: /-widget$/

// Match multiple element types
whereLocalNameMatches: /^(button|input|select)$/

// Match elements containing a pattern
whereLocalNameMatches: /dialog/
```

**AND condition logic:**

Like all `where*` properties, `whereLocalNameMatches` forms an AND condition with other filters:

```javascript
const observer = new MountObserver({
    matching: '[data-enhanced]',           // Must have data-enhanced attribute
    whereLocalNameMatches: /^custom-/,     // AND localName starts with 'custom-'
    whereInstanceOf: HTMLElement,          // AND is an HTMLElement instance
    do: (element) => { /* ... */ }
});
```

This will only mount elements that satisfy ALL three conditions.

## Custom JavaScript Checks with shouldMount

The `shouldMount` property provides a final JavaScript-based check that runs after all declarative `where*` conditions have passed. This is useful for complex logic that can't be expressed declaratively.

It's useful to be able to provide this check outside of the do method for separation of concerns reasons, and also because the do function only gets called once, and having this extra check allows us to combine all the checks together in a consistent way.

```javascript
const observer = new MountObserver({
    matching: '.protected-feature',
    shouldMount: (el, ctx) => {
        // Check user permission
        const requiredRole = el.dataset.requiredRole;
        return currentUser.hasRole(requiredRole);
    },
    do: (el) => {
        // Only called if shouldMount returned true
        enhanceProtectedFeature(el);
    }
});
```

**Behavior:**
- `shouldMount` is called after ALL `where*` conditions pass
- If it returns `true`, the element mounts (do callback + mount event)
- If it returns `false`, the element does NOT mount (no do callback, no mount event)
- If it throws an error, it's treated as `false` and the error is logged
- The element can be re-evaluated if removed and re-added to the DOM

**Use Cases:**

Authorization checks:
```javascript
shouldMount: (el) => currentUser.hasPermission(el.dataset.permission)
```

Feature flags:
```javascript
shouldMount: (el) => featureFlags.isEnabled(el.dataset.feature)
```

Data validation:
```javascript
shouldMount: (el) => {
    return el.dataset.apiKey && 
           el.dataset.apiEndpoint && 
           el.dataset.apiKey.length > 0;
}
```

Complex conditional logic:
```javascript
shouldMount: (el, ctx) => {
    const parent = el.closest('[data-context]');
    if (!parent) return false;
    
    const isActive = parent.dataset.context === 'active';
    const widgetType = el.dataset.widgetType;
    const enabledWidgets = parent.dataset.enabledWidgets?.split(',') || [];
    
    return isActive && enabledWidgets.includes(widgetType);
}
```

**Note:** For event-driven mounting (waiting for user clicks, etc.), use the `do` callback with event listeners rather than `shouldMount`. The `shouldMount` callback is for checking conditions, not waiting for events.

[Implemented as SupportForShouldMount requirement](requirements/Done/SupportForShouldMount.md)

## InstanceOf checks in detail

Carving out the special "whereInstanceOf" check is provided based on the assumption that there's a performance benefit from doing so. If not, the developer could just add that check inside the "shouldMount" callback logic (discussed later).  For built-in elements, we can alternatively provide the string name, as indicated in the comment above, which certainly makes it JSON serializable, thus making it easy as pie to include in the MOSE JSON payload.  I don't think there would be any ambiguity in doing so, which means I believe that answers the mystery in my mind whether it could be part of the low-level checklist that could be done within the c++/rust code / thread.

The picture becomes murkier for custom elements.  The best solution in that case seems to be to utilize customElements.getName(...) as a basis for the match, but at first glance, that could  preclude being able to use base classes which a family of custom elements subclass, if that superclass isn't itself a custom element.  I suppose the solution to this conundrum, when warranted, is simply to burden the developer with defining a custom element for the superclass, and thus assigning it a name, applicable within ShadowDOM scopes as needed, even though it isn't actually necessarily used for any live custom elements. This would require already having imported the base class, only benefitting from lazy loading the code needed for each sub class, which might not always be all that high as a percentage, compared to the base class.

However, where this support for "whereInstanceOf" would be *most* helpful is when it comes to [*custom enhancements*](https://github.com/WICG/webcomponents/issues/1000) that only wish to lazily layer some heavy lifting functionality on top of certain families of already loaded and upgraded custom elements (possibly in addition to some (specified) built in elements).  Here, the lazy loading of the *entire custom **enhancement***, based on the presence in the DOM of a member of the family of custom elements, would, if my calculations are correct, result in providing a significant benefit. 
 

<!--

[TODO] Maybe should also (optionally?) pass back which checks failed and which succeeded on dismount.  Not sure I really see a use case for it, but leaving the thought here for now 

-->

## Custom Element Registry Matching

MountObserver automatically respects scoped custom element registry boundaries. When observing a root node, only elements that share the same `customElementRegistry` as the root node will be mounted by default. This is an implicit AND condition that applies to all observations.

Learn more about [scoped custom element registries in Chrome's blog post](https://developer.chrome.com/blog/scoped-registries).

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

**Registry matching logic:**

The implementation is straightforward - it compares the `customElementRegistry` property of the root node with the `customElementRegistry` property of each candidate element:

```javascript
const registriesMatch = rootNode.customElementRegistry === element.customElementRegistry;
```

**Default behavior** (same registry):
- Elements with matching registries → mount ✓
- Elements with different registries → don't mount ✓

**Inverted behavior** with `whereDifferentCustomElementRegistry: true`:
- Elements with matching registries → don't mount ✓
- Elements with different registries → mount ✓

**Use case for inverted matching:**
```javascript
// Mount elements from OTHER registries (cross-registry observation)
const observer = new MountObserver({
    matching: '.external-component',
    whereDifferentCustomElementRegistry: true,
    do: (el) => { /* Handle elements from different registries */ }
});
observer.observe(shadowRoot);
```

**Behavior across browser versions:**
- **Pre-Chrome 146**: Both `customElementRegistry` properties are `undefined`, so `undefined === undefined` is `true` and elements match (backward compatible)
- **Chrome 146+ with scoped registries**: Elements are filtered by registry reference equality

This ensures that when we observe a shadow root with a scoped registry, we won't accidentally mount elements from the parent document or other shadow roots with different registries (unless explicitly requested with `whereDifferentCustomElementRegistry: true`). The registry check happens automatically before any other `where*` conditions are evaluated.

[Implemented as [ExcludeMatchingElementsWhereCustomElementRegistriesDon'tMatch](requirements/ExcludeMatchingElementsWhereCustomElementRegistriesDon'tMatch.md)]

## Element Mount Extension

For even more convenience, we can use the `element.mount()` method to observe elements within their scoped custom element registry context. This is particularly useful with [scoped custom element registries](https://developer.chrome.com/blog/scoped-registries) (Chrome 146+, latest WebKit/Safari).

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

Browser support: Works in all browsers, but [scoped registry features](https://developer.chrome.com/blog/scoped-registries) require Chrome 146+ or latest WebKit/Safari.

[Implemented as CustomElementRegistryMounting requirement](requirements/Done/CustomElementRegistryMounting.md).

### Global Propagation with `mountGlobally()`

The `mountGlobally()` method extends `mount()` to automatically propagate mount observers across [custom element registry](https://developer.chrome.com/blog/scoped-registries) boundaries and shadow DOM scopes. This is useful for bootstrapping core handlers that should work everywhere, regardless of scoped registries.  It should be used sparingly, as a last resort, probably limited to things that should arguably be built into the platform.

```JavaScript
import 'mount-observer/ElementMountExtension.js';

// Mount globally - propagates to all child registries and shadow roots
await document.mountGlobally({
    matching: '.target',
    do: (el) => {
        el.setAttribute('data-mounted', 'true');
    }
});
```

The `mountGlobally()` method:
- Mounts the config in the current registry first (using `mount()`)
- Creates two propagators that automatically mount in:
  - Elements with different custom element registries (`whereDifferentCustomElementRegistry: true`)
  - Shadow roots within the same registry (custom elements with shadow DOM)
- Waits for custom elements to be defined before mounting (ensures shadow roots exist)
- Recursively propagates through nested shadow roots

This enables "viral" propagation of mount observers, perfect for bootstrapping core handlers like `builtIns.mountObserverScript`:

```JavaScript
// Bootstrap mount observer script support globally
await document.mountGlobally({
    do: 'builtIns.mountObserverScript'
});

// Now MOSE scripts work everywhere, even in scoped registries
```

Both `Element.prototype.mountGlobally()` and `ShadowRoot.prototype.mountGlobally()` are available.

[Implemented as goViral requirement](requirements/Done/goViral.md).

## Hierarchical Observer Composition with the `with` Property

The `with` property enables hierarchical composition of MountObservers, allowing a parent observer to declaratively create and manage multiple sub-observers that observe the same root node. This provides a clean way to organize complex observation scenarios and coordinate multiple observers.

### Basic Usage

```JavaScript
const observer = new MountObserver({
    matching: '.container',
    with: {
        // Sub-observer for custom elements
        registry: {
            matching: 'my-element',
            import: './my-element.js',
            do: 'builtIns.defineCustomElement'
        },
        // Sub-observer for styles
        styles: {
            matching: '.styled',
            import: './styles.css'
        }
    }
});

await observer.observe(document);
```

### How It Works

1. **Automatic Creation**: When the parent observer's `observe()` method is called, it automatically creates sub-observers for each entry in the `with` property.

2. **Same Root Node**: All sub-observers observe the same root node as the parent.

3. **Independent Configuration**: Each sub-observer operates independently with its own configuration. Sub-observers do NOT inherit properties from the parent.

4. **Automatic Lifecycle**: Sub-observers are automatically disconnected when the parent disconnects.

5. **Unlimited Nesting**: Sub-observers can have their own `with` property for unlimited nesting depth.

### Accessing Sub-Observers in Handlers

Sub-observers are accessible in mount handlers via the `context.withObservers` property:

```JavaScript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: { matching: 'custom-element' },
        styles: { matching: '.styled' }
    },
    do: (el, ctx) => {
        // Access sub-observers with type safety
        const registryObserver = ctx.withObservers?.registry;
        const stylesObserver = ctx.withObservers?.styles;
        
        if (registryObserver) {
            console.log('Registry observer:', registryObserver);
            console.log('Mounted elements:', registryObserver.mountedElements);
        }
    }
});
```

### Nested Sub-Observers

Sub-observers can have their own sub-observers, creating a tree structure:

```JavaScript
const observer = new MountObserver({
    matching: '.root',
    with: {
        level1: {
            matching: '.level1',
            with: {
                level2: {
                    matching: '.level2',
                    do: (el) => console.log('Level 2 mounted:', el)
                }
            }
        }
    }
});
```

### Use Case: Cross-Scope Registry Management

A practical use case is managing custom elements across different scoped registries:

```JavaScript
const observer = new MountObserver({
    matching: 'div[shadowroot]',
    with: {
        // Observe elements in the main registry
        mainRegistry: {
            matching: 'my-element',
            whereDifferentCustomElementRegistry: false,
            do: 'builtIns.defineCustomElement'
        },
        // Observe elements in shadow DOM registries
        shadowRegistry: {
            matching: 'shadow-element',
            whereDifferentCustomElementRegistry: true,
            do: 'builtIns.defineScopedCustomElement'
        }
    }
});
```

### Type Safety

When using TypeScript, the keys in the `with` property are inferred and provide autocomplete:

```TypeScript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: { matching: 'my-element' },
        styles: { import: './styles.css' }
    },
    do: (el, ctx) => {
        ctx.withObservers?.registry  // ✓ TypeScript knows this exists
        ctx.withObservers?.unknown   // ✗ TypeScript error
    }
});
```

### Key Benefits

1. **Declarative Composition**: Define complex observer hierarchies in a single configuration
2. **Automatic Lifecycle**: Sub-observers are created and cleaned up automatically
3. **Independent Operation**: Each sub-observer has its own configuration and state
4. **Type Safety**: Full TypeScript support with key inference
5. **Unlimited Nesting**: Create arbitrarily deep observer hierarchies

### Known Limitations

- **Circular References**: The library does not detect or prevent circular references in `with` configurations. Avoid configurations where observer A's `with` references observer B, and B's `with` references A, as this will cause a stack overflow.

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

The handler registry is global and shared across all MountObserver instances, similar to the global custom elements registry. Once a handler is registered, it can be used by any MountObserver instance in your application.

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
import { MountObserver } from 'mount-observer/MountObserver.js';

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


<!-- ##  Extra lazy loading

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
``` -->

 

## Subscribing

Subscribing can be done via:

```JavaScript
//[TODO] not implemented yet
observer.addEventListener('shouldMount', e => {
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
//[TODO]
observer.addEventListener('move', e => {
  ...
});
//[TODO]
observer.addEventListener('reconnect', e => {
  ...
});
//[TODO]
observer.addEventListener('reconfirm', e => {
  ...
});
//[TODO]
observer.addEventListener('exit', e => {
  ...
});
//[TODO]
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

## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule update --init --recursive
6. > npm install
7. > npm run serve
8. Open http://localhost:8000/ in a modern browser

## Running Tests

```
> npm run test
```

## Using from ESM Module:

```JavaScript
import {MountObserver} 'mount-observer/MountObserver.js';
```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.sh/mount-observer';
</script>
```
