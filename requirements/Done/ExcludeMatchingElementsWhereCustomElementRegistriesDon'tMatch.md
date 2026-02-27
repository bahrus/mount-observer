# Exclude Mounting Elements Where Custom Element Registry doesn't match.

**Status**: ✅ Implemented

I had a fundamental misunderstanding of how the new scoped registries work.

For starters, this requirement is that before mounting an element, add one more required AND condition -- the customElementRegistry of the possible candidate element must match the customElementRegistry of the root element being observed (this.#rootNode).

## Implementation Details

The check is implemented in the `#matchesSelector()` method in `MountObserver.ts`. Before checking other conditions, it verifies that:

```typescript
const rootRegistry = (rootNode as any).customElementRegistry;
const elementRegistry = (element as any).customElementRegistry;

// If registries don't match, exclude this element
if (rootRegistry !== elementRegistry) {
    return false;
}
```

**Behavior across browser versions:**
- **Pre-Chrome 146**: Both `customElementRegistry` properties are `undefined`, so `undefined !== undefined` is `false`, and elements match ✓
- **Chrome 146+ with scoped registries**: Registries are compared by reference equality
  - Same registry → elements match ✓
  - Different registries → elements don't match ✓
- **Edge case**: If one is `undefined` and the other is defined, they correctly don't match

This ensures that MountObserver respects scoped custom element registry boundaries, only mounting elements that belong to the same registry scope as the observed root node.

## Test Coverage

- `tests/test-registry-matching.html` / `.spec.mjs` - Verifies registry matching behavior across document and shadow DOM boundaries

