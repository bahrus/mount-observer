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
