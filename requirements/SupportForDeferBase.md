# Support for defer-[base]

---

## Human Ask

[id generation](https://github.com/bahrus/id-generation) is one of several scenarios where we need to do some prior work before an enhancement should be activated:

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
<div itemscope>
    <label>
        LHS: <input data-id={{lhs}}>
    </label>

    <!-- not the last streamed child of the closest [itemscope] ancestor
     but use at your own risk, since the element below may not have streamed
     in before the id generating begins
     -->
    <template -id defer-🎚️ 🎚️='on if isEqual, based on #{{lhs}} and #{{rhs}}.'>
        <div>LHS === RHS</div>
    </template>
    
    <label for=rhs>
        RHS: <input data-id={{rhs}}>
    </label>
    

</div>
```

The question is should assign-gingerly be responsible for blocking enhancements from being activated when defer-[base] attribute is present?  It adds another asynchronous wrinkle to what we've tried to keep as synchronous as possible (but there are other exceptions).

The other alternative is that all the enhancements that want to honor the defer-[base] be provided a common mechanism by which the enhancement can be notified when the defer-[base] attribute has been removed.



---

## Assign-gingerly's Kiro's Comments

### Should assign-gingerly own this?

I'd lean toward **no** — this feels like mount-observer's responsibility, not assign-gingerly's. Here's my reasoning:

**assign-gingerly's role** is property assignment, dependency injection, and feature wiring. It doesn't observe the DOM, watch for attribute changes, or manage element lifecycle timing. It's a synchronous (mostly) utility that operates on objects when called.

**mount-observer's role** is DOM discovery — deciding *when* to spawn/attach enhancements based on element presence, attributes, and conditions. `defer-[base]` is fundamentally a "don't attach yet" signal — that's a discovery/timing concern, not an assignment concern.

If assign-gingerly starts checking for `defer-*` attributes in its getter or during `assignFeatures`, it takes on DOM observation responsibility that doesn't belong to it. It would also mean the feature getter (currently synchronous for sync spawns) would need to become async or return undefined conditionally, breaking the clean "access = spawn" contract.

### The alternative: provide a utility, not enforcement

What assign-gingerly *could* provide is a small utility that enhancements use to honor `defer-[base]`:

```javascript
import { whenDeferRemoved } from 'assign-gingerly/deferSupport.js';

class MyEnhancement {
    constructor(element, ctx) {
        const { baseAttr } = ctx.config.withAttrs;
        // Returns immediately if no defer-[base] attribute exists
        // Otherwise returns a Promise that resolves when it's removed
        this.ready = whenDeferRemoved(element, baseAttr);
    }

    async activate() {
        await this.ready;
        // Now safe to proceed
    }
}
```

The utility would:
1. Check if `defer-${base}` attribute exists on the element.
2. If not, resolve immediately (or return `undefined`).
3. If yes, set up a `MutationObserver` (or use mount-observer's infrastructure) to watch for its removal, and return a Promise.

### But even that might belong in mount-observer

mount-observer already has the DOM observation infrastructure. It could:
- Simply not spawn the enhancement while `defer-[base]` is present.
- Spawn it once the attribute is removed (same as how it spawns on attribute appearance).

This is purely a "when to mount" decision — exactly what mount-observer does.

### What assign-gingerly could reasonably provide

If you want *something* in assign-gingerly for this, I'd suggest the lightest possible touch:

**Option A: A `deferAttr` field on `EnhancementConfig`**

```javascript
registry.push({
    baseAttr: '🎚️',
    spawn: SliderEnhancement,
    deferAttr: 'defer-🎚️'  // mount-observer checks this before spawning
});
```

This is just metadata — assign-gingerly stores it on the config, mount-observer reads it. No behavior change in assign-gingerly itself.

**Option B: A `canSpawn` static method (already exists!)**

Looking at the existing types, `EnhancementConfig.spawn` already supports `canSpawn`:

```typescript
export type Spawner<T = any, Obj = Element> = {
    new (obj?: Obj, ctx?: SpawnContext<T>, initVals?: Partial<T>): T;
    canSpawn?: (obj: any, ctx?: SpawnContext<T>) => boolean;
}
```

The enhancement class can define:

```javascript
class SliderEnhancement {
    static canSpawn(element, ctx) {
        const base = ctx.config.withAttrs?.base;
        return !element.hasAttribute(`defer-${base}`);
    }
}
```

mount-observer (or `enh.get()`) already checks `canSpawn` before spawning. This means **defer support already works** — the enhancement just needs to implement `canSpawn` to check for the defer attribute.

The missing piece: re-checking when the defer attribute is removed. That's a mount-observer concern (re-evaluate the element when attributes change).

### My recommendation

1. **Don't add defer logic to assign-gingerly's core.** Keep it synchronous and DOM-unaware.
2. **Document the `canSpawn` pattern** for enhancements that want to honor defer.
3. **Let mount-observer handle re-evaluation** — when `defer-[base]` is removed, mount-observer should re-check the element and allow spawning.
4. **Optionally** add a `deferAttr` metadata field to `EnhancementConfig` that mount-observer can read, so the defer attribute name is declarative rather than hard-coded in `canSpawn`.

This keeps the separation of concerns clean: assign-gingerly provides the data model, mount-observer provides the timing.

---

## Mount-observer's Kiro's Comments

I agree with the assign-gingerly Kiro's analysis. This belongs in mount-observer. Here's how I see it fitting into the existing architecture:

### The current state of play

1. **MountObserver only watches `childList` + `subtree`** — it does NOT observe attribute changes. This means today, if an element has `defer-🎚️` removed, mount-observer won't notice.

2. **The `nudge` function** already exists in this repo. It handles the "remove `defer-*` by decrementing a counter" pattern. When `nudge(el, 'defer-🎚️')` is called, it either removes the attribute (if counter is 0 or 1) or decrements it. This is the signal that "prior work is done."

3. **The id-generation handler** (GenIds) calls `genIds(mountedElement, rootNode)` which processes `defer-*` attributes — it resolves `#{{id}}` references in the deferred attribute's value, then calls `nudge` to remove the `defer-*` attribute.

### The problem

The flow today is:
1. Element streams in with both `-id` and `defer-🎚️` attributes
2. GenIds handler fires (matches `[-id]`), generates IDs, resolves references in the `🎚️` attribute value, removes `defer-🎚️`
3. The EMC observer for `🎚️` should now spawn the enhancement... but it already tried and either:
   - **Skipped it** (because `canSpawn` returned false due to `defer-🎚️` being present), OR
   - **Never re-evaluates** (because mount-observer doesn't watch attribute changes)

### Two approaches for mount-observer

**Approach A: Attribute observation (reactive)**

Add optional attribute watching to MountObserver. When `defer-[base]` is removed, re-evaluate the element:

```typescript
const observer = new MountObserver({
    matching: '[🎚️]',
    observeAttributes: ['defer-🎚️'],  // New: watch for changes to this attr
    do: 'builtIns.enhanceMountedElement'
});
```

This would require adding `attributes: true` + `attributeFilter` to the MutationObserver config. The downside: it couples the observer config to knowing about defer attributes, and adds complexity to the shared observer.

**Approach B: Nudge-based re-evaluation (imperative)**

Since `nudge` already removes the attribute, the simplest approach is: when `nudge` removes a `defer-*` attribute, it dispatches a signal that mount-observer can pick up. This could be:

- A custom event on the element (`defer-resolved`)
- A direct call to re-evaluate the element against active observers
- Simply removing-and-re-adding the base attribute (forces re-matching)

The `nudge` function already lives in this repo. It could dispatch a lightweight event:

```typescript
export function nudge(el: Element, attr: string | Array<string> = 'disabled') {
    const attrs = arr(attr);
    for(const attr of attrs){
        const da = el.getAttribute(attr);
        if (da !== null) {
            if (da.length === 0 || da === "1") {
                el.removeAttribute(attr);
                if(attr === 'disabled') (el as any).disabled = false;
                // Signal that a defer was resolved
                if(attr.startsWith('defer-')) {
                    el.dispatchEvent(new Event('defer-resolved', { bubbles: false }));
                }
            } else {
                el.setAttribute(attr, (parseInt(da) - 1).toString());
            }
        }
    }
}
```

But this still requires something to *listen* for that event.

**Approach C: The `shouldMount` + re-evaluation pattern (cleanest)**

The existing `shouldMount` mechanism already supports "not yet, check again later." When `shouldMount` returns `false`, the element is removed from `#processedDoForElement`, meaning it CAN be re-checked. The missing piece is: what triggers the re-check?

If GenIds (or any "prior work" handler) could tell the observer "hey, re-process this element," the existing infrastructure handles the rest:

```typescript
// In GenIds handler, after removing defer-* attributes:
context.observer.reprocess(element);  // New method
```

This `reprocess` method would simply remove the element from `#processedDoForElement` and call `#handleMatch(element)` again. The enhancement's `canSpawn` (or a `shouldMount` check) would now pass since `defer-*` is gone.

### My recommendation

**Approach C** is the cleanest:

1. Add a `reprocess(element)` method to `IMountObserver` / `MountObserver`
2. GenIds (and any future "prior work" handler) calls `context.observer.reprocess(element)` after completing its work
3. Enhancements use `canSpawn` to check for `defer-*` — this already works
4. On reprocess, `canSpawn` returns `true`, enhancement spawns

This requires:
- One new public method on MountObserver (~5 lines)
- GenIds handler needs access to the relevant sub-observer to call reprocess on it

**The sub-observer access problem:** GenIds runs on its own observer (matching `[-id]`). The enhancement observer (matching `[🎚️]`) is a different observer. GenIds doesn't have a reference to it.

**Solution:** Use the `with` property. If both observers are sub-observers of a parent, GenIds can access the sibling via `context.withObservers`:

```javascript
document.mount({
    with: {
        ids: { matching: '[-id]', do: 'builtIns.generateIds' },
        slider: { matching: '[🎚️]', do: 'builtIns.enhanceMountedElement' }
    }
});
```

Or, more practically: GenIds doesn't need to know about the specific sibling observer. It just needs to signal "this element is ready." The simplest signal is **removing the attribute** — which it already does. The question is just how to make the other observer notice.

### Actually, the simplest answer

After thinking through all of this... the most pragmatic solution might be:

**GenIds removes `defer-🎚️`. Then it also removes and re-adds the `🎚️` attribute (or just sets it to itself).**

This triggers a mutation if any observer is watching attributes. But wait — we're not watching attributes.

**OK, true simplest:** GenIds could *re-append* the element (remove from DOM + re-insert). This triggers the childList mutation that mount-observer IS watching, causing re-evaluation. But this is hacky and has side effects (resets focus, fires disconnected/connected callbacks, etc).

### Final recommendation

I think we need **Approach C** with a slight twist:

1. Add `reprocess(element: Element): void` to MountObserver's public API
2. Export a utility function from mount-observer that finds all active observers on a root node and calls reprocess:

```typescript
// mount-observer/reprocess.js
export function reprocessElement(element: Element): void {
    // Find all observers registered on this element's root
    // Call reprocess(element) on each
}
```

3. GenIds imports and calls `reprocessElement(child)` after removing defer attributes

This avoids needing observer-to-observer coordination, keeps GenIds decoupled, and uses mount-observer's existing "skip processed → re-allow" infrastructure.

### Questions for you

1. Is the `canSpawn` pattern the right gate, or would you prefer `shouldMount` on the observer config? (`canSpawn` is per-enhancement, `shouldMount` is per-observer — different granularity)

2. Should `reprocess` re-run ALL matching logic (including re-fetching imports), or just re-check and call `do`? I'd say the latter — imports are already loaded.

3. Is there a universe where multiple "prior work" steps need to complete before an enhancement spawns? (e.g., both id-generation AND some template processing). If so, the counter pattern in `nudge` already handles this — `defer-🎚️="2"` means "two pieces of prior work remain."

---

## Human Response I

I would like to propose a variation of Option C:

First, I think this module would make a usesful utility in its own right:

```JavaScript
// awaitAttrRemoval.js

export function awaitAttrRemoval(el: Element, attr: string): Promise<void> {

}
```

This function would, in totally loosely coupled way, add a minimal mutation observer, filtering on that attribute, and wait for the attribute to go away before resolving the promise.

Then the builtIns.enhanceMountedElement, before calling 

```JavaScript
this.#spawnEnhancement(mountedElement, registryItem, context);
```

would check if withAttrs is present, if it has a base attribute, and if defer-[base] attribute exists, and if so asynchronously load awaitAttrRemoval and await awaitAttrRemoval.  I wonder though if we need similar support in EMCScript.ts?  I can't recall if those are two separate ways that mount-observer uses to support activating enhancements, or if one passes through the other?

---

## Kiro Response II

### `awaitAttrRemoval` utility — yes, clean and reusable

I like this. A standalone utility that knows nothing about mount-observer, enhancements, or the id-generation system. Pure DOM primitive:

```typescript
// awaitAttrRemoval.ts
export function awaitAttrRemoval(el: Element, attr: string): Promise<void> {
    // If attribute already gone, resolve immediately
    if (!el.hasAttribute(attr)) return Promise.resolve();

    return new Promise(resolve => {
        const mo = new MutationObserver((mutations, observer) => {
            if (!el.hasAttribute(attr)) {
                observer.disconnect();
                resolve();
            }
        });
        mo.observe(el, { attributes: true, attributeFilter: [attr] });
    });
}
```

Minimal footprint, no dependencies, disconnects immediately on resolution. Good code-splitting candidate since it's only loaded when a defer attribute is actually present.

### EMCScript vs EnhanceMountedElement — are they separate paths?

**Yes, they are two separate spawn paths.** They do NOT pass through each other:

- **`EnhanceMountedElement`** — Used with `import` + `do: 'builtIns.enhanceMountedElement'`. Searches the imported module for an export with a `spawn` property, then calls `element.enh.get(registryItem, context)`.

- **`EMCScript`** — Used with `<script type="emc">`. Parses the EMC JSON config, registers the enhancement in the registry if needed, then calls `element.enh.get(enhancementConfig, spawnContext)` directly in its `handleMount` method.

Both ultimately call `element.enh.get(config, ctx)` — that's the common convergence point. But they arrive there by different paths:
- `EnhanceMountedElement` finds the config by inspecting module exports
- `EMCScript` builds the config from parsed JSON + dynamic import of the spawn class

### Where to add the defer check

Since both paths call `enh.get()`, you have two options:

**Option A: Add the check in both handlers (before `enh.get`)**

In `EnhanceMountedElement.#spawnEnhancement()`:
```typescript
#spawnEnhancement(element: Element, registryItem: any, context: MountContext): void {
    // Check for defer-[base] if withAttrs is present
    const base = registryItem.withAttrs?.base;
    if (base && element.hasAttribute(`defer-${base}`)) {
        // Dynamically load and await
        import('./awaitAttrRemoval.js').then(({ awaitAttrRemoval }) => {
            awaitAttrRemoval(element, `defer-${base}`).then(() => {
                this.#doSpawn(element, registryItem, context);
            });
        });
        return;
    }
    this.#doSpawn(element, registryItem, context);
}
```

In `EMCScript.handleMount()`:
```typescript
const base = emcConfig.enhConfig.withAttrs?.base;
if (base && mountedElement.hasAttribute(`defer-${base}`)) {
    const { awaitAttrRemoval } = await import('../awaitAttrRemoval.js');
    await awaitAttrRemoval(mountedElement, `defer-${base}`);
}
// Then proceed to enh.get(...)
```

**Option B: Add the check in `enh.get()` itself (inside assign-gingerly)**

Since both paths converge at `enh.get(config, ctx)`, you could put the defer logic there. But this pulls DOM observation into assign-gingerly, which contradicts the earlier decision to keep it DOM-unaware.

### My recommendation

**Option A — add it in both handlers.** The code is small (3-5 lines each), and it keeps the concern in mount-observer where it belongs. The `awaitAttrRemoval` utility is shared between them.

The EMCScript case is actually cleaner since `handleMount` is already async:

```typescript
// In EMCScript.handleMount(), before the enh.get() call:
const base = emcConfig.enhConfig.withAttrs?.base;
if (base && mountedElement.hasAttribute(`defer-${base}`)) {
    const { awaitAttrRemoval } = await import('../awaitAttrRemoval.js');
    await awaitAttrRemoval(mountedElement, `defer-${base}`);
}
```

For `EnhanceMountedElement`, the `mount` method is already async too, and `#spawnEnhancement` would need to become async (or you await before calling it):

```typescript
// In EnhanceMountedElement.mount(), before #spawnEnhancement:
const base = registryItem.withAttrs?.base;
if (base && mountedElement.hasAttribute(`defer-${base}`)) {
    const { awaitAttrRemoval } = await import('../awaitAttrRemoval.js');
    await awaitAttrRemoval(mountedElement, `defer-${base}`);
}
this.#spawnEnhancement(mountedElement, registryItem, context);
```

### Edge case: what if `defer-[base]` is never removed?

The `awaitAttrRemoval` Promise would hang forever (same as `whenDefined` in cede scripts). If GenIds never runs (e.g., no `-id` trigger element), the enhancement never spawns. Is that acceptable, or should there be a timeout? I'd say no timeout — it's the same contract as `whenDefined`. If the defer is never resolved, the enhancement was never meant to activate.

### Edge case: element removed from DOM while waiting

If the element is removed from the DOM while `awaitAttrRemoval` is pending, the MutationObserver will never fire (it's disconnected from mutations once the element is detached). We should handle this:

```typescript
export function awaitAttrRemoval(el: Element, attr: string): Promise<void> {
    if (!el.hasAttribute(attr)) return Promise.resolve();

    return new Promise(resolve => {
        const mo = new MutationObserver(() => {
            if (!el.hasAttribute(attr)) {
                mo.disconnect();
                resolve();
            }
        });
        mo.observe(el, { attributes: true, attributeFilter: [attr] });
    });
}
```

Actually, a MutationObserver on an element works even when detached — it observes the element's attribute changes regardless of its position in the document tree. So this isn't really a problem. The Promise just won't resolve until the attribute is removed (or never, if the element is GC'd — at which point the Promise is also GC'd).

### Summary

- `awaitAttrRemoval.ts` — new utility file (code-split, loaded only when needed)
- Add defer check in `EnhanceMountedElement.mount()` before `#spawnEnhancement`
- Add defer check in `EMCScript.handleMount()` before `enh.get()`
- No changes to assign-gingerly
- No timeout — same indefinite contract as other await patterns in this project

Want me to implement this?

---

## Human Response II

I agree -- no timeout.  Please implement.
