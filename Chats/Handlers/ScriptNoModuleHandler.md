# Script NoModule Built in Handler

Please define a built in handler that:

1.  Specifies it applies only to instances of HTMLScriptElement
2.  Specifies it applies only to script elements with attribute nomodule
3.  Has a src attribute.


Does not require a with-type attribute, but does recognize a with-type attribute

What this does:

1.  Reads the value of the src attribute
2.  If with-type attribute is specified, does an import(srcAttr, {with: {type: withTypeAttr}});
3.  If not, just does an import(srcAttr);
4.  Stores the value at oScriptElement.export


---

## Implementation Plan

Based on the existing handler patterns in this library, here's how this requirement would be implemented:

### 1. Create Handler File

**Location**: `handlers/ScriptNoModule.ts`

The handler would extend `EvtRt` (the base event handler class) and define static properties for default configuration.

### 2. Handler Implementation with Static Properties

```typescript
import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types/mount-observer/types.js';

export class ScriptNoModuleHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    static matching = 'script[nomodule][src]';
    static whereInstanceOf = HTMLScriptElement;
    
    async mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext): Promise<void> {
        this.abort(); // Clean up event listeners (one-time operation)
        
        const scriptElement = mountedElement as HTMLScriptElement;
        
        // Read src attribute
        const srcAttr = scriptElement.getAttribute('src');
        if (!srcAttr) {
            throw new Error('Script element must have a src attribute');
        }
        
        // Check for with-type attribute
        const withTypeAttr = scriptElement.getAttribute('with-type');
        
        // Perform import
        let module;
        if (withTypeAttr) {
            module = await import(srcAttr, { with: { type: withTypeAttr } });
        } else {
            module = await import(srcAttr);
        }
        
        // Store result on element
        (scriptElement as any).export = module;
    }
}

// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.scriptNoModule', ScriptNoModuleHandler);
```

### 3. Export from index.ts

Add to the main entry point:

```typescript
export { ScriptNoModuleHandler } from './handlers/ScriptNoModule.js';
import './handlers/ScriptNoModule.js'; // Side-effect import for registration
```

### 4. Usage Example

**Simple usage** (uses handler's static properties):
```javascript
import { MountObserver } from 'mount-observer';

// No need to specify matching or whereInstanceOf - handler provides them!
const observer = new MountObserver({
    do: 'builtIns.scriptNoModule'
});

observer.observe(document);
```

**With override** (inline config trumps handler defaults):
```javascript
// Override the matching selector if needed
const observer = new MountObserver({
    matching: 'script[nomodule][src][data-lazy]', // More specific selector
    do: 'builtIns.scriptNoModule'                 // Still uses whereInstanceOf from handler
});
```

HTML:
```html
<script nomodule src="./data.json" with-type="json"></script>
<script nomodule src="./module.js"></script>
```

Access the imported module:
```javascript
const scriptEl = document.querySelector('script[nomodule][src="./data.json"]');
console.log(scriptEl.export); // Contains the imported JSON data
```

### 5. Key Design Notes

1. **Static properties as defaults**: The handler defines `static matching` and `static whereInstanceOf` so users don't need to remember these constraints

2. **Automatic merging**: When `do: 'builtIns.scriptNoModule'` is used, the MountObserver automatically merges the handler's static properties with the inline config

3. **Inline config precedence**: Users can still override any static property by specifying it in their MountConfig

4. **No `import` property needed**: Unlike other handlers, this doesn't use MountConfig's `import` property because the module path comes from the script element's `src` attribute

5. **One-time operation**: Calls `this.abort()` immediately since the script only needs to be loaded once

6. **Import assertions**: Uses the modern `{ with: { type: ... } }` syntax for import assertions (e.g., for JSON modules)

7. **Follows library patterns**: 
   - Extends `EvtRt` base class
   - Defines static properties for default configuration
   - Registered at end of file with `MountObserver.define()`
   - Exported from `index.ts` with side-effect import
   - Located in `handlers/` directory

8. **Self-documenting**: The static properties make it clear what elements this handler is designed to work with
