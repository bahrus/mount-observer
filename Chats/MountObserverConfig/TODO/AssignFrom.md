# Use assignFrom for assignOnMount

---

## Human Ask

It would be useful for assignOnMount to use the more powerful [assignFrom](https://github.com/bahrus/assign-gingerly#assignfrom-and-assignfromasync) rather than assignGingerly, as then some dynamic properties can be set from the mount observer context, or even from other sources with the help of protocol support that assignFrom supports.  The signature is identical, except the options is now 

By far the biggest question becomes what to pass into the options for the "from" parameter.

I think the most useful thing would be for the from parameter to be the mount observer itself.





---

## Kiro Response I

### What `assignFrom` adds over `assignGingerly`

`assignFrom` resolves **RHS values from a source object** before assigning. With `assignGingerly`, you set literal values. With `assignFrom`, you can pull values dynamically:

```javascript
// assignGingerly — literal values only
assignGingerly(element, { title: 'Hello' });

// assignFrom — resolve from source
assignFrom(element, { title: '?.config?.title' }, { from: observer });
// Equivalent to: element.title = observer.config.title
```

Key additions in `assignFrom`:
- `?.` path resolution against `options.from`
- Protocol-based resolution (e.g., `localStorage://key`, custom protocols)
- `#[x]` id-ref resolution (assign to referenced elements)
- `${x}` substitution variables with looped expansion
- `?=` ternary/conditional assignments
- ` =>` handler commands (fire-and-forget async)
- `infer` for inferred property propagation
- `beVigilant` for reactive observation

### Passing the MountObserver as `from`

This is the right call. The MountObserver instance is the natural "context" that has everything you'd want to resolve from:

```javascript
const observer = new MountObserver({
    matching: 'input',
    import: './config.js',
    assignOnMount: {
        title: '?.modules?.0?.defaultTitle',        // Resolve from imported modules
        '?.dataset?.observerId': '?.observer?.id',  // Hypothetical: observer metadata
    },
    assignOptions: {
        withMethods: ['setAttribute']
    }
});
```

But wait — `assignFrom` takes `options.from` as the source. The MountObserver is the observer, but at the time of mount, what's really useful to resolve from? Let me think about what's available:

1. **`observer`** — the MountObserver instance itself
2. **`modules`** — the imported modules array
3. **`rootNode`** — the observed root
4. **`mountConfig`** — the full config object

All of these are already in the `MountContext`. So the most natural `from` would be the **MountContext** object itself:

```javascript
assignFrom(element, this.#assignOnMount, { 
    ...this.#assignOptions,
    from: context  // MountContext has .observer, .modules, .rootNode, .mountConfig
});
```

This way you can resolve any path against the full context:
```javascript
assignOnMount: {
    title: '?.modules?.0?.config?.title',       // From imported module
    '?.dataset?.scope': '?.rootNode?.id',       // Root node's ID
    disabled: '?.mountConfig?.customData?.disabled'  // From config's customData
}
```

### Implementation sketch

Replace `assignGingerly` with `assignFrom` in `#handleMatch`:

```typescript
// In observe():
if(this.#assignOnMount || this.#asgDisMtSource){
    const { default: assignFrom } = await import('assign-gingerly/assignFrom.js');
    this.#assignFromFn = assignFrom;
}

// In #handleMatch:
if (this.#assignOnMount && this.#assignFromFn) {
    const context: MountContext = { modules: this.#modules, observer: this, rootNode, mountConfig: this.#init };
    this.#assignFromFn(element, this.#assignOnMount, { 
        ...this.#assignOptions, 
        from: context 
    });
}
```

### Backward compatibility

`assignFrom` is a superset of `assignGingerly`. When RHS values are plain literals (not `?.` paths), `assignFrom` passes them through to `assignGingerly` unchanged. So existing `assignOnMount` configs with literal values continue to work — they just don't use the resolution features.

### Questions

1. **`from` = MountContext vs MountObserver** — I'm suggesting the full MountContext (which includes the observer as a property). This gives access to `modules`, `rootNode`, `mountConfig` in addition to the observer. Is that over-engineering, or useful?

2. **`assignOnDismount` source** — On dismount, should `from` still be the MountContext? The modules and rootNode are still relevant for computing dismount values.

3. **The public `assignGingerly()` method** — Should it also switch to `assignFrom`? If so, what would `from` be in that case? The caller doesn't have a MountContext. Maybe `from` defaults to the observer itself when called via the public method.

4. **`stageOnMount`** — `assignTentatively` has a different signature. Does `assignFrom` compose with it, or is this only for `assignOnMount`/`assignOnDismount`?

5. **Should we rename the `assignOptions` property?** — Since `AssignFromOptions` extends `IAssignGingerlyOptions` with additional fields (`from`, `protocols`, `withIds`, `infer`, etc.), the existing `assignOptions` type would need to expand. The name still works, but the type widens.

6. **Protocols** — `assignFrom` supports protocol-based resolution (e.g., `localStorage://key`). Should `assignOptions.protocols` be supported in MountConfig for custom resolution? This is powerful but also a security surface — protocols can run arbitrary code.

### My recommendation

Start simple:
1. Replace `assignGingerly` with `assignFrom` in mount/dismount paths
2. Set `from` to the MountContext
3. Keep `assignOptions` as the options object (it already covers `withMethods`, `aka`, etc. — `AssignFromOptions` extends these)
4. Don't expose `protocols` in MountConfig initially — let it be opt-in via the public method or handler code

This gives users path resolution against the context for free, without adding security surface or breaking existing configs.

---

## Human Response I

> **`from` = MountContext vs MountObserver**

Agreed.  MountContext

> **`assignOnDismount` source**

Still MountContext, agree.

> **The public `assignGingerly()` method**

Good catch.

Let's 

1.  Rename the method "assign"
2.  Add a second parameter for options
3.  this.#assignGingerlyFn  should become this.#assignFromFn
4.  Calls to assignGingerly should be changed to assignFrom

> Should `assignOptions.protocols` be supported in MountConfig for custom resolution?

Protocol handlers have to be passed in via JS, and can't be derived from JSON.

I think it is okay to not worry about it or try to filter them out.

## Implementation Notes:

Clear. Let me implement all the changes:

1. Rename `#assignGingerlyFn` → `#assignFromFn`
2. Import `assignFrom` instead of `assignGingerly`
3. Pass `MountContext` as `from` in the options
4. Rename the public `assignGingerly()` method to `assign()` with an options parameter

Now update the `observe()` method — import `assignFrom` instead:

Now update `#handleMatch` to use `assignFrom` with context:

Now update the dismount path:

Now rename the public method from `assignGingerly` to `assign` and update it:

Now let me check diagnostics:

The `IMountObserver` interface still has `assignGingerly` in the type definition. I need to update it to `assign`:

Now update `MountObserver.js`:

The JS file is already updated (likely synced from an earlier edit or compiled). Let me check if the public method is also renamed there:

Good — already renamed. Let me also check the test file references to `assignGingerly`:

Now let me check for any other references to `assignGingerly` as a method name in the codebase (excluding node_modules, chats, and requirements):

Good. Now let me also update the README where it references the `assignGingerly` method:

Let me do a final diagnostics check:

All clean. Here's a summary of the changes:

**Core change: `assignGingerly` → `assignFrom`**

- `MountObserver.ts` / `.js` now imports `assignFrom` from `assign-gingerly/assignFrom.js` instead of `assignGingerly`
- `#assignGingerlyFn` renamed to `#assignFromFn`
- Mount and dismount paths pass `{ ...this.#assignOptions, from: context }` where context is the full `MountContext` (modules, observer, rootNode, mountConfig)

**Public method renamed: `assignGingerly()` → `assign()`**

- New signature: `assign(config, options?)` — accepts optional options parameter
- Options are merged into `#assignOptions` for future mounts
- Uses `assignFrom` with MountContext as `from`

**Updated:**
- `types/mount-observer/types.d.ts` — `IMountObserver` interface
- Tests (`test-assign-gingerly-method.spec.mjs`, `test-assign-gingerly-method.html`)
- README — section renamed and examples updated






