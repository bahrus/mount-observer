# Requirement 5: Add spawn Support to MountInit

## Goal
Extend `MountInit` interface to support the `spawn` class constructor option, making it compatible with `IBaseRegistryItem` and enabling programmatic class spawning in addition to declarative handlers.

## Background
Currently, `MountInit` supports:
- `do?: string | DoCallback | (string | DoCallback)[]` - Imperative callbacks
- Declarative handlers (via `MountObserver.define()`)

But it doesn't support the `spawn` option from `IBaseRegistryItem`, which allows for class-based enhancements with lifecycle management. This is the next step in making `MountInit` extend `IBaseRegistryItem`.

## Proposed Changes

### Extend MountInit Interface
```typescript
export interface MountInit {
  whereElementMatches: string;
  whereAttr?: WhereAttr;
  whereInstanceOf?: Constructor | Constructor[];
  whereMediaMatches?: string | MediaQueryList;
  whereOutside?: string;
  import?: string | ImportSpec | Array<string | ImportSpec>;
  
  // Existing callback-based approach
  do?: string | DoCallback | (string | DoCallback)[];
  
  // NEW: Class-based approach (from IBaseRegistryItem)
  spawn?: { new (oElement?: Element, ctx?: SpawnContext, initVals?: any): any };
  enhKey?: string;
  lifecycleKeys?: {
    dispose?: string;
    resolved?: string;
  };
  
  loadingEagerness?: 'eager' | 'lazy';
  assignOnMount?: Record<string, any>;
  assignOnDismount?: Record<string, any>;
  map?: MapConfig;
  getPlayByPlay?: boolean;
  mountedElemEmits?: EventConfig | EventConfig[];
  reference?: number | number[];
  customData?: unknown;
}
```

## Behavior

### When spawn is Specified
If `spawn` is present in `MountInit`:

1. Convert `MountInit` to `IBaseRegistryItem` format
2. Push to `element.customElementRegistry.assignGingerlyRegistry`
3. Call `element.enh.get(registryItem)` to spawn the instance
4. The spawned instance receives:
   - `oElement`: The mounted element
   - `ctx`: Contains `{ mountInfo: registryItem }`
   - `initVals`: Merged from attributes (via `attrMappings`) and `assignOnMount`

### Precedence Rules
When both `spawn` and `do` are specified:
- Execute `spawn` first (creates the instance)
- Then execute `do` callbacks (can interact with the spawned instance via `element.enh[enhKey]`)

### Integration with assignOnMount
```typescript
// If MountInit has both spawn and assignOnMount:
const mountInit: MountInit = {
  whereElementMatches: 'button',
  spawn: MyButtonEnhancement,
  enhKey: 'myButton',
  whereAttr: { hasBuiltInRootIn: ['data'], hasBase: 'count' },
  map: { '0': { mapsTo: 'count', instanceOf: 'Number' } },
  assignOnMount: {
    label: 'Click me',
    enabled: true
  }
};

// Internally, mount-observer will:
// 1. Convert to IBaseRegistryItem with attrMappings
// 2. Spawn via assign-gingerly (reads attributes into initVals)
// 3. Apply assignOnMount to the spawned instance
```

## Implementation Strategy

### New Helper Function
```typescript
/**
 * Converts MountInit to IBaseRegistryItem if spawn is specified
 */
function mountInitToRegistryItem(
  mountInit: MountInit,
  isCustomElement: boolean
): IBaseRegistryItem | null {
  if (!mountInit.spawn) {
    return null; // Not using spawn, use legacy do callbacks
  }
  
  return {
    spawn: mountInit.spawn,
    map: {}, // Could be populated from mountInit.map if needed
    enhKey: mountInit.enhKey,
    lifecycleKeys: mountInit.lifecycleKeys,
    attrMappings: convertToAttrMappings(
      mountInit.whereAttr,
      mountInit.map,
      isCustomElement
    )
  };
}
```

### Update Mount Logic
```typescript
// In mount-observer's mounting logic
function handleMount(element: Element, mountInit: MountInit) {
  // Check if using spawn-based approach
  const registryItem = mountInitToRegistryItem(mountInit, isCustomElement(element));
  
  if (registryItem) {
    // Spawn via assign-gingerly
    const instance = element.enh.get(registryItem);
    
    // Apply assignOnMount if specified
    if (mountInit.assignOnMount) {
      Object.assign(instance, mountInit.assignOnMount);
    }
    
    // Set up attribute observation (skips initial read)
    if (mountInit.map) {
      checkAttrChanges(element, mountInit, /* skipInitial */ true);
    }
    
    // Execute do callbacks if specified
    if (mountInit.do) {
      executeDo(element, mountInit);
    }
  } else {
    // Legacy path: use do callbacks only
    if (mountInit.do) {
      executeDo(element, mountInit);
    }
  }
}
```

## Benefits
- Unifies programmatic (assign-gingerly) and declarative (mount-observer) approaches
- Enables lifecycle management (dispose, resolved) in declarative scenarios
- Provides a migration path from `do` callbacks to class-based enhancements
- Makes `MountInit` a superset of `IBaseRegistryItem` (moving toward the goal)

## Migration Path for Users
Users can gradually migrate from:

```typescript
// Old: callback-based
{
  whereElementMatches: 'button',
  do: (element) => {
    element.addEventListener('click', handleClick);
  }
}

// New: class-based
{
  whereElementMatches: 'button',
  spawn: ButtonEnhancement,
  enhKey: 'button'
}
```

## Testing Considerations
- Test spawn without do (class-only)
- Test spawn with do (both execute)
- Test spawn with assignOnMount (values applied to instance)
- Test spawn with whereAttr/map (attributes read into initVals)
- Test lifecycle methods (dispose when dismounted)
- Test enhKey access (element.enh[enhKey] returns instance)

## Open Questions
1. Should `map` in `MountInit` also populate `IBaseRegistryItem.map` for symbol-based DI?
2. How do we handle `assignOnDismount` with spawn? (Call dispose lifecycle?)
3. Should we deprecate `do` in favor of `spawn`? (Probably not, both have use cases)

## Next Steps
After this, we should document the complete flow and create examples showing the unified approach.
