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

The handler would extend `EvtRt` (the base event handler class) and implement the `mount()` method.

### 2. MountConfig Configuration

Users would configure the MountObserver with:

```javascript
const observer = new MountObserver({
    matching: 'script[nomodule][src]',
    whereInstanceOf: HTMLScriptElement,
    do: 'builtIns.scriptNoModule'
});
observer.observe(document);
```

**How the conditions work**:
- `matching: 'script[nomodule][src]'` - CSS selector ensures the element is a script tag with both `nomodule` and `src` attributes
- `whereInstanceOf: HTMLScriptElement` - Type check ensures it's actually an HTMLScriptElement instance (not just any element matching the selector)
- `do: 'builtIns.scriptNoModule'` - References the registered handler name

These form an AND condition (per the library's design), so all three must be satisfied.

### 3. Handler Implementation

```typescript
import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types/mount-observer/types.js';

export class ScriptNoModuleHandler extends EvtRt {
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

### 4. Export from index.ts

Add to the main entry point:

```typescript
export { ScriptNoModuleHandler } from './handlers/ScriptNoModule.js';
import './handlers/ScriptNoModule.js'; // Side-effect import for registration
```

### 5. Usage Example

HTML:
```html
<script nomodule src="./data.json" with-type="json"></script>
<script nomodule src="./module.js"></script>
```

JavaScript:
```javascript
import { MountObserver } from 'mount-observer';

const observer = new MountObserver({
    matching: 'script[nomodule][src]',
    whereInstanceOf: HTMLScriptElement,
    do: 'builtIns.scriptNoModule'
});

observer.observe(document);

// After mounting, access the imported module:
const scriptEl = document.querySelector('script[nomodule][src="./data.json"]');
console.log(scriptEl.export); // Contains the imported JSON data
```

### Key Design Notes

1. **No `import` property needed**: Unlike other handlers, this doesn't use MountConfig's `import` property because the module path comes from the script element's `src` attribute

2. **One-time operation**: Calls `this.abort()` immediately since the script only needs to be loaded once

3. **Import assertions**: Uses the modern `{ with: { type: ... } }` syntax for import assertions (e.g., for JSON modules)

4. **Follows library patterns**: 
   - Extends `EvtRt` base class
   - Registered at end of file with `MountObserver.define()`
   - Exported from `index.ts` with side-effect import
   - Located in `handlers/` directory with "Handler" suffix removed from filename

5. **Error handling**: Validates that `src` attribute exists before attempting import

6. **Type safety**: Properly casts to `HTMLScriptElement` to access script-specific properties
