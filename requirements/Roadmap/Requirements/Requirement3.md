# Requirement 3: Create Utility to Convert WhereAttr/MapConfig to AttrMapping[]

## Goal
Build a utility function in mount-observer that converts the existing `whereAttr?: WhereAttr` and `map?: MapConfig` from `MountInit` into the simpler `attrMappings: AttrMapping[]` format that assign-gingerly understands.

## Background
mount-observer has a sophisticated attribute coordinate system (via `attrCoordinates.ts`) that builds attribute names from prefixes, bases, and branches. The `MapConfig` then maps coordinates to property names and provides parsing logic. We need to flatten this into the simpler `AttrMapping[]` format.

## Proposed Implementation

### New Utility Function in mount-observer
```typescript
/**
 * Converts MountInit's whereAttr and map config into AttrMapping[] for assign-gingerly
 * @param whereAttr - The whereAttr configuration
 * @param map - The map configuration
 * @param isCustomElement - Whether the target is a custom element
 * @returns Array of AttrMapping objects for assign-gingerly
 */
export function convertToAttrMappings(
  whereAttr: WhereAttr | undefined,
  map: MapConfig | undefined,
  isCustomElement: boolean
): AttrMapping[] {
  if (!whereAttr || !map) {
    return [];
  }
  
  // Use existing buildAttrCoordinateMap to get attr -> coordinate mapping
  const attrCoordinateMap = buildAttrCoordinateMap(whereAttr, isCustomElement);
  
  const mappings: AttrMapping[] = [];
  
  // For each attribute in the coordinate map
  for (const [attrName, coordinate] of Object.entries(attrCoordinateMap)) {
    // Check if this coordinate has a map entry
    const mapEntry = map[coordinate];
    
    if (mapEntry && mapEntry.mapsTo) {
      mappings.push({
        attrName,
        propName: mapEntry.mapsTo,
        parser: createParserFromMapEntry(mapEntry),
        initialOnly: mapEntry.once ?? true // Default to true for initial-only
      });
    }
  }
  
  return mappings;
}

/**
 * Creates a parser function from a MapEntry
 */
function createParserFromMapEntry(mapEntry: MapEntry): (value: string | null) => any {
  // If mapEntry specifies instanceOf, try to parse accordingly
  if (mapEntry.instanceOf === 'Number') {
    return (v) => v === null ? null : Number(v);
  }
  if (mapEntry.instanceOf === 'Boolean') {
    return (v) => v !== null; // Presence = true
  }
  if (mapEntry.instanceOf === 'Object' || mapEntry.instanceOf === 'Array') {
    return (v) => {
      if (v === null) return null;
      try {
        return JSON.parse(v);
      } catch {
        return v; // Fallback to string
      }
    };
  }
  
  // Default: return string as-is
  return (v) => v;
}
```

## Integration Point
When mount-observer creates or updates a `MountInit` that will be passed to assign-gingerly's registry, it should:

1. Call `convertToAttrMappings()` to generate `attrMappings`
2. Add `attrMappings` to the registry item before pushing to `assignGingerlyRegistry`
3. Continue using its own attribute observation for ongoing changes

## Example Flow
```typescript
// In mount-observer, when setting up a mount:
const mountInit: MountInit = {
  whereElementMatches: 'button',
  whereAttr: {
    hasBuiltInRootIn: ['data'],
    hasBase: 'count',
    hasBranchIn: []
  },
  map: {
    '0': {
      mapsTo: 'count',
      instanceOf: 'Number'
    }
  }
};

// Convert for assign-gingerly
const attrMappings = convertToAttrMappings(
  mountInit.whereAttr, 
  mountInit.map, 
  false // built-in element
);
// Result: [{ attrName: 'data-count', propName: 'count', parser: Number, initialOnly: true }]

// Add to registry item
const registryItem: IBaseRegistryItem = {
  spawn: MyEnhancementClass,
  map: {},
  enhKey: 'myEnhancement',
  attrMappings // <-- NEW
};
```

## Benefits
- Reuses existing `buildAttrCoordinateMap` logic (no duplication)
- Provides a clean bridge between mount-observer's complex config and assign-gingerly's simple format
- Allows mount-observer to continue using its sophisticated attribute system
- assign-gingerly gets a simple, flat list of attributes to read

## Testing Considerations
- Test with simple whereAttr (single attribute)
- Test with complex whereAttr (branches, custom delimiters)
- Test with various instanceOf types in MapConfig
- Test with missing map entries (should skip those attributes)
- Test with custom element vs built-in element prefixes

## Next Steps
After this, we need to handle the ongoing attribute observation in mount-observer, ensuring it doesn't duplicate the initial read.
