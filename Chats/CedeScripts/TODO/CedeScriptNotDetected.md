# Cede Script Not Detected

--- 

## Human Ask

I have a complex project that isn't working properly.

If it isn't quickly obvious why it isn't working, please report as such, and I will add this module into the complex project so console.log's can be added if that helps.

The project has a [synthesizer element](../../../Synthesizer.ts), <be-hive> in the body element.  As such, it should have an active [cede script handler](../../../handlers//CedeScript.ts) ever on the watch out, with the help of a mount observer, I think for ced escripts:

```html
<script type=cede src=...>
```

And that is in fact working when the initial HTML has such a tag.

But to rectify a timing issue, the tag starts out as a "precede" script:

```html
<script type=precede src=...>
```

which then gets programmatically changed to the former.

In this scenario, the cede script isn't getting picked up.

Any theories why?  Is it easy to fix?

## Findings

## Investigation: Cede script not detected after `type` change

The cause is clear from reading the code. **`MountObserver` only watches for nodes being added or removed, not for attribute changes.** When a script's `type` changes from `precede` to `cede`, no new element is inserted, so the observer never re-evaluates the selector.

### Where the bug lives

In `MountObserver.ts:478-481` the shared mutation observer is configured with only `childList`:

```javascript
const observerConfig: MutationObserverInit = {
    childList: true,
    subtree: true
};
```

And the callback at `MountObserver.ts:456-476` only handles `mutation.type === 'childList'`. Attribute mutations are ignored.

`CedeScriptHandler` matches the selector `script[type="cede"][data-extends]` (`handlers/CedeScript.ts:40`). A `<script type="precede">` does not match, so it is ignored on initial scan. When the attribute is flipped to `cede`, the observer never notices, so `#processNode()` is never called for that element.

### Secondary wrinkle in `Synthesizer.ts`

If the `precede` script lives inside a shadow-root subscriber rather than the document body, there is a second gap. The Synthesizer's syndicator only forwards scripts whose `type` is already one of `mountobserver`, `emc`, `emc-parser`, or `cede` (`Synthesizer.ts:175`, `231`). A `type="precede"` script in a subscriber is never sent up to the syndicator, and its own mutation observer (`Synthesizer.ts:183-201`) also ignores attribute changes.

### Likely fix

The minimal fix is in `MountObserver.ts`:

1. Add `attributes: true` to `observerConfig` (possibly with an `attributeFilter` derived from the `matching` selector, or simply all attributes).
2. In the mutation callback, when `mutation.type === 'attributes'`, re-test the target element:
   - If it is not yet in `#processedDoForElement` and now matches, call `#processNode(target)`.
   - If it was processed and no longer matches, call `#handleRemoval(target)` to dismount/clean up.

That would make `<script type="precede">` → `<script type="cede">` detectable.

### Recommendation

This looks like a straightforward, targeted fix in `MountObserver.ts`. Before I write the patch, one question:

> Do you want me to implement the attribute-mutation handling in `MountObserver.ts` directly, or would you prefer I first add `console.log` probes to the complex project to confirm the theory in your actual runtime?

---

## Human Response

Please add to the Agents.md file to keep conversations going in the Chat *.md rather than the chat window.

Please implement the attirubte-mutation handling, and if it doesn't work, I'll have us go the second route.

---

## Implementation Results

Implemented attribute-mutation handling in `MountObserver.ts`.

### Changes made

**`MountObserver.ts`**

- Added `attributes: true` to the shared `MutationObserverInit` config (`MountObserver.ts:478-482`).
- Extended the mutation callback to handle `mutation.type === 'attributes'`:
  - Collects any already-mounted elements in the changed subtree that no longer match, and dismounts them via `#handleRemoval()`.
  - Calls `#processNode()` on the changed subtree so newly matching elements are mounted.

This means a `<script type="precede">` that is flipped to `<script type="cede">` will now be re-evaluated against the cede script handler's selector `script[type="cede"][data-extends]` and processed.

**`AGENTS.md`**

- Added a "Communication Conventions" section noting that multi-turn investigations should continue in the relevant `Chats/**/*.md` file rather than the chat window.

**`tests/attribute-mutation-test.html` + `tests/attribute-mutation-test.spec.mjs`**

- Added a regression test: an element without a matching attribute is changed to have one, and the mount callback is verified to fire.

### Verification

- `tsc` compiled cleanly.
- Full test suite: **317 passed** (314 existing + 3 new) across Chromium, WebKit, and Firefox.
- New attribute-mutation test passes on all three browsers.

### Next step

Try the scenario in your complex project. If the cede script is inside a shadow-root subscriber rather than the document body, the `Synthesizer.ts` syndicator may also need attribute-mutation support — but the document-body case should now work.

