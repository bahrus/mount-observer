# assignOnMount options

---

## Human Ask

One of the examples in README.md inadvertently reveals that we have a shortcoming when it comes to configuring a MountObserver instance:

```JS
const observer = new MountObserver({
   matching: 'input.validated',
   assignOnMount: {
      '?.style Y=': {
        borderColor: 'green',
        backgroundColor: '#f0fff0',
      }, 
      '?.setAttribute': ['aria-invalid', 'false']
   },
   assignOnDismount: {
      '?.style? Y=': {
        borderColor': '',
        backgroundColor': '',
      },
      '?.removeAttribute': 'aria-invalid'
   }
});
observer.observe(document);
```

But a careful look at the underlying api behind this configuration, [assign-gingerly](https://github.com/bahrus/assign-gingerly#example-3c---method-calls-with-withmethods) indicates, that use of methods, such as setAttribute and removeattribute needs to be explicitly permitted/clarified via the withMethods setting, within the larger "options" parameter.

I don't to solve this just for methods.  I would like to establish how we want to allow specifying the full option object, that has many more configurable settings.  Once that is established, move on to implementation.


---

## Kiro Response I

### The problem stated clearly

Currently, `assignOnMount` only passes the "source" object (what to assign) but has no way to pass the `IAssignGingerlyOptions` parameter that `assignGingerly` accepts. This means features like `withMethods`, `aka`, `withAsyncMethods`, `signal`, and `enhance` are inaccessible from MountConfig.

The current code in MountObserver:
```typescript
element.assignGingerly(this.#asgMtSource);
```

But the full signature is:
```typescript
assignGingerly(target, source, options?, permissions?)
```

### Design options

**Option A: Sibling property**

Add a dedicated options property alongside each assign property:

```typescript
interface MountConfig {
    assignOnMount?: Record<string, any>;
    assignOnMountOptions?: IAssignGingerlyOptions;
    assignOnDismount?: Record<string, any>;
    assignOnDismountOptions?: IAssignGingerlyOptions;
    stageOnMount?: Record<string, any>;
    stageOnMountOptions?: IAssignGingerlyOptions;
}
```

Usage:
```javascript
const observer = new MountObserver({
    matching: 'input.validated',
    assignOnMount: {
        '?.style Y=': { borderColor: 'green' },
        '?.setAttribute': ['aria-invalid', 'false']
    },
    assignOnMountOptions: {
        withMethods: ['setAttribute', 'removeAttribute']
    }
});
```

**Pros:** Flat, JSON-serializable, clear separation.
**Cons:** Proliferates properties (6 new ones counting stage/dismount).

**Option B: Wrapper object**

Wrap source + options in a single object:

```typescript
interface MountConfig {
    assignOnMount?: Record<string, any> | { source: Record<string, any>; options: IAssignGingerlyOptions };
}
```

Usage:
```javascript
assignOnMount: {
    source: {
        '?.style Y=': { borderColor: 'green' },
        '?.setAttribute': ['aria-invalid', 'false']
    },
    options: {
        withMethods: ['setAttribute', 'removeAttribute']
    }
}
```

**Pros:** Self-contained, one property per concern.
**Cons:** Breaks backward compatibility (existing configs that pass the source directly would need migration). Also "source" is an awkward property name for what used to be the whole value.

**Option C: Discriminated by presence of reserved key**

Use a reserved key within the assignOnMount object to carry options:

```typescript
assignOnMount: {
    '?.style Y=': { borderColor: 'green' },
    '?.setAttribute': ['aria-invalid', 'false'],
    [Symbol.for('ag-options')]: { withMethods: ['setAttribute'] }
}
```

**Pros:** Backward compatible, no new properties.
**Cons:** Symbols aren't JSON-serializable (breaks the JSON-friendly goal). Could use a string key like `__options__` but that's fragile.

**Option D: Top-level `assignOptions` shared by all three**

A single options object that applies to all assign operations:

```typescript
interface MountConfig {
    assignOnMount?: Record<string, any>;
    assignOnDismount?: Record<string, any>;
    stageOnMount?: Record<string, any>;
    assignOptions?: IAssignGingerlyOptions;
}
```

Usage:
```javascript
const observer = new MountObserver({
    matching: 'input.validated',
    assignOnMount: {
        '?.style Y=': { borderColor: 'green' },
        '?.setAttribute': ['aria-invalid', 'false']
    },
    assignOnDismount: {
        '?.removeAttribute': 'aria-invalid'
    },
    assignOptions: {
        withMethods: ['setAttribute', 'removeAttribute']
    }
});
```

**Pros:** Single property, shared across mount/dismount/stage. Most common case is that you need the same methods/aliases for all operations on the same observer. JSON-serializable. Backward compatible. Minimal API surface.
**Cons:** Can't have different options for mount vs dismount (edge case — when would you need different `withMethods` for mount vs dismount?).

### My recommendation: Option D

One `assignOptions` property on MountConfig, shared by all assign operations. Reasons:

1. **Minimal API surface** — one new property vs six
2. **JSON-serializable** — works in MOSE JSON configs
3. **Backward compatible** — existing configs work unchanged
4. **Pragmatic** — in practice, if you're using `setAttribute` on mount, you'll use `removeAttribute` on dismount with the same options
5. **Extensible** — if per-operation options are ever needed, Option A can be added later as an override

If per-operation overrides ever become necessary, you could add `assignOnMountOptions` etc. that merge on top of the shared `assignOptions` (specific beats general).

### Implementation sketch

```typescript
// In MountObserver constructor:
this.#assignOptions = mergedConfig.assignOptions;

// In #handleMatch:
if (this.#asgMtSource) {
    element.assignGingerly(this.#asgMtSource, this.#assignOptions);
}

// In dismount:
if (this.#asgDisMtSource) {
    element.assignGingerly(this.#asgDisMtSource, this.#assignOptions);
}
```

The `element.assignGingerly()` method (from `object-extension.js`) would need to accept and forward the options parameter. Currently it likely just calls `assignGingerly(this, source)` — it would need to become `assignGingerly(this, source, options)`.

### Questions

1. Does `object-extension.js` currently support passing options to `element.assignGingerly(source, options)`? If not, that's a prerequisite change in assign-gingerly.

2. Should `assignOptions` also apply to `stageOnMount` (via `assignTentatively`)? The `assignTentatively` function may have its own options signature.

3. The `signal` option in `IAssignGingerlyOptions` is interesting — should it be wired to the observer's `disconnectedSignal` automatically? That way reactive subscriptions (`@eachTime`) would auto-cleanup when the observer disconnects.
