# Dual Use Pattern

--- 
## Human Ask

There's a new feature that works in Chrome 150+ (beta) that I'm excited about:  https://raw.githubusercontent.com/WICG/declarative-partial-updates/refs/heads/main/patching-explainer.md  I'm thinking of creating another script handler to import html and stream it.  I'd like the same HTML file to be usable both as a standalone web page, but also as an include, that gets turned into a web component

---
## Kiro Response I

Fascinating. So `streamAppendHTMLUnsafe()` + `<template for="...">` with processing instructions (`<?start>`, `<?end>`, `<?marker>`) enables out-of-order HTML streaming into existing DOM targets — both during initial page load and programmatically via script.

Let me think about your use case: an HTML file that works both as a standalone page AND as an includable fragment that becomes a web component.

The key tension is:
- As a standalone page, the HTML has `<html>`, `<head>`, `<body>`, scripts, styles — the full document shell
- As an include/web component, you only want the meaningful content (maybe a specific fragment), plus you need it wrapped in a shadow root

Here's how I'd think about this with a handler:

**The dual-use pattern:**

```html
<!-- page.html — works standalone AND as include -->
<html>
<head>
    <style>/* component styles */</style>
</head>
<body>
    <main>
        <?start name="content">
        <h1>Hello World</h1>
        <p>This is the actual content</p>
        <?end>
    </main>
</body>
</html>
```

**As a web component include:**

```html
<my-page>
    <script type="stream-include" data-src="./page.html" data-select="content"></script>
</my-page>
```

The handler would:
1. `fetch('./page.html')` and stream the response
2. Use `streamAppendHTMLUnsafe()` on the element's shadow root (or create one)
3. The processing instructions let you target specific named ranges to extract
4. The result is a web component with the streamed content in its shadow DOM

**Alternatively**, without processing instructions (simpler, works today):

The handler could fetch the HTML, parse it with `DOMParser`, extract a selector, and stream/inject it into a shadow root. The declarative partial updates API would be an enhancement for progressive streaming.

**Questions to think about:**

1. **Shadow DOM or light DOM?** — If it becomes a web component, do you want the included content in shadow DOM (style isolation) or light DOM (participates in parent's selectors)?

2. **Style extraction** — When including as a component, do you want `<style>` and `<link>` elements from the page's `<head>` to be pulled into the shadow root?

3. **Streaming vs. full load** — `streamAppendHTMLUnsafe()` is genuinely streaming (content appears incrementally). Is that important, or is "fetch then inject" sufficient?

4. **Fallback for non-Chrome** — Since this is Chrome 150+ only, what's the degradation story? Fall back to `fetch` + `innerHTML`?

5. **The `for` attribute on `<template>`** — Would you use this to patch named regions inside the included component after initial load (e.g., lazy sections within the include)?

Want me to sketch out a handler design, or would you like to write up a requirements doc and iterate on it first?


---

# Human response I

Here's what I'm thinking.

Let's hold off on streaming until the api's are more mature.  Right now they don't seem to be there in Chrome Canary.  Hopefully it is coming very shortly.

```html
<!-- page.html — works standalone AND as include -->
<html>
<head>
    <style>/* component styles */</style>
</head>
<body>
    <my-page>
        <?marker name="content">
    </my-page>
    ...
    <template for="content">
        <script type="cede" data-extends="el-maker">{
            "assignFeatures": {
                "roundabout": {
                    "customData": {"template": "my-template"},
                    "withAttrs": {"base": "ra"},
                    "callbackForwarding": ["connectedCallback"]
                },
                "truthSourcer": {
                    "callbackForwarding": ["connectedCallback", "attributeChangedCallback"]
                }
            }
        }</script>
        <div>The actual content</div>
    </template>
</body>
</html>
```

**As a web component include:**

```html
<your-page>
    <script 
        type="html-include"
        src="./page.html" 
        data-content="content"
    ></script>
</your-page>
```

---

## Kiro Response II

This is a cleaner approach. The `<template for="content">` + `<?marker>` pattern means the included content is already structured for declarative partial updates — and the same HTML works standalone (the browser patches the template into the marker on initial parse).

Here's how I see the handler working:

**Handler: `builtIns.htmlIncludeScript`**

Matches: `script[type="html-include"][src]`

**Steps:**

1. Fetch `src` as text (not as a module — it's an HTML document)
2. Parse with `DOMParser` → get a full `Document`
3. Find the `<template for="[data-content value]">` in the parsed document
4. Extract the template's content (a `DocumentFragment`)
5. Inject into the parent element (light DOM or shadow root — TBD)

**Key design questions remaining:**

1. **Light DOM vs Shadow DOM injection** — Your example shows `<your-page>` receiving the content. Does the content go into:
   - Light DOM of `<your-page>` (replacing the script element)?
   - A shadow root on `<your-page>` (style isolation)?
   
   My instinct: light DOM, replacing the script element with the template fragment. This keeps it simple and lets parent CSS apply. Shadow DOM could be opt-in via an attribute like `data-shadow`.

2. **The cede script inside the template** — When the content is injected into `<your-page>`, the cede script lands in the DOM. If the `builtIns.cedeScript` handler is active (via Synthesizer or a parent observer), it'll pick it up and define `your-page` in the registry. This creates a nice bootstrapping pattern: the include *defines* the element it's being included into. Is that the intent?

3. **Timing / race condition** — If `<your-page>` is already defined (e.g., from a previous include or explicit registration), the cede script no-ops. But if it's *not* defined yet, the element won't have upgraded when the handler runs. The sequence would be:
   - `<your-page>` exists as an undefined element
   - Handler fetches page.html, injects content (including cede script)
   - Cede script fires, defines `your-page`, element upgrades
   
   This is fine — `connectedCallback` fires on upgrade. Just worth confirming this bootstrapping order is intentional.

4. **What about styles?** — The standalone page has `<style>` in `<head>`. When used as an include, those styles don't come along (we only extract the template content). Options:
   - Ignore (styles are the consuming page's responsibility)
   - A `data-styles` attribute that also extracts `<style>`/`<link>` from the source page's head
   - The base class (e.g., `el-maker`) handles its own styling via features
   
   I'm guessing the third option — the `assignFeatures` system handles styling concerns.

5. **`data-content` vs `data-select`** — Your example uses `data-content="content"` which maps to the template's `for` attribute value. This is cleaner than a CSS selector since it's specifically designed for the partial updates pattern. Good call.

6. **Fallback when declarative partial updates aren't supported** — In the standalone page case, if the browser doesn't support `<?marker>` + `<template for>`, the template just sits in the DOM unparsed (templates are hidden). The marker becomes a comment node. The page would show `<my-page>` empty. Do we care about pre-Chrome-150 standalone behavior, or is this Chrome-150+ only?

**When to implement:**

You mentioned holding off on streaming until APIs mature. For the non-streaming version, all the pieces exist today:
- `fetch()` + `DOMParser` for parsing the remote HTML
- `template.content` for extracting the fragment
- DOM injection (append/replace)

The only Chrome-150-specific part is the *standalone* behavior (the `<?marker>` + `<template for>` patching). The *include* behavior (fetching and injecting) works everywhere.

Want me to add this to the Synthesizer's script type list speculatively, or wait until you're ready to implement?

---

## Human Response II

You raise good questions, and it made me rethink things.  I guess I'm doing a total 180.

First, maybe the goal of supporting one html file that can serve both as a web component and as standalone web page is a big weak.  I can instead somewhat easily imagine a single *.mjs file that can define both, and run a build process to produce a standalone *.html file, and another file in some format that is optimized for streaming.

Second, I think we should hold off doing anything until streaming methods are added.  I actually have a library package [that does the streaming](https://raw.githubusercontent.com/bahrus/stream-orator/refs/heads/baseline/StreamOrator.ts).  It's a rather hefty file, and adds a dependency I'd rather hold off on as it appears so close for the platform to add better support, obviating the need for that package.

One of the trickiest things I'm afraid the platform won't add soon is the ability to elegantly add stream rewriting.  I have a [robust proposal for this](https://github.com/whatwg/dom/issues/1222) but in the absence of that, we might need to agree on one minimal processing instruction, like <?start> and <?end> to use to snip the stream into different pieces needed for the web component. What makes it particularly tricky is any processing instruction we come up with can span two chunks of the stream.

But something like below might be closer to what we want.



```html
<!-- web-component-stream.html -->

/*?start name="adopt"*/
.green {
    color: green;
}
/*?end*/

<?begin name="content">
    <div>The actual content</div>
<?end>
<?begin name="cede" data-extends="el-maker">{
        "assignFeatures": {
            "roundabout": {
                "customData": {"template": "my-template"},
                "withAttrs": {"base": "ra"},
                "callbackForwarding": ["connectedCallback"]
            },
            "truthSourcer": {
                "callbackForwarding": ["connectedCallback", "attributeChangedCallback"]
            }
        }
    
}<?end>
```

**As a web component include with no overrides:**

```html
<your-page>

    <template rel=cede-stream shadowrootmodeonload="open" src="my-import-map-base/web-component-stream.html"></template>
</your-page>
```

---

## Kiro Response III

The 180 makes sense. Trying to make one HTML file serve both roles adds complexity that a build step eliminates cleanly. And waiting for platform streaming support is pragmatic — `StreamOrator` is solid but it's a lot of code to maintain when `streamAppendHTMLUnsafe()` is around the corner.

### On the stream format

Your proposed format is interesting — it's essentially a lightweight multi-part document using processing instructions as section delimiters:

```
/*?start name="adopt"*/.../*?end*/     → CSS to adopt
<?begin name="content">...<?end>       → DOM fragment
<?begin name="cede" ...>...<?end>      → Element definition config
```

A few observations:

1. **CSS section uses comment-wrapped PIs** (`/*?start*/.../*?end*/`) — clever. This means the file is valid CSS if you only look at the `adopt` section in isolation. But in a streaming context, the parser would need to handle the `/*` wrapping specially. Is the intent that:
   - The stream rewriter strips the `/*` and `*/` to expose the PIs?
   - Or the handler recognizes this convention directly (CSS sections are always comment-wrapped PIs)?

2. **`<?begin>` vs `<?start>`** — The WICG proposal uses `<?start>` and `<?end>`. Your example uses `<?begin>`. Is this intentional (to avoid collision with the platform's patching semantics) or just a typo?

3. **The `cede` section carries attributes** — `<?begin name="cede" data-extends="el-maker">`. This relies on the proposed `getAttribute`/`setAttribute` API for `ProcessingInstruction` (whatwg/dom #1454). Until that ships, you'd need to parse the `data` string manually. Doable, but worth noting.

4. **PI spanning chunk boundaries** — You flagged this as the tricky part. A `<?begin name="content">` could arrive split across two chunks (e.g., `<?beg` + `in name="content">`). The stream rewriter needs a small state machine or buffering strategy for incomplete PIs. This is solvable (buffer when you see `<?` until you hit `>`) but it's the one piece that needs careful implementation.

### On the `<template>` include syntax

```html
<template rel=cede-stream shadowrootmodeonload="open" src="..."></template>
```

This is a nice evolution:
- `rel=cede-stream` — signals the handler what kind of include this is
- `shadowrootmodeonload="open"` — declaratively says "create a shadow root and stream into it"
- `src` — the stream source

**Questions on this:**

1. **Why `<template>` instead of `<script type="...">`?** — The other handlers use script elements. Using template makes semantic sense (it *is* content that will become DOM), and avoids the script-execution-on-clone issues. But it breaks the pattern of Synthesizer broadcasting `script[type=...]` elements. Would Synthesizer need to learn about `template[rel=cede-stream]` too?

2. **`shadowrootmodeonload`** — This isn't a standard attribute. Is the intent to mirror `shadowrootmode` (from declarative shadow DOM) but defer attachment until the stream loads? So:
   - Parser sees `<template rel=cede-stream shadowrootmodeonload="open">` 
   - Does NOT immediately create a shadow root (unlike `shadowrootmode`)
   - Handler fetches, streams, then attaches the shadow root with the streamed content
   
   This makes sense — you don't want an empty shadow root blocking light DOM rendering before the stream arrives.

3. **"No overrides"** — You labeled the example "with no overrides." Does this imply there'll be a way to override sections of the stream? E.g., locally providing a different `adopt` section or patching the `content`? That would tie back nicely to the declarative partial updates `<template for="...">` pattern.

### Recommendation: wait, but document the format

I agree we should hold off implementation. But I'd suggest:

1. **Pin down the stream format** — The multi-section PI-delimited format is the core design decision. Getting that right now (section naming conventions, CSS wrapping strategy, attribute encoding in PIs) will make implementation straightforward when streaming APIs land.

2. **Prototype the non-streaming path** — Once the format is agreed, a `fetch` + manual parse version could serve as the initial implementation and fallback, with streaming as a progressive enhancement when `streamAppendHTMLUnsafe()` is available.

3. **The stream rewriting concern** — Your [whatwg/dom #1222 proposal](https://github.com/whatwg/dom/issues/1222) for stream transforms is the elegant long-term solution. In the interim, the handler could do the splitting in JS after fetch (parse the full response, extract sections by PI names). Not streaming, but functional.

Want me to document this stream format as a separate spec/format document, or keep iterating here?
