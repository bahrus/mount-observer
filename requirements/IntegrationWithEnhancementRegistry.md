# Integration With Enhancement Registry

## Overview

This requirement integrates MountObserver with the enhancement registry system from assign-gingerly. When a `MountConfig` includes an optional `enhancementConfig` property, that configuration will be registered in the element's `customElementRegistry.enhancementRegistry`, enabling seamless integration between mount-observer and the enhancement ecosystem.

## Background

### What is the Enhancement Registry?

The enhancement registry (from assign-gingerly) is a system for managing element enhancements in Chrome 146+. It provides:

1. **Scoped registries**: Each `CustomElementRegistry` has its own `enhancementRegistry` property
2. **Enhancement spawning**: Classes can be instantiated and attached to elements via the `enh` namespace
3. **Lifecycle management**: Enhancements can have `dispose` and `resolved` lifecycle hooks
4. **Attribute parsing**: Enhancements can automatically parse attributes using `withAttrs`

### Why Integrate MountObserver?

`MountConfig` now has an optional `enhancementConfig` field that can contain an `EnhancementConfig`:

```typescript
export interface MountConfig {
    matching: string;
    withInstance?: Constructor | Constructor[];
    // ... mount-observer specific properties
    enhancementConfig?: EnhancementConfig;
}
```

By registering the `enhancementConfig` in the enhancement registry when provided, we enable:

1. **Unified enhancement system**: MountObserver configurations can optionally participate in the enhancement ecosystem
2. **Element.enh integration**: Elements can access mount-observer enhancements via `element.enh`
3. **Lifecycle coordination**: Mount/dismount can trigger enhancement lifecycle methods
4. **Attribute-driven enhancements**: `withAttrs` can be used to configure enhancements from HTML attributes
5. **Clean separation**: MountObserver features remain independent; enhancement integration is opt-in

## Key Concepts

### EnhancementConfig Properties

The `EnhancementConfig` interface (which can be optionally included in `MountConfig.enhancementConfig`) includes:

```typescript
interface EnhancementConfig<T = any> {
  spawn: { 
    new (obj?: any, ctx?: SpawnContext<T>, initVals?: Partial<T>): T;
    canSpawn?: (obj: any, ctx?: SpawnContext<T>) => boolean;
  };
  symlinks?: { [key: symbol]: keyof T };
  enhKey?: EnhKey;  // String identifier for enh.set proxy access
  withAttrs?: AttrPatterns<T>;  // Automatic attribute parsing
  lifecycleKeys?: true | { dispose?: string | symbol, resolved?: string | symbol };
  disposeOn?: DisposeEvent | DisposeEvent[];  // 'disconnect' | 'dismount' | 'exit' | 'dispose'
  allowUnprefixed?: string | RegExp;
}
```

### MountConfig Properties

`MountConfig` is now independent with an optional enhancement integration:

```typescript
interface MountConfig {
    matching: string;  // CSS selector for element matching
    withInstance?: Constructor | Constructor[];
    withMediaMatching?: string | MediaQueryList;
    withScopePerimeter?: string;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: string | DoCallback | (string | DoCallback)[];
    loadingEagerness?: 'eager' | 'lazy';
    assignOnMount?: Record<string, any>;
    assignOnDismount?: Record<string, any>;
    stageOnMount?: Record<string, any>;
    getPlayByPlay?: boolean;
    mountedElemEmits?: EventConfig | EventConfig[];
    reference?: number | number[];
    customData?: unknown;
    enhancementConfig?: EnhancementConfig;  // Optional enhancement integration
}
```

## Implementation Requirements

### 1. Register EnhancementConfig in Enhancement Registry

When `observe()` is called and `MountConfig.enhancementConfig` is provided, the MountObserver should:

1. Get the element's `customElementRegistry.enhancementRegistry`
2. Push the `enhancementConfig` into the registry (not the entire `MountConfig`)
3. This makes the enhancement configuration discoverable by other enhancement-aware code

**Example:**
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    // Register the enhancementConfig if provided
    if (this.#init.enhancementConfig && rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            registry.push(this.#init.enhancementConfig);
        }
    }
    
    // ... rest of observe logic ...
}
```

### 2. Support for enhKey

If the `enhancementConfig` includes an `enhKey`, mounted elements should be accessible via `element.enh[enhKey]`:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        spawn: ButtonEnhancement,
        enhKey: 'myButton',  // Enhancement key
    },
    do: (element, ctx) => {
        // Additional mount logic
    }
});

observer.observe(document);

// Later, access the enhancement
const button = document.querySelector('button');
console.log(button.enh.myButton);  // Should be accessible
```

### 3. Support for spawn Property

If the `enhancementConfig` includes a `spawn` class, it should be instantiated for each matching element:

```typescript
class ButtonEnhancement {
    constructor(element, ctx, initVals) {
        this.element = element;
        this.clickCount = 0;
        element.addEventListener('click', () => this.clickCount++);
    }
}

const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        spawn: ButtonEnhancement,
        enhKey: 'counter',
    }
});

observer.observe(document);

// Access the spawned instance
const button = document.querySelector('button');
button.click();
console.log(button.enh.counter.clickCount);  // 1
```

### 4. Lifecycle Integration with disposeOn

The `disposeOn` property in `enhancementConfig` specifies when enhancements should be disposed:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        spawn: ButtonEnhancement,
        enhKey: 'myButton',
        disposeOn: 'dismount',  // Dispose on dismount
        lifecycleKeys: {
            dispose: 'cleanup'  // Call cleanup() method on disposal
        }
    }
});
```

When the element dismounts, MountObserver should:
1. Call the `dispose` method (if specified in `lifecycleKeys`)
2. Remove the enhancement from `element.enh`
3. Clean up any references

### 5. Attribute Parsing with withAttrs

The `withAttrs` property in `enhancementConfig` enables automatic attribute parsing:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        spawn: ButtonConfig,
        enhKey: 'config',
        withAttrs: {
            base: 'data-btn',  // Prefix for attributes
            theme: 'theme',    // Maps data-btn-theme to config.theme
            size: 'size'       // Maps data-btn-size to config.size
        }
    }
});

// HTML: <button data-btn-theme="dark" data-btn-size="large">Click</button>
// Result: button.enh.config.theme === 'dark', button.enh.config.size === 'large'
```

## Use Cases

### Use Case 1: Simple Enhancement Registration

```typescript
const observer = new MountObserver({
    matching: 'button.enhanced',
    enhancementConfig: {
        enhKey: 'buttonEnh',
    },
    do: (element) => {
        element.dataset.enhanced = 'true';
    }
});

observer.observe(document);

// The enhancementConfig is now in the registry
const button = document.querySelector('button.enhanced');
const registry = button.customElementRegistry.enhancementRegistry;
const config = registry.findByEnhKey('buttonEnh');
console.log(config.enhKey);  // 'buttonEnh'
```

### Use Case 2: Spawned Enhancement with Lifecycle

```typescript
class TooltipEnhancement extends EventTarget {
    constructor(element, ctx, initVals) {
        super();
        this.element = element;
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        document.body.appendChild(this.tooltip);
        
        element.addEventListener('mouseenter', () => this.show());
        element.addEventListener('mouseleave', () => this.hide());
    }
    
    show() {
        this.tooltip.textContent = this.element.title;
        this.tooltip.style.display = 'block';
    }
    
    hide() {
        this.tooltip.style.display = 'none';
    }
    
    dispose() {
        this.tooltip.remove();
    }
}

const observer = new MountObserver({
    matching: '[title]',
    enhancementConfig: {
        spawn: TooltipEnhancement,
        enhKey: 'tooltip',
        disposeOn: 'disconnect',
        lifecycleKeys: {
            dispose: 'dispose'
        }
    }
});

observer.observe(document);
```

### Use Case 3: Attribute-Driven Configuration

```typescript
class FormFieldEnhancement {
    constructor(element, ctx, initVals) {
        this.element = element;
        Object.assign(this, initVals);  // Apply parsed attributes
        this.validate();
    }
    
    validate() {
        if (this.required && !this.element.value) {
            this.element.classList.add('error');
        }
    }
}

const observer = new MountObserver({
    matching: 'input',
    enhancementConfig: {
        spawn: FormFieldEnhancement,
        enhKey: 'field',
        withAttrs: {
            base: 'data-field',
            required: {
                instanceOf: 'Boolean',
                mapsTo: 'required'
            },
            minLength: {
                instanceOf: 'Number',
                mapsTo: 'minLength'
            }
        }
    }
});

// HTML: <input data-field-required="true" data-field-min-length="5">
// Result: input.enh.field.required === true, input.enh.field.minLength === 5
```

## Implementation Checklist

- [ ] Register `enhancementConfig` (when provided) in `customElementRegistry.enhancementRegistry` during `observe()`
- [ ] Support `enhKey` property for `element.enh[enhKey]` access
- [ ] Support `spawn` property to instantiate enhancement classes
- [ ] Pass `SpawnContext` with `{ mountInfo: enhancementConfig }` to spawned constructors
- [ ] Integrate `disposeOn` with mount/dismount/disconnect lifecycle
- [ ] Call `dispose` method (from `lifecycleKeys`) when disposing enhancements
- [ ] Support `withAttrs` for automatic attribute parsing
- [ ] Store spawned instances in the global instance map (from assign-gingerly)
- [ ] Clean up instances and references on disposal
- [ ] Implement reference equality check to prevent duplicate registrations (Option 2)
- [ ] Remove `enhancementConfig` from registry on `disconnect()`
- [ ] Add tests for enhancement registry integration
- [ ] Document the integration in README.md

## Duplicate Detection Strategy

### The Problem

When `observe()` is called with a `MountConfig` that includes an `enhancementConfig`, we need to decide whether to add it to the enhancement registry. The key question: should we prevent the same `enhancementConfig` object from being registered multiple times?

### Chosen Strategy: Option 2 - Reference Equality

**Approach**: Check if the exact same `enhancementConfig` object is already in the registry using reference equality.

**Implementation**:
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (this.#init.enhancementConfig && rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            // Check if this exact object is already registered
            const items = registry.getItems();
            const alreadyRegistered = items.includes(this.#init.enhancementConfig);
            if (!alreadyRegistered) {
                registry.push(this.#init.enhancementConfig);
            }
        }
    }
    
    // ... rest of observe logic ...
}
```

**Why This Works**:

1. **Simple and efficient**: Just a reference check using `Array.includes()`
2. **Prevents exact duplicates**: Same `MountObserver` instance won't register multiple times
3. **Allows intentional duplicates**: Different `MountObserver` instances with identical configs can coexist (they're different objects)
4. **No false positives**: Won't accidentally block legitimate use cases
5. **Clean architecture**: The `enhancementConfig` is a separate object that can be shared or unique as needed

**Pros**:
- Minimal performance overhead
- No complex comparison logic needed
- Works even without `enhKey`
- Prevents the most common mistake (re-observing with same instance)
- Allows flexibility for advanced use cases

**Cons**:
- Doesn't detect "semantic duplicates" (different objects with same properties)
- Multiple observers with identical configs would all register
- Doesn't prevent `enhKey` collisions (but that's handled by assign-gingerly)

### Edge Cases

#### Case 1: Same MountObserver, Multiple Root Nodes

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { enhKey: 'btn', spawn: ButtonEnh }
});
observer.observe(document.body);
observer.observe(document.querySelector('#container'));
```

**Expected behavior**: Register once in each root node's registry (if they have different registries).

**Rationale**: Each root node may have its own `customElementRegistry`, so we register per-registry, not globally.

#### Case 2: Multiple Observers, Same enhancementConfig Object

```typescript
const sharedConfig = { enhKey: 'btn', spawn: ButtonEnh };
const observer1 = new MountObserver({ matching: 'button', enhancementConfig: sharedConfig });
const observer2 = new MountObserver({ matching: 'input', enhancementConfig: sharedConfig });
observer1.observe(document);
observer2.observe(document);
```

**Expected behavior**: Register only once (same object reference).

**Rationale**: Reference equality check prevents duplicate registration of the same object.

#### Case 3: Multiple Observers, Different enhancementConfig Objects

```typescript
const observer1 = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { enhKey: 'btn', spawn: ButtonEnh }
});
const observer2 = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { enhKey: 'btn', spawn: ButtonEnh }  // Different object, same properties
});
observer1.observe(document);
observer2.observe(document);
```

**Expected behavior**: Both register successfully (different object references).

**Note**: This creates an `enhKey` collision. The assign-gingerly library handles this - typically last-one-wins for `element.enh.btn` access.

#### Case 4: Re-observing After Disconnect

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    enhancementConfig: { enhKey: 'btn', spawn: ButtonEnh }
});
observer.observe(document);
observer.disconnect();
observer.observe(document);  // Re-observe
```

**Expected behavior**: Should re-register after disconnect.

**Implementation**: On `disconnect()`, remove the `enhancementConfig` from the registry. On re-observe, the reference check will pass and it will register again.

#### Case 5: No enhancementConfig Provided

```typescript
const observer = new MountObserver({ 
    matching: 'button',
    do: (element) => { /* ... */ }
});
observer.observe(document);
```

**Expected behavior**: No registry interaction at all.

**Rationale**: Enhancement integration is completely optional. MountObserver works independently without it.

### Implementation Details

**Store registry reference for cleanup**:
```typescript
class MountObserver {
    #registryRef: WeakRef<BaseRegistry> | undefined;
    
    async observe(rootNode: Node): Promise<void> {
        // ... existing code ...
        
        if (this.#init.enhancementConfig && rootNode instanceof Element) {
            const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
            if (registry) {
                const items = registry.getItems();
                if (!items.includes(this.#init.enhancementConfig)) {
                    registry.push(this.#init.enhancementConfig);
                    this.#registryRef = new WeakRef(registry);
                }
            }
        }
    }
    
    disconnect(): void {
        // ... existing cleanup ...
        
        // Remove from registry
        const registry = this.#registryRef?.deref();
        if (registry && this.#init.enhancementConfig) {
            const items = registry.getItems();
            const index = items.indexOf(this.#init.enhancementConfig);
            if (index !== -1) {
                items.splice(index, 1);
            }
        }
    }
}
```

### Why Not Other Options?

**Why not check by enhKey?**
- `enhKey` is optional - many enhancements won't have one
- Doesn't prevent re-registration of the same object
- More complex logic for marginal benefit
- assign-gingerly already handles `enhKey` collisions

**Why not check by matching selector?**
- Too restrictive - multiple observers with same selector are valid
- Complex comparison logic (which properties to compare?)
- Would prevent legitimate use cases
- Doesn't align with the object-oriented design

**Why not allow all duplicates?**
- Would cause memory leaks when re-observing
- Registry would grow unbounded
- Confusing behavior for developers

### Implementation Checklist for Duplicate Detection

- [ ] Implement reference equality check in `observe()`
- [ ] Store registry reference using `WeakRef` for cleanup
- [ ] Remove `enhancementConfig` from registry on `disconnect()`
- [ ] Handle case where `enhancementConfig` is undefined (skip registry logic)
- [ ] Handle multiple root nodes with separate registries
- [ ] Add tests for duplicate detection scenarios
- [ ] Document duplicate detection behavior in README.md

## Questions to Resolve

1. **Registry scope**: Should we register the enhancementConfig in the rootNode's registry, or in each matched element's registry?
   - **Decision**: Register in rootNode's registry, as that's the scope of observation

2. **Multiple observers**: If multiple MountObservers observe the same element with different configs, how should they coexist?
   - **Decision**: Each enhancementConfig is a separate registry item with its own `enhKey` (if specified)

3. **Spawn timing**: When should the `spawn` class be instantiated?
   - **Decision**: During `#handleMatch()`, after imports load but before `do` callbacks

4. **Disposal timing**: When should enhancements be disposed?
   - **Decision**: During `#handleRemoval()`, based on `disposeOn` configuration in enhancementConfig

5. **Backward compatibility**: How do we ensure this doesn't break existing code that doesn't use enhancements?
   - **Decision**: Enhancement integration is completely optional via `enhancementConfig` field. All existing code continues to work without changes.

6. **Disconnect cleanup**: Should `disconnect()` remove the `enhancementConfig` from the enhancement registry?
   - **Decision**: Yes, to allow clean re-observation and prevent stale registrations

7. **Duplicate detection**: How should we handle duplicate registrations?
   - **Decision**: Use reference equality (Option 2) - simple, efficient, prevents exact duplicates while allowing flexibility

## Related Files

- `node_modules/assign-gingerly/object-extension.ts` - Enhancement registry implementation
- `node_modules/assign-gingerly/types.d.ts` - `EnhancementConfig` interface
- `node_modules/assign-gingerly/README.md` (line 508+) - Enhancement registry documentation
- `types.d.ts` - `MountConfig` interface (extends `EnhancementConfig`)
- `MountObserver.ts` - Main implementation file