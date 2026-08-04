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
