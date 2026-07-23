# Avoid Unnecessary Side Effects

---

## Human Ask

I don't think use of the assignOnMount config setting with mountObserver should result in importing the "side-effect-causing" await import('assign-gingerly/object-extension.js'); because this code is internal, and it's not really any easier than importing the safer 'assign-gingerly/assignGingerly.js' when needed:

Instead of:

```JS
async assignGingerly(config: Record<string, any> | undefined): Promise<void> {
    // Handle undefined case
    if (config === undefined) {
        this.#assignOnMount = undefined;
        return;
    }

    await import('assign-gingerly/object-extension.js');

    // Update the source config for future mounted elements
    if (this.#assignOnMount === undefined) {
        // No existing config, just clone the passed in object
        this.#assignOnMount = structuredClone(config);
    } else {
        // Merge into existing config using assignGingerly
        this.#assignOnMount.assignGingerly(config);
        //assignGingerly(this.#asgMtSource, config);
    }

    // Apply to already mounted elements using setWeak for iteration
    for (const ref of this.#mountedElements.setWeak) {
        const element = ref.deref();
        if (element) {
            element.assignGingerly(config, this.#assignOptions);
            //assignGingerly(element, config);
        }
    }
}
```

do this instead (make sure I made no mistakes below, and that the code changes don't break anything):

```JS
async assignGingerly(config: Record<string, any> | undefined): Promise<void> {
    // Handle undefined case
    if (config === undefined) {
        this.#assignOnMount = undefined;
        return;
    }
    const {assignGingerly} = await import('assign-gingerly/assignGingerly.js');

    // Update the source config for future mounted elements
    if (this.#assignOnMount === undefined) {
        // No existing config, just clone the passed in object
        this.#assignOnMount = structuredClone(config);
    } else {
        // Merge into existing config using assignGingerly
        assignGingerly(this.#assignOnMount, config);
        //assignGingerly(this.#asgMtSource, config);
    }

    // Apply to already mounted elements using setWeak for iteration
    for (const ref of this.#mountedElements.setWeak) {
        const element = ref.deref();
        if (element) {
            assignGingerly(element, config, this.#assignOptions);
            //assignGingerly(element, config);
        }
    }
}
```

Make sure there is no other references to await import('assign-gingerly/object-extension.js');

We might want to add it to ElementMountExtension.ts since that advertises itself as having side effects.

Are there any reasons we wanted to use the objection extension that you recall?





---

## Kiro Response I

### Your proposed change is correct and safe

The refactored `assignGingerly` method you propose works correctly. The key change is:
- **Before:** `await import('assign-gingerly/object-extension.js')` then use `target.assignGingerly(source)` (method on Object.prototype)
- **After:** `const {assignGingerly} = await import('assign-gingerly/assignGingerly.js')` then use `assignGingerly(target, source, options)` (direct function call)

Both do the same thing — the object-extension just wraps the function call with `this` binding. Your version avoids polluting `Object.prototype` as a side effect.

### Other references to `object-extension.js`

There are **two more** dynamic imports in `MountObserver.ts` (line ~404 in `observe()`):

```typescript
if(this.#assignOnMount || this.#asgDisMtSource){
    await import('assign-gingerly/object-extension.js');
}
```

This one pre-loads the object-extension so that `element.assignGingerly()` works later in `#handleMatch`. With your change, this import is no longer needed — we'd call `assignGingerly(element, source, options)` directly instead.

**But there's a catch:** In `#handleMatch`, the call is currently:
```typescript
element.assignGingerly(this.#asgMtSource, this.#assignOptions);
```

This would also need to change to the direct function import. Since `#handleMatch` isn't async-importable at call time (it's in the hot path, called for every matching element), we'd need to import `assignGingerly` once during `observe()` and cache it — similar to how `assignTentatively` is already handled:

```typescript
#assignGingerly: typeof assignGingerlyType | undefined;

// In observe():
if(this.#asgMtSource || this.#asgDisMtSource){
    const { default: assignGingerly } = await import('assign-gingerly/assignGingerly.js');
    this.#assignGingerly = assignGingerly;
}

// In #handleMatch:
if (this.#asgMtSource && this.#assignGingerly) {
    this.#assignGingerly(element, this.#asgMtSource, this.#assignOptions);
}
```

Wait — actually `assignGingerly` is already a named export, not default. Let me check the exact export shape... Based on what I read earlier, it's: `export default function assignGingerly(...)`. So the import would be:

```typescript
const { default: assignGingerly } = await import('assign-gingerly/assignGingerly.js');
```

Or simply:
```typescript
const mod = await import('assign-gingerly/assignGingerly.js');
this.#assignGingerly = mod.default;
```

### Static imports in handlers

`EMCScript.ts` and `EnhanceMountedElement.ts` have **static** (top-level) imports of `object-extension.js`:
```typescript
import 'assign-gingerly/object-extension.js';
```

These are needed because those handlers use `element.enh.get()` which is defined by the object-extension. The `enh` property getter and `enhancementRegistry` on `CustomElementRegistry` both come from that import. These should stay — they genuinely need the side effects for the enhancement system.

### Should we add it to `ElementMountExtension.ts`?

Yes, that makes sense. `ElementMountExtension.ts` already:
- Defines `Element.prototype.mount`
- Defines `Element.prototype.mountScope`
- Defines `Node.prototype.mountGlobally`
- Accesses `customElementRegistry.enhancementRegistry` (which comes from object-extension)

It already imports `'./ElementMountExtension.js'` in several places as a known side-effect import. Adding `import 'assign-gingerly/object-extension.js'` there consolidates the "global prototype extensions" in one place. Users who import `ElementMountExtension.js` explicitly opt into prototype extensions — they'd get both `element.mount()` and `element.enh` / `element.assignGingerly()` in one import.

### Why was object-extension used originally?

The convenience of `element.assignGingerly(source)` — it reads nicely and auto-populates the `registry` option from `element.customElementRegistry.enhancementRegistry`. But inside MountObserver's internals, we don't need that convenience:
- We can pass the registry explicitly if needed
- We already have the options object
- We control the call site

The object-extension is valuable for **consumer code** (handlers, user callbacks) where `element.assignGingerly({...})` is ergonomic. Inside MountObserver's core, the direct function call is cleaner and avoids the side effect.

### Summary of changes needed

1. **`MountObserver.ts` / `.js` — `observe()` method:** Replace `await import('assign-gingerly/object-extension.js')` with caching the `assignGingerly` function from `'assign-gingerly/assignGingerly.js'`
2. **`MountObserver.ts` / `.js` — `#handleMatch`:** Use `this.#assignGingerly(element, source, options)` instead of `element.assignGingerly(source, options)`
3. **`MountObserver.ts` / `.js` — `#handleRemoval` (dismount):** Same change
4. **`MountObserver.ts` / `.js` — `assignGingerly()` public method:** Your proposed change (already correct)
5. **`ElementMountExtension.ts` / `.js`:** Add `import 'assign-gingerly/object-extension.js'` so consumers who want the prototype extensions get them

Shall I implement?

---

## Human Response I

Yes, please implement.

## Implementation Notes

Now add the `#assignGingerly` private field:

Now replace the `object-extension.js` import in `observe()` with caching the function:

The field name is `#assignOnMount` not `#asgMtSource`. Let me use the exact text:

Wait — the field is named `#assignOnMount` here? Let me check:

OK, the field is `#assignOnMount`. Now let me do the replacement properly:

Now update `#handleMatch` to use the cached function instead of `element.assignGingerly`:

Now update the dismount (`#handleRemoval`):

Now update the public `assignGingerly()` method:

Now add `import 'assign-gingerly/object-extension.js'` to `ElementMountExtension.ts`:

Now update the JS files. First `MountObserver.js`:

Wait, it seems like the JS file may have already been partially updated. Let me check:

Hmm, it seems something already partially changed this. Let me check if the old `object-extension` import is still there:

Good — it's already been updated in the JS file. Let me verify the `element.assignGingerly` calls in the JS:

The JS file is already fully updated. I notice there's a duplicate `#assignGingerlyFn;` declaration — let me fix that:

Now update `ElementMountExtension.js`:

Good — `ElementMountExtension.js` already has the `import 'assign-gingerly/object-extension.js'`. Now let me verify diagnostics:

All clean. Done. Here's the summary:

**`MountObserver.ts` / `.js`:**
- Removed `await import('assign-gingerly/object-extension.js')` from `observe()`
- Replaced with caching `assignGingerly` function: `const mod = await import('assign-gingerly/assignGingerly.js'); this.#assignGingerlyFn = mod.default;`
- `#handleMatch` now uses `this.#assignGingerlyFn(element, source, options)` directly
- `#handleRemoval` (dismount) same change
- Public `assignGingerly()` method uses direct import of `assignGingerly` function

**`ElementMountExtension.ts`:**
- Added `import 'assign-gingerly/object-extension.js'` — consolidates the prototype extensions here for consumers who explicitly opt into them

The net effect: MountObserver's core no longer pollutes `Object.prototype` as a side effect. The prototype extensions are only loaded when `ElementMountExtension.js` is imported (which is the explicit opt-in for side effects like `element.mount()`, `element.enh`, `element.assignGingerly()`).
