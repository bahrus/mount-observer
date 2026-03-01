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
- `builtIns.scriptNoModule` - Imports ES modules from script[nomodule] elements and stores them on element.export

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
