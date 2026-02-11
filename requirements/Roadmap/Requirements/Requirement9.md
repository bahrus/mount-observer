# Requirement 9: Performance Optimization and Benchmarking

## Goal
Ensure the unified architecture performs well and doesn't introduce unnecessary overhead compared to the separate implementations.

## Background
By moving attribute logic to assign-gingerly and adding conversion layers, we've introduced some complexity. We need to verify that:
- Initial attribute reading is efficient
- No duplicate work is being done
- Memory usage is reasonable
- The conversion overhead is minimal

## Performance Considerations

### 1. Attribute Reading Overhead
Current flow:
1. mount-observer builds `AttrCoordinateMap`
2. mount-observer converts to `AttrMapping[]`
3. assign-gingerly reads attributes using `AttrMapping[]`
4. mount-observer sets up `MutationObserver`

Potential optimization:
- Cache `AttrMapping[]` conversion results
- Lazy-build `AttrCoordinateMap` only when needed
- Share coordinate map between initial read and observation

### 2. Instance Map Lookups
The global instance map uses WeakMap → Map → instance lookups:
```typescript
const instanceMap = getInstanceMap(); // WeakMap lookup
const instances = instanceMap.get(element); // Map lookup
const instance = instances.get(registryItem); // Instance lookup
```

Potential optimization:
- Consider using a single WeakMap with composite keys
- Profile to see if this is actually a bottleneck

### 3. Parser Function Overhead
Each attribute value goes through a parser function:
```typescript
const parser = mapping.parser || AttrParsers.string;
result[mapping.propName] = parser(attrValue);
```

Potential optimization:
- Pre-resolve parser functions during conversion
- Inline common parsers (string, number)
- Use a parser cache

### 4. Conversion Overhead
Converting `MountInit` to `IBaseRegistryItem`:
```typescript
const registryItem = mountInitToRegistryItem(mountInit, isCustomElement);
```

Potential optimization:
- Cache conversion results (MountInit is often static)
- Lazy-convert only when spawn is actually used
- Pre-convert at registration time

## Proposed Optimizations

### Optimization 1: Cache AttrMapping Conversion
```typescript
const attrMappingCache = new WeakMap<MountInit, AttrMapping[]>();

function convertToAttrMappings(
  mountInit: MountInit,
  isCustomElement: boolean
): AttrMapping[] {
  // Check cache first
  if (attrMappingCache.has(mountInit)) {
    return attrMappingCache.get(mountInit)!;
  }
  
  // Build and cache
  const mappings = buildAttrMappings(mountInit.whereAttr, mountInit.map, isCustomElement);
  attrMappingCache.set(mountInit, mappings);
  return mappings;
}
```

### Optimization 2: Pre-resolve Parsers
```typescript
export interface AttrMapping {
  attrName: string;
  propName: string;
  parser: AttrParser; // Always a function, never a string
  initialOnly?: boolean;
}

// During conversion, resolve parser names to functions
function convertToAttrMappings(...): AttrMapping[] {
  // ...
  mappings.push({
    attrName,
    propName: mapEntry.mapsTo,
    parser: resolveParser(mapEntry), // Pre-resolved
    initialOnly: mapEntry.once ?? true
  });
}
```

### Optimization 3: Batch Attribute Reads
Instead of calling `getAttribute()` for each mapping:
```typescript
function readInitialAttributes(
  element: Element, 
  attrMappings: AttrMapping[]
): Record<string, any> {
  if (!attrMappings || attrMappings.length === 0) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  // Get all attributes at once
  const attrs = element.attributes;
  const attrMap = new Map<string, string>();
  for (let i = 0; i < attrs.length; i++) {
    attrMap.set(attrs[i].name, attrs[i].value);
  }
  
  // Process mappings
  for (const mapping of attrMappings) {
    const attrValue = attrMap.get(mapping.attrName);
    if (attrValue !== undefined) {
      result[mapping.propName] = mapping.parser(attrValue);
    }
  }
  
  return result;
}
```

### Optimization 4: Lazy Registry Item Creation
```typescript
class LazyRegistryItem {
  private _registryItem?: IBaseRegistryItem;
  
  constructor(private mountInit: MountInit, private isCustomElement: boolean) {}
  
  get registryItem(): IBaseRegistryItem {
    if (!this._registryItem) {
      this._registryItem = mountInitToRegistryItem(this.mountInit, this.isCustomElement);
    }
    return this._registryItem;
  }
}
```

## Benchmarking Strategy

### Benchmark 1: Initial Attribute Reading
Compare:
- Old: mount-observer reads and applies attributes
- New: assign-gingerly reads, mount-observer observes

```typescript
// Setup
const elements = Array.from({ length: 1000 }, () => {
  const el = document.createElement('button');
  el.setAttribute('data-count', '5');
  el.setAttribute('data-label', 'Click');
  return el;
});

// Benchmark old approach
console.time('old');
elements.forEach(el => {
  // Old mount-observer logic
});
console.timeEnd('old');

// Benchmark new approach
console.time('new');
elements.forEach(el => {
  // New unified logic
});
console.timeEnd('new');
```

### Benchmark 2: Spawning Overhead
Measure time to spawn 1000 instances:
- With attribute reading
- Without attribute reading
- With various numbers of attributes (1, 5, 10, 20)

### Benchmark 3: Memory Usage
Use Chrome DevTools to measure:
- Heap size with 1000 spawned instances
- Number of objects created
- WeakMap/Map overhead

### Benchmark 4: Conversion Overhead
Measure time to convert 1000 MountInit objects to IBaseRegistryItem:
- Without caching
- With caching

## Performance Goals

### Targets
- Initial attribute reading: < 1ms per element (for 5 attributes)
- Spawning overhead: < 2ms per instance
- Conversion overhead: < 0.1ms per MountInit
- Memory overhead: < 1KB per spawned instance

### Acceptable Degradation
- Up to 10% slower than separate implementations
- Up to 20% more memory usage (due to unified architecture)

## Monitoring and Profiling

### Add Performance Marks
```typescript
function readInitialAttributes(...) {
  performance.mark('attr-read-start');
  // ... read logic
  performance.mark('attr-read-end');
  performance.measure('attr-read', 'attr-read-start', 'attr-read-end');
}
```

### Add Debug Mode
```typescript
const DEBUG = false; // Set via environment or config

if (DEBUG) {
  console.log('[assign-gingerly] Reading attributes:', attrMappings);
  console.time('attr-read');
}
// ... logic
if (DEBUG) {
  console.timeEnd('attr-read');
}
```

## Testing Strategy

### Performance Tests
```typescript
describe('Performance', () => {
  it('should read 100 attributes in < 10ms', () => {
    const start = performance.now();
    // ... read 100 attributes
    const end = performance.now();
    expect(end - start).toBeLessThan(10);
  });
  
  it('should spawn 100 instances in < 200ms', () => {
    // ...
  });
});
```

### Regression Tests
- Run benchmarks on each commit
- Alert if performance degrades > 10%
- Track performance over time

## Documentation

### Performance Guide
Document:
- Expected performance characteristics
- How to profile and debug performance issues
- When to use `initialOnly: true` vs `false`
- How caching works and when it helps

## Benefits
- Confidence that the unified architecture is performant
- Data-driven optimization decisions
- Early detection of performance regressions
- Clear performance expectations for users

## Deliverables
1. Benchmark suite in `benchmarks/` directory
2. Performance test suite
3. Performance profiling guide
4. Optimization implementation (if needed)
5. Performance documentation

## Next Steps
After this, we should consider edge cases and error handling to make the system robust.
