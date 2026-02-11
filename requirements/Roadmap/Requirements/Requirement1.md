# Requirement 1: Add Attribute Mapping Interface to IBaseRegistryItem

## Goal
Extend `IBaseRegistryItem` in assign-gingerly to support attribute mapping configuration without introducing mount-observer-specific terminology.

## Background
Currently, mount-observer's `MountInit` interface has `whereAttr?: WhereAttr` and `map?: MapConfig` for declarative attribute observation and mapping. We need to add similar capability to assign-gingerly's `IBaseRegistryItem`, but with terminology that makes sense for programmatic attachment rather than declarative mounting.

## Proposed Changes

### New Interface in assign-gingerly
Add a new interface `AttrMapping` that captures the essence of attribute-to-property mapping:

```typescript
export interface AttrMapping {
  /**
   * Attribute name to observe (e.g., "data-count", "aria-label")
   */
  attrName: string;
  
  /**
   * Property name on the spawned class instance to map to
   */
  propName: string;
  
  /**
   * Optional parser function to transform attribute string value
   * Defaults to identity function (string passthrough)
   */
  parser?: (attrValue: string | null) => any;
  
  /**
   * Whether to only read the initial value (true) or continue observing changes (false)
   * Defaults to true (initial read only)
   */
  initialOnly?: boolean;
}
```

### Extend IBaseRegistryItem
```typescript
export interface IBaseRegistryItem<T = any> {
  spawn: { new (oElement?: Element, ctx?: SpawnContext<T>, initVals?: Partial<T>): T };
  map: { [key: string | symbol]: keyof T };
  enhKey?: string;
  lifecycleKeys?: {
    dispose?: string;
    resolved?: string;
  };
  // NEW: Attribute mappings for initial value reading
  attrMappings?: AttrMapping[];
}
```

## Rationale
- `attrMappings` is neutral terminology that works for both programmatic and declarative scenarios
- `initialOnly` flag allows assign-gingerly to focus on initial reads while mount-observer handles ongoing observation
- Parser function provides flexibility for type conversion (string → number, JSON parsing, etc.)
- This doesn't break existing code since it's an optional field

## Next Steps
This is a pure interface addition with no implementation. The next requirement will handle reading initial attribute values during spawning.

## Open Questions
1. Should we support nested property paths (e.g., "style.color") in `propName`?
2. Should we have built-in parsers for common types (number, boolean, JSON)?
3. Do we need a way to specify attribute name prefixes/namespaces?
