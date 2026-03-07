# Design Document: Support for With Property

## Overview

This feature adds hierarchical composition support to MountObserver through a new `with` property in MountConfig. The `with` property enables a parent observer to declaratively create and manage multiple sub-observers that observe the same root node. This design supports unlimited nesting depth, automatic lifecycle management, and type-safe access to sub-observers from mount handlers.

The implementation involves:
- Adding generic type parameters to MountConfig and MountContext for type-safe sub-observer keys
- Creating and managing sub-observers during the parent's observe() lifecycle
- Exposing sub-observers to handlers through the MountContext
- Implementing recursive disconnection for nested hierarchies
- Renaming MountConfig → mountConfig in MountContext for consistency

## Architecture

### Type System Design

The feature uses TypeScript generics to provide compile-time type safety for sub-observer keys. The generic type parameter `TKeys extends string` flows through the type hierarchy:

```
MountConfig<TKeys> 
  ↓ (with property)
  ↓
MountContext<TKeys>
  ↓ (withObservers property)
  ↓
Handler receives typed access to sub-observers
```

This ensures that:
1. Keys in the `with` property are known at compile time
2. The `withObservers` map uses the same keys
3. TypeScript provides autocomplete for sub-observer access
4. Type errors are caught at compile time

### Lifecycle Architecture

Sub-observers follow a parent-child lifecycle model:

```
Parent.observe(rootNode)
  ↓
  Create sub-observers from `with` config
  ↓
  Call subObserver.observe(rootNode) for each
  ↓
  Store in #subObservers Map
  ↓
Parent operates normally
  ↓
Parent.disconnect()
  ↓
  Disconnect all sub-observers (recursive)
  ↓
  Clear #subObservers Map
  ↓
  Complete parent disconnection
```

### Memory Management Strategy

The implementation uses strong references during the active lifecycle:
- Parent stores sub-observers in a `Map<string, MountObserver>` (strong references)
- Sub-observers remain accessible while parent is active
- On disconnect(), the Map is cleared, releasing all references
- When parent is GC'd, sub-observers become eligible for GC

This approach balances:
- **Reliability**: Sub-observers remain accessible throughout parent's lifecycle
- **Simplicity**: No WeakRef complexity for this use case
- **Safety**: Explicit disconnect() ensures cleanup

## Components and Interfaces

### Type Definitions

#### Updated MountConfig Interface

```typescript
export interface MountConfig<TKeys extends string = string> {
    // ... existing properties ...
    
    /**
     * Sub-observer configurations for hierarchical composition.
     * Each key-value pair defines a sub-observer that will observe the same root node.
     * Sub-observers are created when the parent's observe() method is called.
     * @example { registry: { matching: 'my-element' }, styles: { import: './styles.css' } }
     */
    with?: {[K in TKeys]: MountConfig};
}
```

#### Updated MountContext Interface

```typescript
export interface MountContext<TKeys extends string = string> {
    modules: any[];
    observer: IMountObserver;
    rootNode: Node;
    
    /**
     * The configuration object for this observer.
     * Renamed from MountConfig for consistency with naming conventions.
     */
    mountConfig: MountConfig<TKeys>;
    
    /**
     * Map of sub-observers created from the `with` property.
     * Only present when the parent observer has sub-observers.
     * Keys match the keys from the `with` property in mountConfig.
     */
    withObservers?: {[K in TKeys]: IMountObserver};
}
```

### MountObserver Class Changes

#### New Private Field

```typescript
class MountObserver<TKeys extends string = string> {
    // ... existing fields ...
    
    /**
     * Map of sub-observers created from the `with` property.
     * Keys are the string keys from the `with` config.
     * Values are the MountObserver instances.
     * Cleared on disconnect().
     */
    #subObservers: Map<string, MountObserver> | undefined;
}
```

#### Updated Constructor Signature

```typescript
constructor(config: MountConfig<TKeys>, options: MountObserverOptions = {})
```

The constructor remains unchanged in implementation but gains the generic type parameter for type inference.

#### Updated observe() Method

The observe() method is enhanced to create sub-observers after setting up the root node:

```typescript
async observe(observedNode: Node): Promise<void> {
    // ... existing validation and setup ...
    
    this.#rootNode = new WeakRef(observedNode);
    
    // NEW: Create sub-observers from `with` property
    await this.#createSubObservers(observedNode);
    
    // ... existing observation logic ...
}
```

#### New Private Method: #createSubObservers()

```typescript
/**
 * Creates and initializes sub-observers from the `with` property.
 * Each sub-observer observes the same root node as the parent.
 * Sub-observers are stored in #subObservers Map for lifecycle management.
 */
async #createSubObservers(rootNode: Node): Promise<void> {
    const withConfig = this.#init.with;
    if (!withConfig) return;
    
    this.#subObservers = new Map();
    
    for (const [key, subConfig] of Object.entries(withConfig)) {
        const subObserver = new MountObserver(subConfig as MountConfig);
        this.#subObservers.set(key, subObserver);
        await subObserver.observe(rootNode);
    }
}
```

#### Updated disconnect() Method

The disconnect() method is enhanced to recursively disconnect sub-observers:

```typescript
disconnect(): void {
    if (this.#disconnected) return;
    
    // NEW: Disconnect all sub-observers first (recursive)
    if (this.#subObservers) {
        for (const subObserver of this.#subObservers.values()) {
            subObserver.disconnect();
        }
        this.#subObservers.clear();
        this.#subObservers = undefined;
    }
    
    // ... existing disconnection logic ...
    
    this.#disconnected = true;
}
```

#### Updated #createMountContext() Method

The method that creates MountContext objects is updated to:
1. Rename MountConfig → mountConfig
2. Add withObservers when sub-observers exist

```typescript
#createMountContext(modules: any[]): MountContext<TKeys> {
    const rootNode = this.#rootNode?.deref();
    if (!rootNode) {
        throw new Error('Root node has been garbage collected');
    }
    
    const context: MountContext<TKeys> = {
        modules,
        observer: this,
        rootNode,
        mountConfig: this.#init  // Renamed from MountConfig
    };
    
    // Add withObservers if sub-observers exist
    if (this.#subObservers && this.#subObservers.size > 0) {
        context.withObservers = {} as {[K in TKeys]: IMountObserver};
        for (const [key, subObserver] of this.#subObservers.entries()) {
            (context.withObservers as any)[key] = subObserver;
        }
    }
    
    return context;
}
```

### Breaking Change: MountConfig → mountConfig

All code that creates or accesses MountContext must be updated:

**Before:**
```typescript
const context = {
    modules,
    observer: this,
    rootNode,
    MountConfig: this.#init
};
```

**After:**
```typescript
const context = {
    modules,
    observer: this,
    rootNode,
    mountConfig: this.#init
};
```

This affects:
- MountObserver.ts: Context creation in #handleMatch() and other methods
- All handler classes that access context.MountConfig
- All tests that assert on context.MountConfig
- Event classes (MountEvent, DismountEvent) that include MountConfig

## Data Models

### Sub-observer Storage

Sub-observers are stored in a Map for efficient lookup and iteration:

```typescript
#subObservers: Map<string, MountObserver> | undefined
```

**Design rationale:**
- Map provides O(1) lookup by key
- Maintains insertion order for predictable iteration
- Undefined when no sub-observers (memory efficient)
- Easy to clear on disconnect()

### Type Parameter Flow

The generic type parameter TKeys flows through the system:

```typescript
// User defines config with specific keys
const config: MountConfig<'registry' | 'styles'> = {
    matching: '.parent',
    with: {
        registry: { matching: 'my-element' },
        styles: { import: './styles.css' }
    }
};

// Type parameter flows to MountObserver
const observer = new MountObserver(config);

// Type parameter flows to MountContext
// context.withObservers has keys 'registry' | 'styles'

// Handler gets typed access
do: (el, ctx) => {
    ctx.withObservers.registry  // ✓ TypeScript knows this exists
    ctx.withObservers.unknown   // ✗ TypeScript error
}
```

### Recursive Structure

Sub-observers can have their own sub-observers, creating a tree structure:

```
ParentObserver
├── #subObservers: Map {
│   ├── 'registry' → MountObserver
│   │   └── #subObservers: Map {
│   │       └── 'nested' → MountObserver
│   │   }
│   └── 'styles' → MountObserver
│       └── #subObservers: undefined
}
```

Each level maintains its own Map and manages its immediate children.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Sub-observer Creation Completeness

*For any* MountObserver with a `with` property containing N entries, calling observe() SHALL create exactly N sub-observers, each observing the same root node with its corresponding configuration from the `with` property.

**Validates: Requirements 1.2, 1.4, 2.1, 2.2, 2.3**

### Property 2: Configuration Isolation

*For any* parent MountObserver with specific configuration properties (matching, whereInstanceOf, etc.), sub-observers SHALL NOT inherit those properties unless explicitly specified in their own configuration within the `with` property.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Recursive Disconnection

*For any* MountObserver with sub-observers at any nesting depth, calling disconnect() SHALL recursively disconnect all descendant sub-observers before completing the parent's disconnection.

**Validates: Requirements 4.1, 4.2, 8.3**

### Property 4: Sub-observer Access in Context

*For any* MountObserver with sub-observers, the MountContext passed to mount handlers SHALL include a `withObservers` property containing all sub-observers indexed by their keys from the `with` property, and this SHALL hold recursively for nested sub-observers.

**Validates: Requirements 5.2, 5.3, 8.4**

### Property 5: MountConfig Property Naming

*For any* MountContext created by MountObserver, it SHALL have a `mountConfig` property (not `MountConfig`) containing the observer's configuration.

**Validates: Requirements 6.1, 6.2**

### Property 6: Recursive Sub-observer Creation

*For any* MountConfig with nested `with` properties at any depth, each level SHALL create its own sub-observers, with no artificial limit on nesting depth.

**Validates: Requirements 2.5, 8.1, 8.2**

### Property 7: Reference Lifecycle Management

*For any* MountObserver with sub-observers, the sub-observers SHALL remain accessible through the parent while the parent is active, and all references SHALL be released when disconnect() is called.

**Validates: Requirements 9.2, 9.3**

## Error Handling

### Configuration Validation

The implementation performs minimal validation on the `with` property:

1. **Type checking**: TypeScript enforces that `with` values are MountConfig objects
2. **Runtime checks**: No additional validation - invalid configs will fail when creating sub-observers
3. **Error propagation**: If a sub-observer's observe() fails, the error propagates to the parent's observe() call

**Design rationale:**
- Fail fast: Errors during observe() are easier to debug than silent failures
- Consistency: Sub-observers use the same validation as top-level observers
- Simplicity: No special-case validation logic

### Disconnection Safety

The disconnect() method is idempotent and safe to call multiple times:

```typescript
disconnect(): void {
    if (this.#disconnected) return;  // Guard against multiple calls
    
    if (this.#subObservers) {
        for (const subObserver of this.#subObservers.values()) {
            subObserver.disconnect();  // Each sub-observer is also idempotent
        }
        this.#subObservers.clear();
        this.#subObservers = undefined;
    }
    
    // ... rest of disconnection ...
}
```

### Garbage Collection Edge Cases

If the root node is garbage collected while observers are active:

1. Parent's #rootNode WeakRef returns undefined
2. Operations that need the root node will fail gracefully
3. Sub-observers have their own WeakRefs to the same node
4. All observers should be explicitly disconnected before allowing GC

**Recommendation**: Always call disconnect() explicitly rather than relying on GC.

### Circular Reference Prevention

The implementation does not prevent circular references in the `with` configuration:

```typescript
// This is possible but not recommended:
const config1: MountConfig = { with: { child: config2 } };
const config2: MountConfig = { with: { child: config1 } };
```

**Design decision**: We do not detect or prevent this because:
- It's a rare edge case
- Detection would add complexity and runtime cost
- The stack overflow that results is a clear error signal
- TypeScript's type system makes this difficult to express accidentally

**Recommendation**: Document this as a known limitation and advise against circular configurations.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests** focus on:
- Specific examples of sub-observer creation
- Edge cases (empty `with`, single sub-observer, no `with` property)
- Integration with existing MountObserver features
- Breaking change verification (mountConfig vs MountConfig)
- Error conditions (invalid configs, disconnection during observation)

**Property Tests** focus on:
- Universal properties across all valid configurations
- Recursive behavior with varying nesting depths
- Configuration isolation across random config combinations
- Lifecycle management with random operation sequences

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `// Feature: support-for-with, Property {number}: {property_text}`

**Example property test structure**:

```typescript
import fc from 'fast-check';

// Feature: support-for-with, Property 1: Sub-observer Creation Completeness
test('Sub-observer creation completeness', async () => {
    await fc.assert(
        fc.asyncProperty(
            fc.record({
                with: fc.dictionary(fc.string(), mountConfigArbitrary())
            }),
            async (config) => {
                const observer = new MountObserver(config);
                const rootNode = document.createElement('div');
                await observer.observe(rootNode);
                
                const expectedCount = Object.keys(config.with).length;
                const actualCount = observer.mountedElements.length; // Or access via test API
                
                expect(actualCount).toBe(expectedCount);
                
                observer.disconnect();
            }
        ),
        { numRuns: 100 }
    );
});
```

### Test Generators

Property tests require generators (arbitraries) for:

1. **MountConfig generator**: Creates random valid MountConfig objects
2. **Nested MountConfig generator**: Creates configs with `with` properties at various depths
3. **DOM node generator**: Creates random DOM structures for testing
4. **Key generator**: Creates random string keys for `with` properties

### Breaking Change Testing

All existing tests must be updated to use `mountConfig` instead of `MountConfig`:

```typescript
// Before
expect(context.MountConfig.matching).toBe('.test');

// After
expect(context.mountConfig.matching).toBe('.test');
```

**Test migration strategy**:
1. Run existing test suite to identify failures
2. Update each test file systematically
3. Search codebase for `context.MountConfig` and replace with `context.mountConfig`
4. Verify all tests pass

### Integration Testing

Integration tests verify that sub-observers work with existing features:

1. **Media queries**: Sub-observers with different media queries
2. **Intersection observers**: Sub-observers with different intersection configs
3. **Import loading**: Sub-observers with different import requirements
4. **Handler execution**: Handlers accessing withObservers
5. **Event dispatching**: Events from parent and sub-observers

### Performance Testing

While not part of the correctness properties, performance tests should verify:

1. Sub-observer creation overhead is acceptable (< 10ms per sub-observer)
2. Memory usage scales linearly with number of sub-observers
3. Disconnection completes in reasonable time for deep hierarchies (< 100ms for depth 10)

## Implementation Plan

### Phase 1: Type Definitions

1. Update MountConfig interface with generic type parameter and `with` property
2. Update MountContext interface with generic type parameter, rename MountConfig → mountConfig, add withObservers
3. Update IMountEvent and IDismountEvent interfaces to use mountConfig
4. Compile and verify no type errors

### Phase 2: MountObserver Core Changes

1. Add generic type parameter to MountObserver class
2. Add #subObservers private field
3. Implement #createSubObservers() method
4. Update observe() to call #createSubObservers()
5. Update disconnect() to disconnect sub-observers
6. Update #createMountContext() to use mountConfig and add withObservers

### Phase 3: Breaking Change Migration

1. Search codebase for all references to `context.MountConfig`
2. Update MountObserver.ts internal code
3. Update all handler classes
4. Update all event classes
5. Update all test files
6. Verify compilation and test passage

### Phase 4: Testing

1. Write unit tests for basic sub-observer functionality
2. Write property-based tests for correctness properties
3. Write integration tests with existing features
4. Write edge case tests
5. Update existing tests for breaking change

### Phase 5: Documentation

1. Update API documentation with `with` property examples
2. Document type safety features
3. Add migration guide for breaking change
4. Add examples of common patterns (registry management, progressive enhancement)
5. Document known limitations (circular references)

## Migration Guide

### For Library Users

**Breaking Change**: The `MountContext.MountConfig` property has been renamed to `MountContext.mountConfig`.

**Before:**
```typescript
const observer = new MountObserver({
    matching: '.my-element',
    do: (el, ctx) => {
        console.log(ctx.MountConfig.matching);  // Old name
    }
});
```

**After:**
```typescript
const observer = new MountObserver({
    matching: '.my-element',
    do: (el, ctx) => {
        console.log(ctx.mountConfig.matching);  // New name
    }
});
```

**Migration steps:**
1. Search your codebase for `context.MountConfig` or `ctx.MountConfig`
2. Replace with `context.mountConfig` or `ctx.mountConfig`
3. If using TypeScript, the compiler will catch any missed occurrences

### Using the with Property

**Basic usage:**
```typescript
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

**Accessing sub-observers in handlers:**
```typescript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: { matching: 'my-element' }
    },
    do: (el, ctx) => {
        // Access sub-observer
        const registryObserver = ctx.withObservers.registry;
        console.log('Registry observer:', registryObserver);
    }
});
```

**Nested sub-observers:**
```typescript
const observer = new MountObserver({
    matching: '.root',
    with: {
        level1: {
            matching: '.level1',
            with: {
                level2: {
                    matching: '.level2'
                }
            }
        }
    }
});
```

## Open Questions and Future Considerations

### 1. Should sub-observers inherit the parent's disconnectedSignal?

**Current design**: Each sub-observer has its own AbortController and disconnectedSignal.

**Alternative**: Sub-observers could share the parent's disconnectedSignal, automatically aborting when the parent disconnects.

**Decision**: Keep separate signals for now. This provides more flexibility and follows the principle of explicit lifecycle management.

### 2. Should there be a way to access the parent from a sub-observer?

**Current design**: Sub-observers have no reference to their parent.

**Use case**: A sub-observer might want to coordinate with its parent or access parent state.

**Decision**: Not included in initial implementation. Can be added later if needed without breaking changes.

### 3. Should sub-observers be exposed via a public API?

**Current design**: Sub-observers are only accessible through MountContext.withObservers in handlers.

**Alternative**: Add a public `getSubObserver(key: string)` method to MountObserver.

**Decision**: Keep private for now. The MountContext access pattern is sufficient for most use cases.

### 4. Should there be lifecycle hooks for sub-observer creation?

**Current design**: Sub-observers are created silently during observe().

**Use case**: Debugging, logging, or custom initialization logic when sub-observers are created.

**Decision**: Not included in initial implementation. Can be added via events if needed.

### 5. Performance optimization for large numbers of sub-observers?

**Current design**: All sub-observers are created eagerly during observe().

**Alternative**: Lazy creation - only create sub-observers when their matching elements are found.

**Decision**: Eager creation for simplicity. Lazy creation can be added as an optimization if profiling shows it's needed.

## Conclusion

This design provides a robust foundation for hierarchical observer composition while maintaining type safety, memory efficiency, and clean lifecycle management. The breaking change to rename MountConfig → mountConfig improves API consistency, and the generic type parameter system ensures compile-time safety for sub-observer access.

The implementation is straightforward, with most complexity handled by recursive application of existing MountObserver patterns. The testing strategy ensures correctness through both concrete examples and universal properties.
