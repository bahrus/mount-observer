# Inversion of dependency

---

## Human Ask

The [synthesizer functionality](/README.md#syndicating-mount-observers-with-synthesizer) [works](/Synthesizer.ts) by syndicating enhancements down through shadow DOM.  But it requires a root level element to manage the flow.  So the markup looks like:

```html
<be-hive>
    <script type=emc-parser 
            src="be-hive/parsers/parse-grouped-capture-statements.js" 
            parser-name=parse-grouped-capture-statements></script>
    <script type=emc 
            src="be-bound/🪢.json" 
            wait-for-parsers=parse-grouped-capture-statements></script>
</be-hive>
<input id=alternativeRating type=number>
<form 🪢='between ?.rating?.value@change and #alternativeRating.'>
    <div part=rating-stars class="rating__stars">
        <input id="rating-1" class="rating__input rating__input-1" type="radio" name="rating" value="1">
        <input id="rating-2" class="rating__input rating__input-2" type="radio" name="rating" value="2">
        <input id="rating-3" class="rating__input rating__input-3" type="radio" name="rating" value="3">
        <input id="rating-4" class="rating__input rating__input-4" type="radio" name="rating" value="4">
        <input id="rating-5" class="rating__input rating__input-5" type="radio" name="rating" value="5">
    </div>  
</form>
```

So here's the problem.  What if a web component has a dependency on one or more such enhancements.  How can it carefully "bootstrap" itself by pushing the be-hive element up, if needed?

For example:

Suppose we import a web component via a url, which streams in HTML.  The HTML looks like this:

```html
<html>
    <head>
        ...
    </head>
<!-- Streamed in --->
<scratch-box>
    <template shadowrootmode=open>
        <style adopt>
        </style>
        <form itemscope class="checkbox-wrapper">
            <!--  length of the path is 270px -->
            <input 🪢 name=${value} type="checkbox" id="option"/>

        </form>
        <be-hive>
            <template data-dest="rootSyn">
                <script type=emc-parser 
                        src="be-hive/parsers/parse-grouped-capture-statements.js" 
                        parser-name=parse-grouped-capture-statements></script>
                <script type=emc 
                        src="be-bound/🪢.json" 
                        wait-for-parsers=parse-grouped-capture-statements></script>
            </template>
            <template data-dest="head">
                <link rel=stylesheet href="https://fonts.googleapis.com/css?family=Indie+Flower">
            </template>
        </be-hive>

    </template>
</scratch-box>
```

What this does:

1.  The Synthesizer custom element looks for all templates with attribute data-dest.  It removes them from the children of be-hive, but hold on to them in memory for what happens below (note:  there is a chance that it won't find them all at first because the HTML is streamed in -- how to deal with that?)
2.  If data-dest=rootSyn, it:
    1.  Searches for element at document root matching the name of the parent.  If not found, creates one.
    2.  For each element inside the template, searches for a matching script in the root synthesizer element, based on matching attributes.  If non founds, inserts it.
3.  If data-dest=head
    1.  For each child inside the template, searches the head element for an element matching the attributes and tag name.
    2.  If not found, inserts the element.

## Implementation Suggestion

As far as implementing "searches the head element for an element matching the attributes and tag name", this is very similar to functionality found in [HTMLInclude](/handlers/HTMLInclude.ts).  I wonder if a reusable, exportable module function could be created and shared by both use cases.

---

## Codex Response I

The important inversion is that a component should be able to *declare* the ambient resources it needs without assuming that it owns, or is rendered beneath, the singleton that installs them.  `be-hive` can therefore act as a request collector and reconciler: a streamed component contributes desired resources, while the document-level synthesizer decides whether and where they are installed.

For streamed HTML, prefer treating each `data-dest` template as an independently processable contribution.  A `MutationObserver` on the local `be-hive` (or a short-lived observer while its stream is active) can pick up templates that arrive after upgrade.  Remove/process a template only after its children are complete enough to be useful, and make reconciliation idempotent so that seeing the same contribution more than once is harmless.

The matching key should be explicit rather than a general CSS selector synthesized from every attribute.  For example, scripts may be keyed by `tagName + type + src + parser-name`, stylesheets by `tagName + rel + href`, and inline resources by a caller-supplied stable key such as `data-resource-key`.  This avoids accidental deduplication of two genuinely different inline scripts and avoids selector-escaping problems.

It may be useful to separate this into three small responsibilities:

1. `collectContributions(beHive)` extracts and observes `data-dest` templates.
2. `resolveDestination(contribution, host)` maps `rootSyn`, `head`, and future destinations to their target nodes, creating the root synthesizer only when needed.
3. `reconcile(target, resources)` checks the destination's registry/DOM and inserts missing resources in a deterministic order.

The reconciler should record ownership or provenance, for example `data-synthesized-by` plus a contribution key.  That gives a future unload/disconnect path a way to remove resources safely only when no remaining component contribution needs them.  It also makes diagnostics much clearer when two components request incompatible versions of the same resource.

Finally, promoting arbitrary markup to `document.head` or a root-level synthesizer crosses a trust boundary.  Limit supported tags and attributes, preserve a documented insertion order, and decide whether external URLs must satisfy an allowlist, same-origin rule, nonce, or integrity policy.  The mechanism is especially valuable for declarative shadow DOM, but it should not turn every streamed component into an unrestricted document-level script injector.

---

## Human Response I

I think we can limit the allowed tags to empty (no inner content) script tags with src attributes that don't allow "//" to avoid cross domain, same-origin url's, and also link rel=stylesheet, with arbitrary href.  Do you think this is sufficient to maintain a trust boundary?

---

## Codex Response II

Not quite.  Restricting executable scripts to external, same-origin URLs is a strong and sensible baseline, but rejecting the substring `"//"` is not a reliable origin check.  Resolve `src` with `new URL(value, document.baseURI)` and require `url.origin === location.origin`; this correctly handles absolute, relative, protocol-relative, encoded, and unusual-but-valid URL forms.  Also reject non-HTTP(S) schemes explicitly and decide whether the path must fall under a controlled asset prefix.  Same-origin is only a meaningful trust boundary if untrusted parties cannot upload or otherwise control JavaScript at that origin.

For a script contribution, I would allow only `script[src]` with no child nodes, require an expected `type` (or omit it and use the browser default deliberately), and copy a small allowlist of attributes such as `src`, `type`, `parser-name`, `wait-for-parsers`, `integrity`, `crossorigin`, and `referrerpolicy`.  In particular, do not blindly copy event-handler attributes, `nonce`, or arbitrary `data-*` attributes merely because the element is otherwise allowed.

`link rel=stylesheet` with an arbitrary `href` is a different boundary: it permits third-party network requests and imports CSS that can affect the whole document.  It cannot directly execute JavaScript in modern browsers, but it can still introduce tracking, availability, visual-integrity, and policy risks.  If that is intentional, call it an explicit capability rather than a same-origin-safe default.  A conservative default would apply the same origin check to stylesheets; an opt-in external stylesheet rule could require an allowlisted origin and, where practical, `integrity` plus `crossorigin`.

One further distinction matters: an external stylesheet promoted to `document.head` is document-global, whereas the component's adopted stylesheet is shadow-scoped.  The former should be reserved for resources that are truly shared (for example, a font provider); otherwise the component should keep styling inside its shadow root.  A `data-dest=head` template may therefore be best treated as a narrowly defined shared-resource manifest, not as a general-purpose head injection mechanism.

---

## Human Response II

Really for the script src, I want them to all be bare import specifier paths, and have to match a lhs in an importmap.  That would be the "allowlist", along with documenting recommended CSP settings.  Is that getting closer or further away from maintaining a trust boundary?

Can a similar approach, using importmaps, be used for font references?  My understanding is that font stylesheets cannot be imported into the adopted stylesheet, it simply doesn't work, which is why I am seeking this feature.  Am I wrong?  Is it possible to import such fonts only into the shadow root?

---

## Codex Response III

That is closer, and it makes the capability model much clearer: a component may request a named module, while the application—not the component—chooses the URL that name resolves to.  The import map becomes an application-owned allowlist, and CSP supplies a useful second, browser-enforced boundary.  Do not permit a streamed component to add to or replace that import map.

There is one important browser distinction: an import map resolves *module import specifiers* (`import 'name'`, `import('name')`, and imports within a module); it does not resolve the `src` attribute of an ordinary script element.  Thus `<script src="my-bare-specifier">` will not acquire the desired import-map meaning.  The declarative contribution should instead carry a module name, for example `data-module="be-bound/ðŸª¢"`, and the trusted synthesizer should load it via `import(moduleName)` (or translate it into its own trusted module-loading mechanism).  For the existing non-module `type=emc` scripts, it is worth deciding explicitly whether they are modules, data resources, or instructions to another loader; only the module case gets import-map resolution automatically.

The allowed name should be checked against the map the application installed, ideally with a small namespace policy as well (for example, only `be-*` specifiers).  This prevents a component from using a name that happens to be mapped for a different application purpose.  CSP can then constrain `script-src` to the application origin and required nonces/hashes, but it is defense in depth—not a substitute for refusing arbitrary resource URLs at this API boundary.

Import maps do not apply to CSS `href`, `@import`, or `url()` values, so they cannot provide the corresponding font allowlist.  A normal `<style>` element in a shadow root may use CSS `@import`, and a `<link rel="stylesheet">` may also be placed directly in a shadow root; either route can fetch a font stylesheet and use the resulting font in that component's styles.  The latter is a better fit when the stylesheet is remote and you do not want its contents inline.  It still needs a URL/origin allowlist and an appropriate `style-src` / `font-src` CSP policy.

Your adopted-stylesheet observation is correct for the common constructable-stylesheet path: `CSSStyleSheet.replaceSync()` / `replace()` do not load `@import` rules, so a font-provider stylesheet cannot reliably be pulled into an adopted sheet that way.  A shadow-root `<link>` is therefore a reasonable narrowly-scoped escape hatch.  It keeps selector application in that shadow tree; however, treat font-family naming and font fetches as potentially shared browser resources, not as a security isolation mechanism.  A tiny dedicated component API such as `<link rel="stylesheet" data-dest="shadow" data-font-provider>` would make that exceptional capability visible and auditable.

---

# Human Response III

I went ahead and implemented this manually by:

1.  Tightening the security around allowed paths with script handlers.
2.  Defining a FontFace Custom Element Feature.
3.  Enabling minimal passing of child script handlers into the root syndicator

The logic I added is in [Synthesizer.ts](/Synthesizer.ts), lines 222-228.
 
