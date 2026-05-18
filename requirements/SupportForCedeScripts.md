# Support for Cede Scripts

---

## Human ask

This request could be the beginning of an extensive requirement.

It could grow to dynamically define things like custom element features that assign-gingerly support:

```html
<time-ticker>
    <script type="cede" data-extends="xtal-element">{
        "extends": "
        "assignFeatures": {
            "timeTicker":{
                "spawn": "time-ticker/TimeTicker.js"
            },
            "roundabout": {
                "spawn": "roundabout-lib/RoundaboutFeature.js",
                "customData": {...},
                "withAttrs": {...},
                "callbackForwarding": ["connectedCallback"]
            },
            "truthSourcer": {
                "spawn": "truth-sourcer/TruthSourcer.js",
                "callbackForwarding": ["connectedCallback", "attributeChangedCallback"],
                "getSharedAccess": {
                    "hostPropagator": "instance.propagator"
                }
            },
            "faceUp": {
                "spawn": "face-up/FaceUp.js"
            }
        }
    }</script>
</time-ticker>
```

But for now, let's keep it simple.

I'd like to define another handler, cede scripts.

```Javascript
<time-ticker>
    <script type="cede" data-extends="xtal-element"></script>
</time-ticker>
```

What this does:

1.  In the same customElement registry as the script element, it awaits oScriptEl.customElementRegistry.whenDefined('xtal-element').  For now, awaits indefinitely.
2.  Creates a new class that extends the ctr of step 1.
3.  Set a static property, newCtr.seedRef = new Weakref(oScriptEl);
3.  If oScriptEl.customElementRegistry.get('time-ticker') exists already, do nothing.  The name 'time-ticker' comes simply from the localName of the parent element.
4.  Else do oScriptEl.customElementRegistry.define('time-ticker', newCtr)

---

## Comments / Clarifications

### Implementation Approach

This fits naturally as a new handler class (like `DefineCustomElement`) registered via `MountObserver.define('builtIns.cedeScript', CedeScriptHandler)`. The handler would live at `handlers/CedeScript.ts`.

**Static defaults on the handler class:**
```typescript
static matching = 'script[type="cede"][data-extends]';
static whereInstanceOf = HTMLScriptElement;
```

This means consumers can use it with just `{ do: 'builtIns.cedeScript' }` and the matching/filtering is self-contained.

### Questions & Edge Cases

1. **Registry fallback**: If `oScriptEl.customElementRegistry` is undefined (browsers without scoped registries), should we fall back to `customElements` (the global registry)? The existing `DefineCustomElement` handler uses the global registry, while `DefineScopedCustomElement` throws. Which behavior do you want here?

2. **Parent element requirement**: If the script element has no `parentElement` (e.g., it's at the document root or detached), should we silently no-op or throw?

3. **`seedRef` lifetime**: You specify `newCtr.seedRef = new WeakRef(oScriptEl)`. Since the script element is inside the custom element it defines, once the CE upgrades, the script element remains in the DOM (inside the CE's light DOM). So the WeakRef should stay alive as long as the CE instance exists. Is the intent that the extended class can read back its "seed" script element for future configuration (e.g., when JSON content is added later)?

4. **Multiple cede scripts per parent**: If a parent element contains more than one `<script type="cede">`, should only the first one win (since step 3 checks if the tag is already defined), or should this be treated as an error?

5. **`data-extends` with hyphens**: The value of `data-extends` is a custom element name (e.g., `xtal-element`). This is straightforward to read via `scriptEl.dataset.extends`. Just confirming there's no intent to support extending built-in elements or non-custom-element classes here.

6. **Awaiting indefinitely**: You mention `whenDefined` awaits indefinitely. This is fine for the initial implementation, but worth noting that if the base class is never defined, the handler will hold a pending promise forever. A future enhancement could add an optional timeout or `AbortSignal` support.

### Proposed Handler Skeleton

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
        if (!parentEl) return;

        const tagName = parentEl.localName;
        const registry = (scriptEl as any).customElementRegistry || customElements;

        // Step 3: Already defined? Do nothing.
        if (registry.get(tagName)) return;

        // Step 1: Await the base class definition
        const baseCtr = await registry.whenDefined(extendsName);

        // Step 3 again (race condition guard): check after await
        if (registry.get(tagName)) return;

        // Step 2: Create derived class
        const NewCtr = class extends baseCtr {};

        // Step 3: Attach seedRef
        (NewCtr as any).seedRef = new WeakRef(scriptEl);

        // Step 4: Define
        registry.define(tagName, NewCtr);
    }
}

MountObserver.define('builtIns.cedeScript', CedeScriptHandler);
```

### Notes on the Skeleton

- The double-check of `registry.get(tagName)` before and after the `await` handles the race where another observer or script defines the element while we're waiting.
- `this.abort()` is called immediately (same pattern as `DefineCustomElement`) since this is a one-shot handler — once the element is defined, there's no ongoing lifecycle to manage.
- The handler uses `(scriptEl as any).customElementRegistry` which follows the existing codebase pattern for accessing scoped registries.

---

## Human response I

> If `oScriptEl.customElementRegistry` is undefined (browsers without scoped registries), should we fall back to `customElements` (the global registry)?

Yes

> If the script element has no `parentElement` (e.g., it's at the document root or detached), should we silently no-op or throw?

throw

>  Is the intent that the extended class can read back its "seed" script element for future configuration

The most important use case is that the custom element can extract the (Shadow) Fragment of the parent, and create a template from it that can be cloned for other instances.  

> Multiple cede scripts per parent

Don't throw any error for this.  First one prevails.

> Just confirming there's no intent to support extending built-in elements or non-custom-element classes here.

Correct.  No intention.


