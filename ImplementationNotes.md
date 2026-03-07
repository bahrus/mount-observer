# MountObserver v2 - Tighter Implementation

A streamlined implementation of the MountObserver API focusing on "Polyfill Supported Scenario I" from the main README.

## What's Implemented

This v2 implementation focuses on the core polyfillable features:

### ✅ Core Features
- **matching**: CSS selector matching using `element.matches()`
- **import**: Dynamic module loading (JS, CSS, JSON, HTML)
- **do**: Callback function or object with lifecycle methods
- **loadingEagerness**: 'eager' or 'lazy' import loading
- **Events**: mount, dismount, disconnect, load
- **MutationObserver**: Watches for DOM changes

### 📋 API Surface

```typescript
const observer = new MountObserver({
   matching: 'my-element',
   import: './my-element.js',
   do: (element, { modules, observer, observeInfo }) => {
      // Called once per element when it mounts
   }
}, {
   disconnectedSignal: new AbortController().signal
});

observer.observe(document);
```



### Multiple Imports

```typescript
const observer = new MountObserver({
   matching: 'my-element',
   import: [
      ['./my-element.css', { type: 'css' }],
      './my-element.js'
   ],
   do: (element, { modules }) => {
      // modules[0] = CSS StyleSheet
      // modules[1] = JS module
   }
});
```

## What's NOT Implemented (Yet)

These features from the full spec are not in v2:

- ❌ `select` (complex CSS queries requiring selector observer)
- ❌ `whereElementIntersectsWith` (IntersectionObserver integration)
- ❌ `withMediaMatching` (MediaQuery integration)
- ❌ `whereSizeOfContainerMatches` (Container queries)
- ❌ `whereInstanceOf` (instanceof checks)
- ❌ Shadow DOM inheritance
- ❌ MOSE (Mount Observer Script Elements)
- ❌ reconnect, reconfirm, exit, forget events

## Files

- `types.ts` - TypeScript type definitions
- `MountObserver.ts` - Main implementation
- `loadImports.ts` - Import loading utilities (loaded dynamically when needed)
- `types.js`, `MountObserver.js`, `loadImports.js` - Compiled JavaScript
- `index.ts`, `index.js` - Main entry point
- `tests/test-basic.html` - Basic functionality test
- `tests/test-import.html` - Import/lazy loading test
- `tests/test.spec.mjs` - Playwright test suite
- `tests/fancy-button.js` - Sample custom element

## Testing

Start a local server:
```bash
npm run serve
```

Then open:
- `http://localhost:8000/v2/tests/test-basic.html`
- `http://localhost:8000/v2/tests/test-import.html`

Or run Playwright tests:
```bash
npm test -- v2/tests/test.spec.mjs
```

## Key Differences from v1

1. **Simpler**: Only `matching` (no complex `select` queries)
2. **Cleaner**: No WeakDual, no complex state tracking
3. **Focused**: Core lazy loading use case only
4. **Async-aware**: Proper handling of import loading
5. **Type-safe**: Full TypeScript with strict mode

## Usage Example

```typescript
import { MountObserver } from './MountObserver.js';

// Lazy load custom element
const observer = new MountObserver({
   matching: 'my-element',
   import: './my-element.js',
   do: ({ localName }, { modules, observer }) => {
      if (!customElements.get(localName)) {
         customElements.define(localName, modules[0].MyElement);
      }
      observer.disconnectedSignal.abort();
   }
});

observer.observe(document);
```

## Design Principles

1. **Minimal**: Only what's needed for the core use case
2. **Polyfillable**: Uses standard APIs (MutationObserver, matches())
3. **Type-safe**: Full TypeScript support
4. **Zero dependencies**: No runtime dependencies
5. **Event-driven**: EventTarget-based for extensibility
6. **Code-split**: Conditional features loaded dynamically to minimize bundle size

### Code Splitting Strategy

The v2 implementation follows a strict code-splitting principle: any code block >6 lines that only executes based on optional configuration is extracted to a separate module and loaded dynamically.

**Example**: The `loadImports.ts` module (handling CSS, JSON, HTML imports) is only loaded when `MountConfig.import` is specified. Users who don't use the import feature pay zero bytes for that functionality.
