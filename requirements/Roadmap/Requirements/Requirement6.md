# Requirement 6: Formalize MountInit extends IBaseRegistryItem

## Goal
Make `MountInit` formally extend `IBaseRegistryItem` in the type system, ensuring type safety and making the relationship explicit.

## Background
After implementing Requirements 1-5, we have:
- `IBaseRegistryItem` with `attrMappings` support
- `MountInit` with `spawn`, `enhKey`, and `lifecycleKeys`
- Conversion utilities between the two

Now we should formalize this relationship in the type system.

## Proposed Changes

### Update MountInit to Extend IBaseRegistryItem
```typescript
import { IBaseRegistryItem, SpawnContext } from 'assign-gingerly';

export interface MountInit extends Partial<IBaseRegistryItem> {
  // Mount-observer specific matching criteria
  whereElementMatches: string;
  whereAttr?: WhereAttr;
  whereInstanceOf?: Constructor | Constructor[];
  whereMediaMatches?: string | MediaQueryList;
  whereOutside?: string;
  
  // Import and execution
  import?: string | ImportSpec | Array<string | ImportSpec>;
  do?: string | DoCallback | (string | DoCallback)[];
  loadingEagerness?: 'eager' | 'lazy';
  
  // Assignment hooks
  assignOnMount?: Record<string, any>;
  assignOnDismount?: Record<string, any>;
  
  // Attribute mapping (mount-observer's version)
  map?: MapConfig;
  
  // Events and metadata
  getPlayByPlay?: boolean;
  mountedElemEmits?: EventConfig | EventConfig[];
  reference?: number | number[];
  customData?: unknown;
  
  // Inherited from IBaseRegistryItem (now explicit):
  // spawn?: { new (oElement?: Element, ctx?: SpawnContext, initVals?: any): any };
  // map?: { [key: string | symbol]: keyof T }; // NOTE: Conflict with MapConfig!
  // enhKey?: string;
  // lifecycleKeys?: { dispose?: string; resolved?: string };
  // attrMappings?: AttrMapping[];
}
```

## Type Conflict: map Property

There's a naming conflict:
- `IBaseRegistryItem.map` is for symbol-based dependency injection
- `MountInit.map` (MapConfig) is for attribute coordinate mapping

### Resolution Strategy

Option A: Rename in MountInit
```typescript
export interface MountInit extends Partial<IBaseRegistryItem> {
  // Rename to avoid conflict
  attrMap?: MapConfig; // Was: map
  
  // Inherited from IBaseRegistryItem
  // map?: { [key: string | symbol]: keyof T }; // For DI
}
```

Option B: Keep Both, Use Discriminated Union
```typescript
export interface MountInit extends Partial<Omit<IBaseRegistryItem, 'map'>> {
  // Mount-observer's attribute mapping
  map?: MapConfig;
  
  // Separate property for DI mapping
  diMap?: { [key: string | symbol]: any };
}
```

Option C: Merge Semantics (Complex)
```typescript
// Allow map to be either MapConfig or DI map
// Detect at runtime based on key types (string coordinates vs symbols)
export interface MountInit extends Partial<IBaseRegistryItem> {
  map?: MapConfig | { [key: string | symbol]: any };
}
```

### Recommendation: Option B
Keep `map` as `MapConfig` in `MountInit` (backward compatible), add `diMap` for dependency injection. This:
- Preserves existing mount-observer code
- Makes the distinction clear
- Allows both features to coexist

## Updated Interface
```typescript
export interface MountInit extends Partial<Omit<IBaseRegistryItem, 'map'>> {
  // Mount-observer specific matching
  whereElementMatches: string;
  whereAttr?: WhereAttr;
  whereInstanceOf?: Constructor | Constructor[];
  whereMediaMatches?: string | MediaQueryList;
  whereOutside?: string;
  
  // Import and execution
  import?: string | ImportSpec | Array<string | ImportSpec>;
  do?: string | DoCallback | (string | DoCallback)[];
  loadingEagerness?: 'eager' | 'lazy';
  
  // Assignment hooks
  assignOnMount?: Record<string, any>;
  assignOnDismount?: Record<string, any>;
  
  // Attribute coordinate mapping (mount-observer specific)
  map?: MapConfig;
  
  // Dependency injection mapping (from IBaseRegistryItem)
  diMap?: { [key: string | symbol]: any };
  
  // Events and metadata
  getPlayByPlay?: boolean;
  mountedElemEmits?: EventConfig | EventConfig[];
  reference?: number | number[];
  customData?: unknown;
  
  // Explicitly inherited from IBaseRegistryItem:
  // spawn?: { new (oElement?: Element, ctx?: SpawnContext, initVals?: any): any };
  // enhKey?: string;
  // lifecycleKeys?: { dispose?: string; resolved?: string };
  // attrMappings?: AttrMapping[]; // Auto-generated from whereAttr + map
}
```

## Conversion Function Update
```typescript
function mountInitToRegistryItem(
  mountInit: MountInit,
  isCustomElement: boolean
): IBaseRegistryItem | null {
  if (!mountInit.spawn) {
    return null;
  }
  
  return {
    spawn: mountInit.spawn,
    map: mountInit.diMap || {}, // Use diMap for DI
    enhKey: mountInit.enhKey,
    lifecycleKeys: mountInit.lifecycleKeys,
    attrMappings: convertToAttrMappings(
      mountInit.whereAttr,
      mountInit.map, // Use map for attribute mapping
      isCustomElement
    )
  };
}
```

## Benefits
- Type safety: TypeScript enforces the relationship
- Clear inheritance: Developers see that MountInit builds on IBaseRegistryItem
- Flexibility: Both attribute mapping and DI mapping are supported
- Documentation: The type system documents the architecture

## Migration Impact
- Existing code using `MountInit.map` for attributes: No change
- New code wanting DI: Use `diMap` property
- Type checking: May catch previously unnoticed issues (good!)

## Testing Considerations
- Test that MountInit satisfies IBaseRegistryItem type constraints
- Test with both `map` (attributes) and `diMap` (DI) specified
- Test conversion to IBaseRegistryItem preserves all fields
- Test backward compatibility with existing MountInit usage

## Documentation Needs
- Update docs to explain the relationship between MountInit and IBaseRegistryItem
- Document the `map` vs `diMap` distinction
- Provide examples of using both features together
- Migration guide for users wanting to adopt spawn-based approach

## Next Steps
After this, we should create comprehensive examples and update the proposal documentation to reflect the unified architecture.
