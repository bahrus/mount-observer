# Performance Optimization: matches() vs hasAttribute()

## Summary

Refactored `whereAttr.ts` to use CSS selector matching with `element.matches()` instead of multiple `hasAttribute()` calls, resulting in significant performance improvements in Chrome/Chromium browsers.

## Cross-Browser Performance Results

### Chrome (Blink Engine)
- **Simple case**: 1.93x faster with `matches()`
- **Complex case**: 2.86x faster with `matches()`
- **Winner**: `matches()` ✅

### Firefox (Gecko Engine)
- **Simple case**: 1.8x faster with `hasAttribute()`
- **Complex case**: 1.5x faster with `hasAttribute()`
- **Winner**: `hasAttribute()`

### Safari (WebKit Engine)
- **Simple case**: ~1.0x (essentially tied)
- **Complex case**: 1.03x faster with `matches()`
- **Winner**: Neutral (slight edge to `matches()`)

## Decision Rationale

Chose `matches()` approach based on:
1. **Chrome market dominance** (~65% browser market share)
2. **Safari neutrality** (no significant penalty)
3. **Scalability** - Performance gap widens with complexity (2.86x in Chrome for complex cases)
4. **Code simplicity** - Single selector string vs multiple attribute checks

## Implementation Details

### Key Changes

1. **Selector Caching**: CSS selectors are built once per `WhereAttr` config and cached using `WeakMap`
2. **CSS.escape()**: Properly escapes special characters in attribute names (`:`, `.`, `[`, `]`, etc.)
3. **Colon Delimiter Support**: Custom delimiters including `:` now work correctly via CSS.escape()

### Example Selector Generation

```javascript
// Input configuration
{
    hasBase: '[_]my-greetings',
    hasBranchIn: [
        '',
        { '[:]hello': ['', '[--]how-are-you'] }
    ]
}

// Generated CSS selector (with escaping)
[enh_my-greetings],[enh_my-greetings\:hello],[enh_my-greetings\:hello--how-are-you]
```

### CSS.escape() Examples

```
my-custom:hello → my-custom\:hello
my-custom::nested → my-custom\:\:nested
my-custom.branch → my-custom\.branch
my-custom[test] → my-custom\[test\]
my-custom#id → my-custom\#id
```

## Test Coverage

All 45 tests pass, including:
- 42 existing tests (unchanged behavior)
- 3 new colon delimiter tests

## Files Modified

- `whereAttr.ts` - Complete refactor to use `matches()`
- `whereAttr.js` - Compiled output
- `demo/performance-test.html` - Updated to use CSS.escape()

## Files Added

- `tests/test-colon-delimiter.html` - Test for colon delimiter support
- `tests/test-colon-delimiter.spec.mjs` - Playwright test spec
- `demo/css-escape-test.html` - CSS escape verification test
- `PERFORMANCE-OPTIMIZATION.md` - This document

## Performance Trade-offs

### Pros
- 2-3x faster in Chrome (majority browser)
- Leverages native browser CSS matching engine
- Simpler code (no recursive hasAttribute checks)
- Better scalability with complex attribute patterns

### Cons
- ~1.5-1.8x slower in Firefox (minority browser)
- Requires CSS.escape() (available in all modern browsers)
- Selector cache uses WeakMap memory

## Future Considerations

If Firefox performance becomes critical, consider:
1. Browser detection to use different strategies
2. Adaptive approach (benchmark on first use)
3. Hybrid approach (simple cases use hasAttribute, complex use matches)

For now, optimizing for Chrome's market dominance is the pragmatic choice.
