# v1 vs v2 Comparison

## Philosophy

**v1**: Comprehensive implementation attempting to support the full proposed spec, including features that are difficult or impossible to polyfill.

**v2**: Focused implementation of "Polyfill Supported Scenario I" - only what can be reliably polyfilled using standard browser APIs.

## Feature Comparison

| Feature | v1 | v2 | Notes |
|---------|----|----|-------|
| `whereElementMatches` | ✅ | ✅ | Simple element.matches() selector |
| `select` (complex CSS) | ⚠️ | ❌ | v1 attempts but limited; v2 omits (needs platform support) |
| `import` (single) | ✅ | ✅ | Dynamic import |
| `import` (multiple) | ✅ | ✅ | Array of imports |
| `import` (CSS) | ✅ | ✅ | CSSStyleSheet |
| `import` (JSON/HTML) | ✅ | ✅ | Fetch-based |
| `loadingEagerness` | ❌ | ✅ | Eager vs lazy loading |
| `do` (function) | ✅ | ✅ | Single callback |
| `do` (object) | ✅ | ✅ | mount/dismount/disconnect |
| `whereElementIntersectsWith` | ❌ | ❌ | Future feature |
| `withMediaMatching` | ❌ | ❌ | Future feature |
| `whereInstanceOf` | ❌ | ❌ | Future feature |
| Shadow DOM support | ✅ | ⚠️ | v1 has complex support; v2 basic |
| MOSE (script elements) | ❌ | ❌ | Future feature |
| Events: mount/dismount | ✅ | ✅ | Core events |
| Events: disconnect | ✅ | ✅ | Element removed |
| Events: reconnect/exit | ⚠️ | ❌ | Hard to polyfill reliably |
| Events: load | ❌ | ✅ | Import completion |

## Code Complexity

### v1
- **Lines of code**: ~1000+ (MountObserver.ts alone)
- **Dependencies**: Multiple internal utilities (RootMutObs, bindish, Events, etc.)
- **State tracking**: Complex WeakDual, multiple WeakMaps/WeakSets
- **Files**: 50+ files across multiple directories

### v2
- **Lines of code**: ~250 (MountObserver.ts + types.ts)
- **Dependencies**: Zero (only browser APIs)
- **State tracking**: Simple WeakSets
- **Files**: 6 core files

## API Simplicity

### v1 Example
```javascript
const observer = new MountObserver({
   on: 'my-element',  // or whereElementMatches
   import: './my-element.js',
   do: ({localName}, {modules, observer, observeInfo}) => {
      // Complex context object
   }
});
```

### v2 Example
```javascript
const observer = new MountObserver({
   whereElementMatches: 'my-element',
   import: './my-element.js',
   do: (element, {modules, observer, observeInfo}) => {
      // Clean, simple API
   }
});
```

## Use Cases

### v1 Targets
- Complex CSS selector matching (`:has`, `:not`, combinators)
- Custom state observation
- Full lifecycle management
- Shadow DOM inheritance
- Declarative script elements (MOSE)

### v2 Targets
- Lazy loading custom elements (primary use case)
- Simple element matching
- Progressive enhancement
- Binding from a distance (simple selectors)

## When to Use Which

### Use v1 if you need:
- Complex CSS selectors
- Full proposed spec features
- Experimental/cutting-edge features
- Don't mind larger bundle size

### Use v2 if you need:
- Simple, reliable lazy loading
- Minimal bundle size
- Production-ready code
- Easy to understand/maintain

## Migration Path

v2 is mostly compatible with v1 for the supported features:

```javascript
// v1 code
const observer = new MountObserver({
   on: 'my-element',  // Change this
   import: './my-element.js',
   do: callback
});

// v2 equivalent
const observer = new MountObserver({
   whereElementMatches: 'my-element',  // To this
   import: './my-element.js',
   do: callback
});
```

## Performance

**v2 advantages**:
- Smaller bundle (~5KB vs ~50KB+)
- Simpler mutation handling
- Less memory overhead
- Faster initialization

**v1 advantages**:
- More sophisticated caching
- Better handling of complex scenarios
- More optimizations for edge cases

## Maintenance

**v2**: Easier to maintain, understand, and debug. Fewer moving parts.

**v1**: More complex but handles more scenarios. Requires deeper understanding.

## Recommendation

Start with **v2** for most use cases. It covers 90% of real-world needs with 10% of the complexity.

Only move to **v1** if you specifically need:
- Complex CSS selectors that can't be expressed with `matches()`
- Features beyond basic lazy loading
- Experimental spec features
