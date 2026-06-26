# Supporting trans-render's Clone$ utility.

---

## Human Ask

The package trans-render contains a file below that I would like to see if it can be shoe-horned into this package.  The underlying theme is based on the premise that when we clone a template and make adjustments to it, especially if there's any asynchronous adjustments required, to wait for the dust to settle before adding the clone to the live DOM tree.

Not also that some of the references in the code below come from the legacy version of this package, and can in fact be found in the legacy folder.

Please provide your thoughts on what strikes you as worth implementing, and how you would design it, based on the new approach this package has adopted.  Do some aspects belong in assign-gingerly?

```JavaScript
import {Clone$Options} from '../ts-refs/trans-render/types.js';
import {IshEvent} from 'mount-observer/Newish.js';
import {getCount} from 'mount-observer/refid/getCount.js';
import 'mount-observer/preloadContent.js';
import 'mount-observer/refid/via.js';
import {lispToCamel} from '../lib/lispToCamel.js';
import { IshCtr } from '../ts-refs/mount-observer/types.js';
export const modelSym = Symbol();
const refIDAttrBase = 'data-trans-render-idrefs-a';

//const refIDProp = lispToCamel(refIDAttrBase);
export class Clone$ implements EventListenerObject{
    #clone$Options: Clone$Options;
    constructor(options: Clone$Options){
        this.#clone$Options = options;
        this.hydrate();
    }
    async hydrate(){
        const {ishContainer} = this.#clone$Options;
        ishContainer.addEventListener('ish', this);
        this.handleEvent();
    }
    async handleEvent(e?: Event){
        if(e instanceof IshEvent){
            if(!e.actions.includes('ishListAssigned')) return;
        }
        const {
            ish, idxStart, seedEl, itemScopes, mapIdxTo,
            itemTemplates, baseCrumb, idleTimeout, 
        } = this.#clone$Options;
        const templLen = itemTemplates.length;
        if(templLen !== itemScopes.length) throw 'NA';
        const ctrLookup: {[key: string]: IshCtr} = {};
        const {getIsh} = await import('mount-observer/refid/getIsh.js');
        const {Newish} = await import('mount-observer/Newish.js');
        const {assignGingerly} = await import('../lib/assignGingerly.js');
        const {waitForIdleNodes} = await import('mount-observer/MountObserver.js');
        for(const itemScope of itemScopes){
            if(!ctrLookup[itemScope]){
                const ctr = await getIsh(seedEl, itemScope);
                ctrLookup[itemScope] = ctr;
            }
        }
        
        
        const idRefs: Array<Array<string>> = new Array(templLen).fill([]);
        
        let idx = idxStart;
        
        const fragment = document.createDocumentFragment();
        const nodesWeWantToWaitFor  = [] as Array<Node>;
        // const existingIshNodes = [] as Array<any>;
        // let ns = seedEl as Element | null;
        // while(ns !== null){
        //     if(ns.getAttribute('itemscope') === itemProp){
        //         existingIshNodes.push(ns);
        //     }
        //     ns = ns.nextElementSibling;
        // }
        
        const existingIshNodes: Array<Array<Element>> = [];
        for(let i = 0; i < templLen; i++){
           const refIDProp = lispToCamel(`${refIDAttrBase}${i}`);
           existingIshNodes[i] = (<any>seedEl).via[refIDProp].children as Array<Element>;
        }
         
        const absIdx: Array<number> = new Array(templLen).fill(0);
        let isOutOfRange = new Array(templLen).fill(false);
        let lastExisting = seedEl;
        
        const targetFragment = seedEl.getRootNode();
        //const newArr = [];
        for(const item of ish){
            const skipNewCreation: Array<boolean> = new Array(templLen).fill(false);
            for(let i = 0; i < templLen; i++){
                if(!isOutOfRange[i]){
                    const existingIshNode = existingIshNodes[i][absIdx[i]];
                    if(existingIshNode !== undefined){
                        idRefs[i].push(existingIshNode.id);
                        (<any>existingIshNode).ish = item;
                        //newArr.push(existingIshNode.ish);
                        if(mapIdxTo !== undefined){
                            (<any>existingIshNode).ish[mapIdxTo] = idx++;
                        }
                        lastExisting = existingIshNode;
                        absIdx[i]++;
                        skipNewCreation[i] = true;
                    }else{
                        isOutOfRange[i] = true;
                    }
                }
            }
            // for(let i = 0; i < templLen; i++){
            //     absIdx[i]++;
            // }

            //Create new nodes when necessary
            for(let i=0; i<templLen; i++){
                if(skipNewCreation[i]) continue;
                if(Array.isArray(item) && !item[i]) continue;
                const ithItem = Array.isArray(item) ? item[i] : item;
                const clone =  ((<any>itemTemplates[i]).remoteContent as DocumentFragment).cloneNode(true) as DocumentFragment;
                (<any>clone).targetFragment = targetFragment;
                const children = Array.from(clone.children);
                children.forEach(c => {nodesWeWantToWaitFor.push(c)});
                //TODO:  modify template element so don't have to do this with every loop
                const firstElementChild = clone.firstElementChild as  Element;
                if(firstElementChild === null) throw 404;
                const id = `${baseCrumb}-${getCount(baseCrumb)}`;
                firstElementChild.id = id;
                idRefs[i].push(id);
                const itemScope = itemScopes[i];
                const ctr = ctrLookup[itemScope];
                const n = new Newish(firstElementChild, firstElementChild, itemScope, {
                    ctr,
                    assigner: assignGingerly,
                    csr: true,
                    initPropVals: item,
                });
                const ce = await n.do();
                //newArr.push(ce);
                //TODO: insert into arr
                //firstElementChild.ish = item;
                if(mapIdxTo !== undefined){
                    (<any>ce)[mapIdxTo] = idx++;
                }
                
                firstElementChild.setAttribute('itemscope', itemScope);
                if(children.length > 1){
                    let itemref = firstElementChild.getAttribute('itemref') || '';
                    for(let i = 1, ii = children.length; i < ii; i++){
                        const child = children[i];
                        if(!child.id){
                            child.id = `${baseCrumb}-${getCount(baseCrumb)}`;
                            itemref += ' ' + child.id;
                        }
                    }
                    firstElementChild.setAttribute('itemref', itemref.trim());
                }

                //TODO:  max buffer size
                fragment.appendChild(clone);
            }
            

        }
        //const {listScope} = this.#clone$Options;
        // if(listProp !== undefined && ish[modelSym] !== undefined){
        //     ish[modelSym][listProp] = newArr;
        // }
        for(let i = 0; i < templLen; i++){
            if(absIdx[i] <= existingIshNodes[i].length){
                const {deleteEl} = await import('trans-render/dss/tref/deleteEl.js');
                for(let j = absIdx[i]; j < existingIshNodes[i].length; j++){
                    const existingIshNode = existingIshNodes[i][j];
                    if(existingIshNode.hasAttribute('itemref')){
                        deleteEl(existingIshNode);
                    }else{
                        existingIshNode.remove();
                    }
                    
                }
            }
        }

        await waitForIdleNodes(nodesWeWantToWaitFor, idleTimeout);
        if(lastExisting.hasAttribute('itemref')){
            throw 'NI';
            //TODO:  use children?
            // const {tail} = await import('../deprecated/tref/tail.js');
            // lastExisting = tail(lastExisting)!;
        }
        lastExisting.after(fragment);
        for(let i = 0; i < templLen; i++){
            seedEl.setAttribute(`${refIDAttrBase}${i}`, idRefs[i].join(' '));
        }
        
    }
}
```


---

## Kiro Response I

After studying this code, I see several distinct concerns interleaved. Let me break down what's here, what's worth extracting, and where each piece belongs.

### What Clone$ actually does (decomposed)

1. **Template cloning with offscreen assembly** — Clone a template's `remoteContent`, make async adjustments to the clone in a `DocumentFragment`, then append to live DOM only when ready. This is the "wait for dust to settle" principle.

2. **List reconciliation** — Given a data array (`ish`), diff it against existing DOM nodes. Reuse existing nodes (update their data), create new clones for additions, remove excess nodes for deletions. This is essentially a keyed virtual-list reconciler.

3. **ID generation for clones** — Each new clone gets a unique ID via `getCount(baseCrumb)`. This is what `id-generation` / GenIds already handles.

4. **Custom element instantiation** — Uses `Newish` to instantiate custom elements on the cloned fragments with initial property values. This is what `defineWithFeatures` / cede scripts now handle.

5. **`itemscope` / `itemref` wiring** — Microdata-style relationships between cloned elements. Multi-element clones get `itemref` attributes pointing to sibling elements.

6. **Idle waiting** — `waitForIdleNodes` waits for async work on newly created nodes to complete before inserting the fragment. This is the "dust settling" mechanism.

7. **Reference tracking** — `data-trans-render-idrefs-aN` attributes on the seed element track which DOM nodes belong to this list, enabling future reconciliation.

### What's worth implementing in mount-observer

**A. Offscreen fragment assembly utility (high value)**

The core principle — "build in a fragment, wait for async work, then insert" — is genuinely useful and generic. This is independent of lists, reconciliation, or microdata. A utility like:

```typescript
// compose.ts (or similar)
export async function composeFragment(
    template: HTMLTemplateElement,
    setup?: (fragment: DocumentFragment) => Promise<void> | void
): Promise<DocumentFragment> {
    const content = (template as any).remoteContent ?? template.content;
    const clone = content.cloneNode(true) as DocumentFragment;
    if (setup) await setup(clone);
    return clone;
}
```

This composes with existing infrastructure:
- Works with `remoteContent` (hoisted templates via `builtIns.hoistTemplate`)
- The `setup` callback can trigger mount observers on the fragment's children
- Caller decides when to insert into live DOM

**Where:** mount-observer (it's about DOM lifecycle timing)

**B. Idle/settled waiting (medium value)**

A utility that waits for "all async mount-observer work on these nodes to complete." This is tricky to define precisely — what does "settled" mean? Options:

1. Wait for all pending `do` callbacks on elements within the fragment
2. Wait for `requestAnimationFrame` (one paint cycle)
3. Wait for a custom "ready" signal from the nodes themselves

The legacy `waitForIdleNodes` likely uses option 2 or a combination. A simpler approach for v2:

```typescript
// waitForIsh.ts already exists in this project
// Could add:
export function waitForSettled(nodes: Node[], timeout?: number): Promise<void> {
    // Wait for requestAnimationFrame + microtask queue drain
}
```

**Where:** mount-observer (it's about observation lifecycle)

**C. List reconciliation (high value, but complex)**

This is the biggest piece and also the most opinionated. The reconciliation logic (reuse existing nodes, create new, delete excess) is the core of every reactive rendering library. Implementing it well is non-trivial.

**My recommendation:** Don't try to shoe-horn the full reconciler into mount-observer. Instead, extract the *pattern* into a handler that works with the existing infrastructure:

```html
<ul>
    <template -id itemscope="todo-item" src="#todo-template">
        <!-- Seed element: defines what template to clone and what scope to use -->
    </template>
</ul>
```

A handler that:
1. Listens for data changes (via an event or property assignment)
2. Reconciles DOM children against the data array
3. Uses `composeFragment` for new items (offscreen assembly)
4. Uses GenIds for ID assignment
5. Uses `defineWithFeatures` or `enh.get()` for CE instantiation

**Where:** This feels like a separate package (like `trans-render` itself) that *uses* mount-observer, rather than something embedded in mount-observer. Mount-observer provides the primitives; the reconciler composes them.

**D. `itemscope` / `itemref` wiring (low-medium value)**

This is specific to microdata-based component patterns. It's useful for your ecosystem but probably too specialized for mount-observer's core. Could be:
- A handler (`builtIns.wireItemRefs`)
- Part of assign-gingerly (since it's property/attribute assignment)
- Left in trans-render as a consumer of mount-observer's primitives

**Where:** Leaning toward assign-gingerly or a separate handler, not core

### What belongs in assign-gingerly

The `assignGingerly` call in the original code is used to set initial property values on newly instantiated elements. This is already handled by:
- `assignOnMount` in MountConfig
- `stageOnMount` for reversible assignments
- `enh.get()` with `initVals` in the spawn context

So: **nothing new needed in assign-gingerly for this.** The existing API covers it.

### What I'd actually implement (prioritized)

1. **`composeFragment` utility** — Small, generic, high value. Works with hoisted templates. ~20 lines.

2. **`waitForSettled` utility** — Useful for the "offscreen assembly" pattern. Waits for mount-observer `do` callbacks to resolve on a set of nodes. Builds on `requestAnimationFrame` or a `MutationObserver` that watches for a "ready" signal.

3. **A list-rendering handler** — But as a separate package or in a `contrib/` folder, not in core. It would compose `composeFragment` + GenIds + the reconciliation logic.

### Design sketch for `composeFragment`

```typescript
// compose.ts
export interface ComposeOptions {
    /** Called with the fragment before insertion. Can be async. */
    setup?: (fragment: DocumentFragment) => Promise<void> | void;
    /** If true, trigger mount observers on fragment children before returning. */
    triggerObservers?: boolean;
}

export async function composeFragment(
    template: HTMLTemplateElement,
    options?: ComposeOptions
): Promise<DocumentFragment> {
    // Get content from hoisted or regular template
    const content = (template as any).remoteContent ?? template.content;
    const clone = content.cloneNode(true) as DocumentFragment;
    
    if (options?.setup) {
        await options.setup(clone);
    }
    
    return clone;
}
```

Usage with GenIds + cede scripts:

```typescript
const fragment = await composeFragment(myTemplate, {
    async setup(frag) {
        // GenIds processes -id elements in the fragment
        const { genIds } = await import('id-generation/genIds.js');
        genIds(frag.querySelector('[-id]'), frag);
        
        // Any mount observers watching the fragment will fire
        // Enhancement spawning happens here, offscreen
    }
});

// Only NOW insert into live DOM — all async work is done
container.appendChild(fragment);
```

### Questions

1. **Is the reconciliation (list diffing) something you want inside mount-observer, or is it better as a consumer package?** The code is substantial and opinionated — it assumes microdata patterns, specific ID schemes, and a particular DOM structure.

2. **What does "wait for idle" mean to you precisely?** Is it "all `do` callbacks have resolved" or "all mount events have fired" or "one rAF has passed"? The definition affects the implementation.

3. **The `Newish` class** — This seems to be the legacy precursor to what `defineWithFeatures` now does (instantiate a CE from a constructor + assign properties). Is that a fair read, or does `Newish` do something that `defineWithFeatures` doesn't cover?

4. **The `via` property** (`seedEl.via[refIDProp].children`) — Is this a pattern you still want, or has it been superseded by the `refid/` utilities in the current codebase?

---

## Human Response I

One significant correction, I think:

> The legacy `waitForIdleNodes` likely uses option 2 or a combination. A simpler approach for v2

No, I'm pretty sure the way this works and should work is basically a combination of an all encompassing mutation observer on the DOM fragment that looks for any DOM mutation and debouncing.  Waiting for mutations to stop for a certain configurable number of milliseconds before committing it to the live DOM.

A restatement of a fundamental problem this requirement is trying to address:

The synthesizer feature supported by this package is also designed to work when the shadowroot is added to the DOM tree, and could be problematic if it is added to a DOM fragment without having access to the parent shadowRoot (prior to appending the fragment).  So how do we pre-activate the (asynchronous) work in that case?

You might be right that list diffing reconciliation doesn't belong here.  What name would you give it in npm that is unlikely to clash with existing package names?







---

## Kiro Response II

### Correction accepted: "settled" = mutation debounce

You're right — the pattern is:

1. Observe the fragment for *any* DOM mutations (childList + subtree + attributes)
2. Each time a mutation fires, reset a debounce timer
3. When no mutations have occurred for N milliseconds, consider the fragment "settled"
4. Resolve the promise → safe to append to live DOM

This is fundamentally different from rAF or microtask drain. It accounts for *cascading* async work — where one mutation triggers an observer, which does async work, which causes another mutation, which triggers another observer, etc. The debounce ensures the entire chain has quiesced.

```typescript
// waitForSettled.ts
export function waitForSettled(
    fragment: Node,
    idleMs: number = 100
): Promise<void> {
    return new Promise(resolve => {
        let timer: ReturnType<typeof setTimeout>;
        
        const mo = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                mo.disconnect();
                resolve();
            }, idleMs);
        });
        
        mo.observe(fragment, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        
        // Start the initial timer — if no mutations happen at all,
        // resolve after idleMs (the fragment was already settled)
        timer = setTimeout(() => {
            mo.disconnect();
            resolve();
        }, idleMs);
    });
}
```

The `idleMs` parameter is the debounce window. If mutations stop for that long, we assume all async work has cascaded through.

### The Synthesizer-in-fragment problem

This is the deeper issue. The Synthesizer's `connectedCallback` fires when the element connects to a *document* (or shadow root attached to a document). When you're composing in a detached `DocumentFragment`:

- Elements inside the fragment are NOT connected to any document
- `connectedCallback` won't fire
- Synthesizer won't activate handlers
- Mount observers that depend on Synthesizer won't start

So the question becomes: **how do you pre-activate mount observers on a detached fragment?**

Options:

**A. Explicit `observe()` on the fragment**

The caller manually creates/starts observers on the fragment before appending:

```typescript
const fragment = template.content.cloneNode(true) as DocumentFragment;

// Manually activate observation on the detached fragment
const observer = new MountObserver({ do: 'builtIns.cedeScript' });
await observer.observe(fragment);

// Wait for all async work to cascade
await waitForSettled(fragment);

// Now safe to append
container.appendChild(fragment);
observer.disconnect();
```

This works today — `MountObserver.observe()` accepts any `Node`, including a `DocumentFragment`. The issue is the caller needs to know which handlers to activate.

**B. A `preactivate` utility that mimics Synthesizer**

A function that activates the same handlers Synthesizer would, but on a detached fragment:

```typescript
// preactivate.ts
import { Synthesizer } from './Synthesizer.js';

export async function preactivate(
    fragment: DocumentFragment,
    idleMs?: number
): Promise<void> {
    // Activate all built-in handlers on the fragment
    for (const handlerName of Synthesizer.builtInHandlers) {
        await fragment.mount({ do: handlerName });  // Hmm, mount() is on Element...
    }
    
    // Wait for cascading async work to settle
    const { waitForSettled } = await import('./waitForSettled.js');
    await waitForSettled(fragment, idleMs);
}
```

Problem: `mount()` is defined on `Element.prototype` (via `ElementMountExtension`), not on `DocumentFragment`. But `MountObserver.observe()` DOES accept any `Node`. So this would use the observer directly:

```typescript
export async function preactivate(
    fragment: DocumentFragment,
    idleMs: number = 100
): Promise<void> {
    const observers: MountObserver[] = [];
    
    for (const handlerName of Synthesizer.builtInHandlers) {
        const observer = new MountObserver({ do: handlerName });
        await observer.observe(fragment);
        observers.push(observer);
    }
    
    // Wait for all async cascades to settle
    const { waitForSettled } = await import('./waitForSettled.js');
    await waitForSettled(fragment, idleMs);
    
    // Disconnect all observers (they'll be re-observed in live DOM)
    for (const observer of observers) {
        observer.disconnect();
    }
}
```

**C. Make Synthesizer fragment-aware**

Synthesizer could detect when it's in a `DocumentFragment` (not a real document/shadow root) and activate in a "preactivation" mode. But this changes the semantics of Synthesizer — it currently assumes it's either a syndicator (document root) or subscriber (shadow root).

### My recommendation

**Option B** is cleanest:

1. `waitForSettled(fragment, idleMs)` — the debounce-based mutation quiescence utility
2. `preactivate(fragment, idleMs)` — activates all built-in handlers on a detached fragment, waits for settled, then disconnects

The caller's flow becomes:

```typescript
const fragment = template.content.cloneNode(true) as DocumentFragment;
await preactivate(fragment, 150);  // All handlers fire, all async work completes
container.appendChild(fragment);    // Insert fully "hydrated" fragment
```

This keeps Synthesizer unchanged, works with detached fragments, and composes with the existing handler infrastructure.

### Package name for the list reconciler

Some options that are descriptive and unlikely to clash:

- **`list-reconciler-dom`** — clear, specific, unlikely to conflict
- **`dom-list-sync`** — short, describes the sync-data-to-DOM pattern
- **`itemscope-repeater`** — ties to the microdata pattern but more niche
- **`fragment-reconciler`** — emphasizes the offscreen assembly aspect
- **`ish-list`** — short, ties to your "ish" naming convention, very unlikely to clash

My pick would be **`list-reconciler-dom`** — it's immediately understandable, specific enough to avoid namespace collisions, and doesn't tie itself to any particular data pattern (microdata, ish, etc.). Consumers know what they're getting.

If you want it closer to your ecosystem naming:
- **`mount-list`** or **`mount-reconciler`** — pairs with mount-observer
- **`be-repeated`** — follows your `be-*` enhancement naming pattern

### Questions

1. For `preactivate` — should it accept a custom list of handlers (in case you DON'T want all 8 Synthesizer handlers), or always use the full set?

2. For `waitForSettled` — should there be a maximum timeout (safety net) that rejects the promise if mutations never quiesce? Or let it hang indefinitely like other await patterns in this project?

3. When the fragment is eventually appended to live DOM, the elements connect. Handlers in the live DOM tree will see them via mutation observers and try to process them again. Is double-processing a concern, or do the existing guards (`#processedDoForElement`, `canSpawn` checks, "already defined" guards) handle it?

---

## Human response II

On 1:  

I like the name / concept of preactivate(fragment).

I just became aware of customElements.initialize(fragment) -- actually, I'm not sure any DOM fragment will work. I think this would upgrade the synthesizer element, and maybe call connectedCallback, which would automatically pull in the inherited enhancements as well as activating the built in handlers.  Maybe for consistency we should call this new function initialize rather than preactivate?

On 2:

That might be a good idea to allow for a maximum timeout, and reject (avoiding adding the problematic fragment to the live DOM tree would be a good thing I think).




---

## Kiro Response III

### On `customElements.initialize()` — this is highly relevant

Good find. `CustomElementRegistry.initialize(root)` does exactly what we need for part of the problem:

1. Takes any `Node` (Document, ShadowRoot, or Element) as `root`
2. Walks all inclusive descendants
3. Sets `customElementRegistry` on each element that doesn't have one
4. **Upgrades** custom elements (triggers `connectedCallback`-equivalent behavior)

Available in Chrome 146+, Safari 26+, Edge 146+. No Firefox yet.

**Key insight:** If the Synthesizer element is inside the fragment and has been defined in the registry you pass to `initialize()`, it WILL get upgraded. Its `connectedCallback` fires, which activates handlers and pulls in inherited enhancements. This means `initialize()` bootstraps the entire Synthesizer pipeline on a detached fragment for free.

**However**, there's a subtlety: `initialize()` is synchronous. It upgrades elements immediately. But Synthesizer's `connectedCallback` triggers async work (handler activation, observer creation). So you still need `waitForSettled` after `initialize()` to wait for the cascading async effects.

### Naming: `initialize` vs `preactivate`

I agree `initialize` is better. It mirrors the platform API and communicates the same intent — "set up this subtree as if it were connected." The flow becomes:

```typescript
import { initialize } from 'mount-observer/initialize.js';

const fragment = template.content.cloneNode(true) as DocumentFragment;
await initialize(fragment, { idleMs: 150, timeout: 5000 });
container.appendChild(fragment);
```

Internally, `initialize` would:

1. Call `registry.initialize(fragment)` if available (Chrome 146+ path — upgrades Synthesizer + all CEs)
2. Fall back to manual observer activation for browsers without `initialize()` support
3. Call `waitForSettled(fragment, idleMs)` with timeout
4. Reject if timeout exceeded

### Proposed API

```typescript
// initialize.ts
export interface InitializeOptions {
    /** Debounce window for mutation quiescence (ms). Default: 100 */
    idleMs?: number;
    /** Maximum time to wait before rejecting (ms). Default: none (infinite) */
    timeout?: number;
    /** Custom element registry to use. Defaults to element's registry or global. */
    registry?: CustomElementRegistry;
}

export async function initialize(
    root: Node,
    options?: InitializeOptions
): Promise<void>;
```

### On timeout with rejection

Agreed — rejecting on timeout is the right call here. Unlike `whenDefined` or `awaitAttrRemoval` (where the caller chose to wait indefinitely for a specific known event), `initialize` is meant to be a bounded "hydrate this fragment" operation. If something goes wrong (an observer enters an infinite mutation loop, or an import never resolves), you want to know about it rather than silently hang.

```typescript
const { waitForSettled } = await import('./waitForSettled.js');

try {
    await initialize(fragment, { idleMs: 150, timeout: 5000 });
} catch (e) {
    // Fragment never settled — don't add to live DOM
    console.error('Fragment initialization timed out:', e);
    return;
}

container.appendChild(fragment);
```

### The full implementation sketch

```typescript
// initialize.ts
import { waitForSettled } from './waitForSettled.js';

export interface InitializeOptions {
    idleMs?: number;
    timeout?: number;
    registry?: CustomElementRegistry;
}

export async function initialize(
    root: Node,
    options: InitializeOptions = {}
): Promise<void> {
    const { idleMs = 100, timeout, registry } = options;

    // Use platform initialize() if available (Chrome 146+)
    const reg = registry
        || (root as any).customElementRegistry
        || customElements;

    if (typeof reg.initialize === 'function') {
        reg.initialize(root);
    } else {
        // Fallback: manually upgrade with the older API
        if (typeof reg.upgrade === 'function' && root instanceof Element) {
            reg.upgrade(root);
        }
        // Also upgrade descendants
        if ('querySelectorAll' in root) {
            const elements = (root as Element | DocumentFragment).querySelectorAll('*');
            elements.forEach(el => {
                if (typeof reg.upgrade === 'function') {
                    reg.upgrade(el);
                }
            });
        }
    }

    // Wait for async cascades to settle (with optional timeout)
    await waitForSettled(root, idleMs, timeout);
}
```

And `waitForSettled` with timeout support:

```typescript
// waitForSettled.ts
export function waitForSettled(
    root: Node,
    idleMs: number = 100,
    timeout?: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout>;
        let maxTimer: ReturnType<typeof setTimeout> | undefined;

        const mo = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                mo.disconnect();
                if (maxTimer) clearTimeout(maxTimer);
                resolve();
            }, idleMs);
        });

        mo.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        // Initial timer — resolves if no mutations happen at all
        timer = setTimeout(() => {
            mo.disconnect();
            if (maxTimer) clearTimeout(maxTimer);
            resolve();
        }, idleMs);

        // Maximum timeout — rejects if mutations never quiesce
        if (timeout !== undefined) {
            maxTimer = setTimeout(() => {
                mo.disconnect();
                clearTimeout(timer);
                reject(new Error(
                    `initialize: fragment did not settle within ${timeout}ms`
                ));
            }, timeout);
        }
    });
}
```

### Question 3 revisited (double-processing on append)

When the initialized fragment is appended to live DOM:
- CEs are already upgraded — `connectedCallback` fires again (this is expected, CE lifecycle)
- Synthesizer fires `connectedCallback` again — but `activatedRootNodes` WeakSet guards against double-activation
- Mount observers in the live DOM see new elements via MutationObserver — but `#processedDoForElement` guards against double-processing of `do` callbacks
- `registry.get(tagName)` guards prevent double-definition in cede scripts

So the existing guards should handle it. The one edge case: if an observer was created during `initialize` on the fragment and NOT disconnected, it would continue observing alongside the live-DOM observer. But since `initialize` only triggers `registry.initialize()` (which just upgrades), and Synthesizer creates its own observers scoped to the root node, this shouldn't be an issue — the fragment's observers die when the fragment is emptied (all children move to live DOM).

### Ready to implement?

Shall I implement `waitForSettled.ts` and `initialize.ts` now, or do you want to iterate further on the API shape?

---

## Human Response III

Please implement `waitForSettled.ts` and `initialize.ts` as you recommend.
