---
inclusion: always
---

# MountObserver API Documentation

## MountConfig Configuration

The `MountConfig` object configures what elements the MountObserver should observe and act upon.

### Condition Logic

**AND Conditions**: All `where*` properties in the `MountConfig` object form an AND condition. An element must satisfy ALL specified `where*` conditions to mount.

For example:
```javascript
{
    matching: 'input, button',
    whereInstanceOf: HTMLInputElement
}
```
This will only match elements that are BOTH (`input` or `button`) AND instances of HTMLInputElement.

## Handler Classes

### Built-in Handlers

The library provides several built-in handlers registered with `MountObserver.define()`:
- `builtIns.logToConsole` - Logs mount/dismount events to console
- `builtIns.defineCustomElement` - Auto-defines custom elements from imported modules
- `buildIns.defineScopedCustomElement` - Defines custom elements in scoped registries
- `builtIns.enhanceMountedElement` - Enhances elements using assign-gingerly
- `builtIns.scriptExport` - Exposes ES module exports and imports JSON from script elements via element.export
- `builtIns.mountObserverScript` - Processes script[type="mountobserver"] elements to declaratively configure mount observers

## MountConfig Properties

### Hierarchical Composition (with)

**with**: Sub-observer configurations for hierarchical composition
- Type: `{[key: string]: MountConfig}`
- Each key-value pair defines a sub-observer that observes the same root node as the parent
- Sub-observers are created automatically when the parent's observe() method is called
- Sub-observers are automatically disconnected when the parent disconnects
- Sub-observers operate independently with their own configurations
- Sub-observers do NOT inherit properties from the parent observer
- Each sub-observer can have its own `with` property for unlimited nesting depth
- Access sub-observers in handlers via `context.withObservers[key]`

**Example - Basic sub-observers:**
```javascript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: {
            matching: 'my-element',
            do: 'builtIns.defineCustomElement'
        },
        styles: {
            import: './styles.css'
        }
    }
});
```

**Example - Accessing sub-observers in handlers:**
```javascript
const observer = new MountObserver({
    matching: '.container',
    with: {
        registry: { matching: 'custom-element' }
    },
    do: (el, ctx) => {
        // Access sub-observer with type safety
        const registryObserver = ctx.withObservers?.registry;
        if (registryObserver) {
            console.log('Registry observer active:', registryObserver);
        }
    }
});
```

**Example - Nested sub-observers:**
```javascript
const observer = new MountObserver({
    matching: '.root',
    with: {
        level1: {
            matching: '.level1',
            with: {
                level2: {
                    matching: '.level2',
                    do: (el) => console.log('Level 2 mounted')
                }
            }
        }
    }
});
```

**Example - Cross-scope registry management:**
```javascript
const observer = new MountObserver({
    matching: 'div[shadowroot]',
    with: {
        mainRegistry: {
            matching: 'my-element',
            whereDifferentCustomElementRegistry: false,
            do: 'builtIns.defineCustomElement'
        },
        shadowRegistry: {
            matching: 'shadow-element',
            whereDifferentCustomElementRegistry: true,
            do: 'builtIns.defineScopedCustomElement'
        }
    }
});
```

**Type Safety**: When using TypeScript, the keys in the `with` property are inferred and provide autocomplete for `context.withObservers`:

```typescript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: { matching: 'my-element' },
        styles: { import: './styles.css' }
    },
    do: (el, ctx) => {
        ctx.withObservers?.registry  // ✓ TypeScript knows this exists
        ctx.withObservers?.unknown   // ✗ TypeScript error
    }
});
```

**Known Limitations**:
- Circular references in `with` configurations are not prevented and will cause stack overflow
- Avoid configurations where observer A's `with` references observer B, and B's `with` references A
- The library does not detect or prevent circular configurations due to performance considerations

### Filtering Conditions (where*)

All `where*` properties form AND conditions - elements must satisfy ALL specified conditions to mount.

**whereLocalNameMatches**: Regular expression or string pattern to match against element's localName
- Accepts `string | RegExp`
- String values are automatically converted to RegExp
- Tests against `element.localName`
- Example: `/^my-/` matches elements starting with 'my-'
- Example: `'button|input'` matches button or input elements

**whereInstanceOf**: Constructor or array of constructors to filter by instance type
- Elements must be instances of at least one constructor (OR logic for arrays)
- Example: `HTMLButtonElement` or `[HTMLInputElement, HTMLTextAreaElement]`

**whereDifferentCustomElementRegistry**: Boolean to invert registry matching
- Default (false): Only mount elements with SAME registry as root node
- When true: Only mount elements with DIFFERENT registry than root node
- Useful for cross-registry observation scenarios

### Handler Static Properties (Default Configuration)

**IMPORTANT**: Handler classes can define static properties that serve as default MountConfig values. When you reference a handler by name in the `do` property, its static properties are automatically merged with your inline configuration.

**Pattern:**
```javascript
class MyHandler extends EvtRt {
    static matching = 'script[nomodule][src]';
    static whereInstanceOf = HTMLScriptElement;
    
    mount(mountedElement, MountConfig, context) {
        // Handler logic
    }
}

MountObserver.define('myHandler', MyHandler);
```

**Usage:**
```javascript
// Uses handler's static matching and whereInstanceOf
const observer = new MountObserver({
    do: 'myHandler'
});

// Inline config overrides handler defaults
const observer2 = new MountObserver({
    matching: 'script.special',  // Overrides handler's matching
    do: 'myHandler'              // Still uses handler's whereInstanceOf
});
```

**Merge behavior:**
1. Handler's static properties are extracted (excluding `prototype`, `length`, `name`)
2. Static properties are merged with inline config using object spread
3. Inline config always takes precedence (inline trumps handler defaults)

**Benefits:**
- Handlers are self-contained with their own default constraints
- Users don't need to remember handler-specific requirements
- Inline config can still override when needed
- Keeps configurations JSON-serializable

## MountContext

The `MountContext` object is passed to mount handlers and contains information about the mounted element and observer state.

### MountContext Properties

**modules**: Array of imported modules
- Contains modules loaded via the `import` property
- Empty array if no imports specified

**observer**: Reference to the IMountObserver instance
- The MountObserver that triggered this mount event
- Provides access to observer methods like disconnect()

**rootNode**: The observed root node
- The DOM node passed to observe()
- May be document, shadow root, or any element

**mountConfig**: The configuration object for this observer
- Contains all settings that define observation behavior
- Previously named `MountConfig` (breaking change in v2.x)
- Type: `MountConfig<TKeys>`

**withObservers**: Map of sub-observers (optional)
- Only present when the observer has sub-observers defined via the `with` property
- Keys match the keys from the `with` property in mountConfig
- Provides type-safe access to sub-observer instances
- Type: `{[K in TKeys]: IMountObserver}`
- Undefined when no sub-observers exist

**Example - Accessing MountContext:**
```javascript
const observer = new MountObserver({
    matching: '.my-element',
    import: './module.js',
    with: {
        child: { matching: '.child' }
    },
    do: (el, ctx) => {
        console.log('Modules:', ctx.modules);
        console.log('Observer:', ctx.observer);
        console.log('Root node:', ctx.rootNode);
        console.log('Config:', ctx.mountConfig);
        console.log('Sub-observers:', ctx.withObservers);
        
        // Access specific sub-observer
        if (ctx.withObservers?.child) {
            console.log('Child observer exists');
        }
    }
});
```

## Breaking Changes

### v2.x: MountConfig → mountConfig

The `MountContext.MountConfig` property has been renamed to `MountContext.mountConfig` for consistency with JavaScript naming conventions (properties use camelCase, types use PascalCase).

**Migration Required**: Update all handler code that accesses the configuration from context.

**Before (v1.x):**
```javascript
const observer = new MountObserver({
    matching: '.my-element',
    do: (el, ctx) => {
        console.log(ctx.MountConfig.matching);  // Old name
    }
});
```

**After (v2.x):**
```javascript
const observer = new MountObserver({
    matching: '.my-element',
    do: (el, ctx) => {
        console.log(ctx.mountConfig.matching);  // New name
    }
});
```

**Migration Steps:**
1. Search your codebase for `context.MountConfig` or `ctx.MountConfig`
2. Replace with `context.mountConfig` or `ctx.mountConfig`
3. If using TypeScript, the compiler will catch any missed occurrences
4. Update any tests that assert on the MountConfig property

**Affected Code:**
- Handler functions (inline or class-based)
- Event listeners that receive MountEvent or DismountEvent
- Any code that accesses the configuration from MountContext
