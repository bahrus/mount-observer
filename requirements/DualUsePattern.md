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