# Register EnhancementConfig in Enhancement Registry

## Overview

This requirement adds basic integration between MountObserver and the enhancement registry system from assign-gingerly. When a `MountConfig` includes an optional `enhancementConfig` property, that configuration will be registered in the root node's `customElementRegistry.enhancementRegistry`.

This is a foundational step that enables future enhancements like `spawn` class instantiation and `enhKey` access patterns.

## Scope

**In Scope:**
- Register `enhancementConfig` in the enhancement registry during `observe()`
- Prevent duplicate registrations using reference equality

**Out of Scope (Future Requirements):**
- `spawn` class instantiation
- `enhKey` and `element.enh[enhKey]` access
- `withAttrs` attribute parsing
- `disposeOn` lifecycle integration
- Enhancement disposal and cleanup

## Background

### What is the Enhancement Registry?

The enhancement registry (from assign-gingerly) is a system for managing element enhancements in Chrome 146+. Each `CustomElementRegistry` has an `enhancementRegistry` property that stores `EnhancementConfig` objects.

### Current Architecture

`MountConfig` has an optional `enhancementConfig` field:

```typescript
export interface MountConfig {
    matching: string;
    whereInstanceOf?: Constructor | Constructor[];
    // ... other mount-observer properties
    enhancementConfig?: EnhancementConfig;  // Optional enhancement integration
}
```

The `EnhancementConfig` interface (from assign-gingerly):

```typescript
export interface EnhancementConfig<T = any> {
  spawn: { 
    new (obj?: any, ctx?: SpawnContext<T>, initVals?: Partial<T>): T;
    canSpawn?: (obj: any, ctx?: SpawnContext<T>) => boolean;
  };
  withAttrs?: AttrPatterns<T>;
  allowUnprefixed?: string | RegExp;
  symlinks?: { [key: symbol]: keyof T };
  enhKey?: EnhKey;
  lifecycleKeys?: true | { dispose?: string | symbol, resolved?: string | symbol };
  disposeOn?: DisposeEvent | DisposeEvent[];
}
```

## Implementation Requirements

### 1. Register enhancementConfig During observe()

When `observe()` is called and `MountConfig.enhancementConfig` is provided:

1. Get the root node's `customElementRegistry.enhancementRegistry`
2. Check if the exact same `enhancementConfig` object is already registered (reference equality)
3. If not already registered, push it to the registry

**Implementation:**
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    // Register enhancementConfig if provided
    if (this.#init.enhancementConfig && rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            // Check for duplicate using reference equality
            const items = registry.getItems();
            if (!items.includes(this.#init.enhancementConfig)) {
                registry.push(this.#init.enhancementConfig);
            }
        }
    }
    
    // ... rest of observe logic ...
}
```

### 2. Duplicate Detection Strategy

Use **reference equality** to detect duplicates:

- Simple and efficient (`Array.includes()` check)
- Prevents the same `enhancementConfig` object from being registered multiple times
- Allows different objects with identical properties to coexist
- No false positives

**Why reference equality?**
- The `enhancementConfig` is a separate, optional object
- Developers can intentionally share the same config object across observers
- Simple implementation without complex property comparisons
- Prevents the most common mistake (re-observing with same instance)

## Edge Cases

### Case 1: No enhancementConfig Provided

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    do: (element) => { /* ... */ }
});
observer.observe(document);
```

**Expected behavior**: No registry interaction at all. MountObserver works independently.

### Case 2: Same MountObserver, Multiple Root Nodes

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { /* ... */ }
});
observer.observe(document.body);
observer.observe(document.querySelector('#container'));
```

**Expected behavior**: Register once in each root node's registry (if they have different registries).

**Note**: Each root node may have its own `customElementRegistry`, so we register per-registry.

### Case 3: Multiple Observers, Same enhancementConfig Object

```typescript
const sharedConfig = { spawn: ButtonEnh };
const observer1 = new MountObserver({ matching: 'button', enhancementConfig: sharedConfig });
const observer2 = new MountObserver({ matching: 'input', enhancementConfig: sharedConfig });
observer1.observe(document);
observer2.observe(document);
```

**Expected behavior**: Register only once (same object reference detected).

### Case 4: Re-observing After Disconnect

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { spawn: ButtonEnh }
});
observer.observe(document);
observer.disconnect();
observer.observe(document);  // Re-observe
```

**Expected behavior**: The `enhancementConfig` remains in the registry (not removed on disconnect). Reference equality check will prevent duplicate registration.

## Implementation Checklist

- [ ] Implement registry registration in `observe()` method
- [ ] Implement reference equality check to prevent duplicates
- [ ] Handle case where `enhancementConfig` is undefined (skip all registry logic)
- [ ] Import `EnhancementRegistry` type from assign-gingerly
- [ ] Compile TypeScript: `tsc`
- [ ] Add tests for registry integration
- [ ] Document the feature in README.md

## Testing Requirements

Create test file: `tests/test-enhancement-registry.html` and `tests/test-enhancement-registry.spec.mjs`

**Test scenarios:**
1. No enhancementConfig provided - no registry interaction
2. enhancementConfig provided - successfully registered
3. Same observer observes twice - only registered once (reference equality)
4. Multiple observers with same enhancementConfig object - only registered once
5. Multiple observers with different enhancementConfig objects - both registered
6. Re-observe after disconnect - still only registered once (reference equality)
7. Multiple root nodes - registers in each registry separately

## Related Files

- `types.d.ts` - `MountConfig` interface with `enhancementConfig` field
- `MountObserver.ts` - Main implementation file
- `node_modules/assign-gingerly/types.d.ts` - `EnhancementConfig` and `EnhancementRegistry` types
- `node_modules/assign-gingerly/object-extension.ts` - Enhancement registry implementation

## Future Requirements

After this foundational work is complete, future requirements will add:

1. **Spawn Integration**: Instantiate `spawn` classes for matching elements
2. **enhKey Access**: Enable `element.enh[enhKey]` access patterns
3. **Attribute Parsing**: Support `withAttrs` for automatic attribute parsing
4. **Lifecycle Integration**: Integrate `disposeOn` with mount/dismount events
5. **Enhancement Disposal**: Call `dispose` methods and clean up instances
