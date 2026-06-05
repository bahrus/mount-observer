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

