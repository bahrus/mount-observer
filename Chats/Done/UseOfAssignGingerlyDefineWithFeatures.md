# Use of assign-gingerly's defineWithFeature module

---

## Human Ask

I just updated assign-gingerly, that now supports and significantly extends much of the functionality of cede scripts.

Please read the full documentation [here](https://raw.githubusercontent.com/bahrus/assign-gingerly/refs/heads/baseline/docs/defineWithFeatures.md).

So this will require parsing the JSON inside the script element.

Please eliminate redundant code in handlers/CedeScript.ts by leverage this module, passing in the parsed configuration within the script tag.

Also, add support for src, similar to other script handlers in this project, that uses JSON import to bring in the JSON from an external module (with the help of import maps).

---

## Comments / Analysis

### What `defineWithFeatures` replaces

The current `CedeScript` handler manually:
1. Awaits `registry.whenDefined(baseTagName)`
2. Creates `class extends baseCtr {}`
3. Sets `NewCtr.seedRef = new WeakRef(scriptEl)`
4. Calls `registry.define(tagName, NewCtr)`

`defineWithFeatures(tagName, baseTagName, config, registry)` handles steps 1, 2, and 4 internally, plus adds feature resolution (async spawn loading, `assignFeatures` wiring, spawn caching). So the handler simplifies to:

1. Parse JSON (inline or from `src`)
2. Determine `tagName` and `baseTagName`
3. Call `defineWithFeatures(tagName, baseTagName, config, registry)`

### What about `seedRef`?

`defineWithFeatures` doesn't set `seedRef`. Two options:

**Option A**: Set `seedRef` after `defineWithFeatures` completes — call `registry.get(tagName)` to get the newly defined class and attach `seedRef` to it.

**Option B**: Ask if `defineWithFeatures` should accept a `seedRef` option. This keeps the concern inside the library.

I'll go with **Option A** since it keeps the change local to mount-observer and doesn't require modifying assign-gingerly's API.

### `src` support pattern

Following the same pattern as `EMCScript`:
```typescript
const srcAttr = scriptEl.getAttribute('src');
if (srcAttr) {
    const module = await import(srcAttr, { with: { type: 'json' } } as any);
    config = module.default;
} else {
    config = JSON.parse(scriptEl.textContent?.trim() || '');
}
```

This works with import maps for bare specifiers (e.g., `src="my-configs/time-ticker.json"`).

### Empty config case

If the script has no `src`, no `textContent`, and no pre-existing `export`, the handler should still work as before (simple class extension with no features). In that case, pass an empty config `{}` to `defineWithFeatures`, which should just create the subclass and define it without wiring any features.

### Questions

1. **Does `defineWithFeatures` handle the "already defined" check?** — The docs say it calls `whenDefined` on the base class, but does it also check if `tagName` itself is already defined before creating the subclass? If not, we still need the `registry.get(tagName)` guard in the handler.

2. **`export` property and `resolved` event**: Should we follow the same pattern as EMCScript/MountObserverScript — store the parsed config on `scriptElement.export` and dispatch a `resolved` event? This would enable Synthesizer to clone cede scripts across shadow roots with the parsed config already attached. I'll assume yes for consistency.

3. **Error handling for malformed JSON**: Should we set a `data-cede-error` attribute on the script element (like EMCScript does with `data-emc-error`) for debugging, or just throw?

### Proposed Refactored Handler

```typescript
// handlers/CedeScript.ts
import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types/mount-observer/types.js';
import { MountObserver } from '../MountObserver.js';

export class CedeScriptHandler extends EvtRt {
    static matching = 'script[type="cede"][data-extends]';
    static whereInstanceOf = HTMLScriptElement;

    async mount(mountedElement: Element, mountConfig: MountConfig, context: MountContext): Promise<void> {
        this.abort();
        const scriptEl = mountedElement as HTMLScriptElement;
        const extendsName = scriptEl.dataset.extends;
        if (!extendsName) return;

        const parentEl = scriptEl.parentElement;
        if (!parentEl) {
            throw new Error('CedeScript: script element must have a parentElement');
        }

        const tagName = parentEl.localName;
        const registry = (scriptEl as any).customElementRegistry || customElements;

        // Already defined? Do nothing (first one prevails).
        if (registry.get(tagName)) return;

        // Parse config: from export, src, or inline JSON
        let config: Record<string, any> = (scriptEl as any).export;
        if (!config) {
            const srcAttr = scriptEl.getAttribute('src');
            if (srcAttr) {
                const module = await import(srcAttr, { with: { type: 'json' } } as any);
                config = module.default;
            } else {
                const jsonText = scriptEl.textContent?.trim();
                config = jsonText ? JSON.parse(jsonText) : {};
            }

            // Store parsed config and dispatch resolved event
            (scriptEl as any).export = config;
            const { ResolvedEvent } = await import('../Events.js');
            scriptEl.dispatchEvent(new ResolvedEvent(config));
        }

        // Delegate to defineWithFeatures
        const { defineWithFeatures } = await import('assign-gingerly/defineWithFeatures.js');
        await defineWithFeatures(tagName, extendsName, config, registry);

        // Attach seedRef to the newly defined class
        const NewCtr = registry.get(tagName);
        if (NewCtr) {
            (NewCtr as any).seedRef = new WeakRef(scriptEl);
        }
    }
}

MountObserver.define('builtIns.cedeScript', CedeScriptHandler);
export const cedeScript = 'builtIns.cedeScript';
```

### Key changes from current implementation

| Concern | Before | After |
|---------|--------|-------|
| Class creation | Manual `class extends baseCtr {}` | Handled by `defineWithFeatures` |
| Feature wiring | Not supported | Full `assignFeatures` support |
| Spawn caching | N/A | Built into `defineWithFeatures` |
| `whenDefined` await | Manual | Handled by `defineWithFeatures` |
| `seedRef` | Set before define | Set after define (on the class `defineWithFeatures` created) |
| JSON parsing | Not supported | Inline + `src` with JSON import assertion |
| `export` / `resolved` event | Not supported | Follows EMCScript pattern |
| Empty script (no JSON) | Simple extend + define | Passes `{}` config (same result) |

---

## Human Response I

> Does defineWithFeatures guard against the tag already being defined?

No, it doesn't.  This is something I'm considering adding to assign-gingerly.  I like the code I'm seeing in your implementation plan:

```JavaScript
// Already defined? Do nothing (first one prevails).
if (registry.get(tagName)) return;
```

> Should we emit export/resolved event (I assumed yes for Synthesizer compatibility)?

Yes, please

> Error attribute vs throw for malformed JSON

Let's be consistent with what was done form EMCParseScript and MountObserverScript (hopefully, they are consistent between each other?)
