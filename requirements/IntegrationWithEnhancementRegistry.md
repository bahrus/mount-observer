# Integration With Enhancement Registry

## Overview

This requirement integrates MountObserver with the enhancement registry system from assign-gingerly. The goal is to automatically register each `MountConfig` as an `EnhancementConfig` in the element's `customElementRegistry.enhancementRegistry`, enabling seamless integration between mount-observer and the enhancement ecosystem.

## Background

### What is the Enhancement Registry?

The enhancement registry (from assign-gingerly) is a system for managing element enhancements in Chrome 146+. It provides:

1. **Scoped registries**: Each `CustomElementRegistry` has its own `enhancementRegistry` property
2. **Enhancement spawning**: Classes can be instantiated and attached to elements via the `enh` namespace
3. **Lifecycle management**: Enhancements can have `dispose` and `resolved` lifecycle hooks
4. **Attribute parsing**: Enhancements can automatically parse attributes using `withAttrs`

### Why Integrate MountObserver?

`MountConfig` already extends `EnhancementConfig`, which means it has all the properties needed to be a valid enhancement registry item:

```typescript
export interface MountConfig extends EnhancementConfig {
    matching: string;
    withInstance?: Constructor | Constructor[];
    // ... mount-observer specific properties
}
```

By registering the `MountConfig` in the enhancement registry, we enable:

1. **Unified enhancement system**: MountObserver configurations become discoverable enhancements
2. **Element.enh integration**: Elements can access mount-observer enhancements via `element.enh`
3. **Lifecycle coordination**: Mount/dismount can trigger enhancement lifecycle methods
4. **Attribute-driven enhancements**: `withAttrs` can be used to configure enhancements from HTML attributes

## Key Concepts

### EnhancementConfig Properties

The `EnhancementConfig` interface (which `MountConfig` extends) includes:

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

### MountConfig-Specific Properties

MountObserver adds these properties on top of `EnhancementConfig`:

```typescript
interface MountConfig extends EnhancementConfig {
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
}
```

## Implementation Requirements

### 1. Register MountConfig in Enhancement Registry

When `observe()` is called, the MountObserver should:

1. Get the element's `customElementRegistry.enhancementRegistry`
2. Push the `MountConfig` into the registry
3. This makes the configuration discoverable by other enhancement-aware code

**Example:**
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    // Register this MountConfig as an enhancement
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            registry.push(this.#init);
        }
    }
    
    // ... rest of observe logic ...
}
```

### 2. Support for enhKey

If the `MountConfig` includes an `enhKey`, mounted elements should be accessible via `element.enh[enhKey]`:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhKey: 'myButton',  // NEW: Enhancement key
    do: (element, ctx) => {
        // Enhancement logic
    }
});

observer.observe(document);

// Later, access the enhancement
const button = document.querySelector('button');
console.log(button.enh.myButton);  // Should be accessible
```

### 3. Support for spawn Property

If the `MountConfig` includes a `spawn` class, it should be instantiated for each matching element:

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
    enhKey: 'counter',
    spawn: ButtonEnhancement  // NEW: Spawn class
});

observer.observe(document);

// Access the spawned instance
const button = document.querySelector('button');
button.click();
console.log(button.enh.counter.clickCount);  // 1
```

### 4. Lifecycle Integration with disposeOn

The `disposeOn` property specifies when enhancements should be disposed:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhKey: 'myButton',
    spawn: ButtonEnhancement,
    disposeOn: 'dismount',  // NEW: Dispose on dismount
    lifecycleKeys: {
        dispose: 'cleanup'  // Call cleanup() method on disposal
    }
});
```

When the element dismounts, MountObserver should:
1. Call the `dispose` method (if specified in `lifecycleKeys`)
2. Remove the enhancement from `element.enh`
3. Clean up any references

### 5. Attribute Parsing with withAttrs

The `withAttrs` property enables automatic attribute parsing:

```typescript
const observer = new MountObserver({
    matching: 'button',
    enhKey: 'config',
    spawn: ButtonConfig,
    withAttrs: {
        base: 'data-btn',  // Prefix for attributes
        theme: 'theme',    // Maps data-btn-theme to config.theme
        size: 'size'       // Maps data-btn-size to config.size
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
    enhKey: 'buttonEnh',
    do: (element) => {
        element.dataset.enhanced = 'true';
    }
});

observer.observe(document);

// The MountConfig is now in the registry
const button = document.querySelector('button.enhanced');
const registry = button.customElementRegistry.enhancementRegistry;
const config = registry.findByEnhKey('buttonEnh');
console.log(config.matching);  // 'button.enhanced'
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
    enhKey: 'tooltip',
    spawn: TooltipEnhancement,
    disposeOn: 'disconnect',
    lifecycleKeys: {
        dispose: 'dispose'
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
    enhKey: 'field',
    spawn: FormFieldEnhancement,
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
});

// HTML: <input data-field-required="true" data-field-min-length="5">
// Result: input.enh.field.required === true, input.enh.field.minLength === 5
```

## Implementation Checklist

- [ ] Register `MountConfig` in `customElementRegistry.enhancementRegistry` during `observe()`
- [ ] Support `enhKey` property for `element.enh[enhKey]` access
- [ ] Support `spawn` property to instantiate enhancement classes
- [ ] Pass `SpawnContext` with `{ mountInfo: MountConfig }` to spawned constructors
- [ ] Integrate `disposeOn` with mount/dismount/disconnect lifecycle
- [ ] Call `dispose` method (from `lifecycleKeys`) when disposing enhancements
- [ ] Support `withAttrs` for automatic attribute parsing
- [ ] Store spawned instances in the global instance map (from assign-gingerly)
- [ ] Clean up instances and references on disposal
- [ ] Add tests for enhancement registry integration
- [ ] Document the integration in README.md

## Duplicate Detection Strategy

### The Problem

When `observe()` is called, we need to decide whether to add the `MountConfig` to the enhancement registry. But what if:

1. The same `MountObserver` instance calls `observe()` multiple times on different root nodes?
2. Multiple `MountObserver` instances are created with identical or similar `MountConfig` objects?
3. A `MountObserver` is created with a `MountConfig` that has the same `enhKey` as an existing registry item?

We need a clear strategy for detecting and handling duplicates.

### Available Detection Methods

The `BaseRegistry` class provides these methods for finding existing items:

```typescript
class BaseRegistry {
  findBySymbol(symbol: symbol | string): EnhancementConfig | undefined;
  findByEnhKey(enhKey: string | symbol): EnhancementConfig | undefined;
  getItems(): EnhancementConfig[];
}
```

### Strategy Options

#### Option 1: Check by enhKey (Recommended)

**Approach**: Before adding to registry, check if an item with the same `enhKey` already exists.

**Implementation**:
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry && this.#init.enhKey) {
            // Check for duplicate by enhKey
            const existing = registry.findByEnhKey(this.#init.enhKey);
            if (!existing) {
                registry.push(this.#init);
            }
            // If exists, silently skip (or log warning)
        }
    }
}
```

**Pros**:
- Simple and efficient
- Prevents `enhKey` collisions
- Aligns with how enhancements are accessed (`element.enh[enhKey]`)
- Clear semantic meaning: same key = same enhancement

**Cons**:
- Only works if `enhKey` is specified
- Doesn't detect duplicates when `enhKey` is undefined
- Multiple observers with same `enhKey` but different logic would conflict

**When duplicates occur**:
- Same `enhKey` used by different `MountObserver` instances
- Re-observing with the same `MountObserver` instance

**Behavior on duplicate**: Skip registration, use existing enhancement

#### Option 2: Check by Reference Equality

**Approach**: Check if the exact same `MountConfig` object is already in the registry.

**Implementation**:
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            const items = registry.getItems();
            const alreadyRegistered = items.includes(this.#init);
            if (!alreadyRegistered) {
                registry.push(this.#init);
            }
        }
    }
}
```

**Pros**:
- Works even without `enhKey`
- Prevents exact duplicate registrations
- Simple reference check (fast)

**Cons**:
- Doesn't detect "semantic duplicates" (different objects with same properties)
- Multiple observers with identical configs would all register
- Less useful for preventing logical conflicts

**When duplicates occur**:
- Same `MountObserver` instance observes multiple times
- Same `MountConfig` object passed to multiple observers

**Behavior on duplicate**: Skip registration

#### Option 3: Check by Matching Selector + Properties

**Approach**: Consider two configs duplicates if they have the same `matching` selector and other key properties.

**Implementation**:
```typescript
function configsMatch(a: MountConfig, b: MountConfig): boolean {
    return a.matching === b.matching &&
           a.enhKey === b.enhKey &&
           a.withInstance === b.withInstance &&
           a.withMediaMatching === b.withMediaMatching;
}

async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            const items = registry.getItems();
            const duplicate = items.find(item => configsMatch(item, this.#init));
            if (!duplicate) {
                registry.push(this.#init);
            }
        }
    }
}
```

**Pros**:
- Detects semantic duplicates
- Prevents redundant observers with same matching logic
- More intelligent duplicate detection

**Cons**:
- Complex to implement (which properties to compare?)
- Slower (requires deep comparison)
- May prevent legitimate use cases (same selector, different `do` callbacks)
- Unclear which properties should be compared

**When duplicates occur**:
- Different observers with same selector and key properties

**Behavior on duplicate**: Skip registration

#### Option 4: Allow All Duplicates

**Approach**: Never check for duplicates; always add to registry.

**Implementation**:
```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            registry.push(this.#init);  // Always add
        }
    }
}
```

**Pros**:
- Simplest implementation
- No performance overhead
- Allows maximum flexibility
- No risk of preventing legitimate use cases

**Cons**:
- Registry can grow unbounded with duplicates
- `enhKey` collisions cause last-one-wins behavior
- Memory waste from duplicate configs
- Confusing behavior when multiple configs have same `enhKey`

**When duplicates occur**:
- Always (duplicates are allowed)

**Behavior on duplicate**: Add anyway, potential conflicts

### Recommended Approach: Hybrid Strategy

**Combine Option 1 (enhKey check) with Option 2 (reference check)**:

```typescript
async observe(rootNode: Node): Promise<void> {
    // ... existing code ...
    
    if (rootNode instanceof Element) {
        const registry = (rootNode as any).customElementRegistry?.enhancementRegistry;
        if (registry) {
            // Check 1: Reference equality (prevents re-registration of same object)
            const items = registry.getItems();
            if (items.includes(this.#init)) {
                return;  // Already registered
            }
            
            // Check 2: enhKey collision (prevents key conflicts)
            if (this.#init.enhKey) {
                const existing = registry.findByEnhKey(this.#init.enhKey);
                if (existing) {
                    console.warn(
                        `MountObserver: enhKey "${this.#init.enhKey}" already registered. ` +
                        `Skipping duplicate registration.`
                    );
                    return;
                }
            }
            
            // No duplicates found, safe to register
            registry.push(this.#init);
        }
    }
}
```

**Why this works**:
1. **Reference check** prevents the same `MountObserver` from registering multiple times
2. **enhKey check** prevents different observers from conflicting on the same key
3. **Warning message** helps developers debug configuration issues
4. **Allows multiple observers** with different `enhKey` values or no `enhKey`

### Edge Cases to Consider

#### Case 1: Same MountObserver, Multiple Root Nodes

```typescript
const observer = new MountObserver({ matching: 'button', enhKey: 'btn' });
observer.observe(document.body);
observer.observe(document.querySelector('#container'));
```

**Expected behavior**: Register once in each root node's registry (if they have different registries).

**Implementation note**: Each root node may have its own `customElementRegistry`, so we register per-registry, not globally.

#### Case 2: Multiple Observers, Same enhKey

```typescript
const observer1 = new MountObserver({ matching: 'button', enhKey: 'btn' });
const observer2 = new MountObserver({ matching: 'input', enhKey: 'btn' });
observer1.observe(document);
observer2.observe(document);
```

**Expected behavior**: Second registration fails with warning (enhKey collision).

**Rationale**: `element.enh.btn` can only point to one enhancement.

#### Case 3: Multiple Observers, No enhKey

```typescript
const observer1 = new MountObserver({ matching: 'button', do: callback1 });
const observer2 = new MountObserver({ matching: 'button', do: callback2 });
observer1.observe(document);
observer2.observe(document);
```

**Expected behavior**: Both register successfully (no collision).

**Rationale**: Without `enhKey`, there's no namespace conflict. Both observers can coexist.

#### Case 4: Re-observing After Disconnect

```typescript
const observer = new MountObserver({ matching: 'button', enhKey: 'btn' });
observer.observe(document);
observer.disconnect();
observer.observe(document);  // Re-observe
```

**Expected behavior**: Should we re-register, or is the old registration still valid?

**Recommendation**: On `disconnect()`, remove the `MountConfig` from the registry. On re-observe, register again.

### Implementation Checklist for Duplicate Detection

- [ ] Implement reference equality check in `observe()`
- [ ] Implement `enhKey` collision check in `observe()`
- [ ] Add warning message for `enhKey` collisions
- [ ] Handle multiple root nodes with separate registries
- [ ] Remove `MountConfig` from registry on `disconnect()`
- [ ] Add tests for duplicate detection scenarios
- [ ] Document duplicate detection behavior in README.md

## Questions to Resolve

1. **Registry scope**: Should we register the MountConfig in the rootNode's registry, or in each matched element's registry?
   - **Recommendation**: Register in rootNode's registry, as that's the scope of observation

2. **Multiple observers**: If multiple MountObservers observe the same element with different configs, how should they coexist?
   - **Recommendation**: Each MountConfig is a separate registry item with its own `enhKey`

3. **Spawn timing**: When should the `spawn` class be instantiated?
   - **Recommendation**: During `#handleMatch()`, after imports load but before `do` callbacks

4. **Disposal timing**: When should enhancements be disposed?
   - **Recommendation**: During `#handleRemoval()`, based on `disposeOn` configuration

5. **Backward compatibility**: How do we ensure this doesn't break existing code that doesn't use enhancements?
   - **Recommendation**: Make all enhancement features optional; only activate if `enhKey` or `spawn` is specified

6. **Disconnect cleanup**: Should `disconnect()` remove the `MountConfig` from the enhancement registry?
   - **Recommendation**: Yes, to allow clean re-observation and prevent stale registrations

## Related Files

- `node_modules/assign-gingerly/object-extension.ts` - Enhancement registry implementation
- `node_modules/assign-gingerly/types.d.ts` - `EnhancementConfig` interface
- `node_modules/assign-gingerly/README.md` (line 508+) - Enhancement registry documentation
- `types.d.ts` - `MountConfig` interface (extends `EnhancementConfig`)
- `MountObserver.ts` - Main implementation file