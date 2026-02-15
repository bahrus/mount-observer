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

## Related Files

- `node_modules/assign-gingerly/object-extension.ts` - Enhancement registry implementation
- `node_modules/assign-gingerly/types.d.ts` - `EnhancementConfig` interface
- `node_modules/assign-gingerly/README.md` (line 508+) - Enhancement registry documentation
- `types.d.ts` - `MountConfig` interface (extends `EnhancementConfig`)
- `MountObserver.ts` - Main implementation file