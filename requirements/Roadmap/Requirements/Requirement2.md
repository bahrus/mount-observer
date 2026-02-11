# Requirement 2: Implement Initial Attribute Reading in ElementEnhancementContainer

## Goal
Modify `ElementEnhancementContainer.get()` in assign-gingerly's object-extension.ts to read initial attribute values and merge them into `initVals` when spawning a class instance.

## Background
Currently, when spawning a class instance, `ElementEnhancementContainer.get()` only passes existing values from `oElement.enh.myEnhancement` as `initVals`. We need to also read attributes specified in `registryItem.attrMappings` and include those values in `initVals`.

## Proposed Implementation

### New Helper Function
Add a helper function to read and parse attributes:

```typescript
/**
 * Reads initial attribute values from an element based on attrMappings
 * @param element - The element to read attributes from
 * @param attrMappings - Array of attribute mapping configurations
 * @returns Object with property names as keys and parsed attribute values
 */
function readInitialAttributes(
  element: Element, 
  attrMappings: AttrMapping[] | undefined
): Record<string, any> {
  if (!attrMappings || attrMappings.length === 0) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  for (const mapping of attrMappings) {
    const attrValue = element.getAttribute(mapping.attrName);
    
    // Only include if attribute exists
    if (attrValue !== null) {
      const parser = mapping.parser || ((v: string | null) => v);
      result[mapping.propName] = parser(attrValue);
    }
  }
  
  return result;
}
```

### Modify ElementEnhancementContainer.get()
Update the spawning logic to merge attribute values:

```typescript
// Current code (simplified):
const initVals = self[registryItem.enhKey] && 
                !(self[registryItem.enhKey] instanceof SpawnClass)
                ? self[registryItem.enhKey]
                : undefined;
instance = new SpawnClass(element, ctx, initVals);

// Proposed change:
const enhInitVals = self[registryItem.enhKey] && 
                   !(self[registryItem.enhKey] instanceof SpawnClass)
                   ? self[registryItem.enhKey]
                   : {};

const attrInitVals = readInitialAttributes(element, registryItem.attrMappings);

// Merge: enh values take precedence over attribute values
const mergedInitVals = { ...attrInitVals, ...enhInitVals };

instance = new SpawnClass(element, ctx, mergedInitVals);
```

## Merge Strategy
Attribute values are read first, then existing `enh` values override them. This allows:
1. Server-rendered HTML attributes to provide defaults
2. Programmatic `enh` assignments to override those defaults
3. Predictable precedence: programmatic > declarative

## Benefits
- Spawned classes receive both attribute data and programmatic data in one `initVals` object
- No breaking changes to existing code (attrMappings is optional)
- Clean separation: assign-gingerly reads initial values, mount-observer handles ongoing observation

## Testing Considerations
- Test with no attrMappings (should work as before)
- Test with attrMappings but no attributes present
- Test with attrMappings and attributes present
- Test precedence: enh values should override attribute values
- Test with custom parser functions

## Next Steps
After this, we need to create a bridge between mount-observer's `WhereAttr`/`MapConfig` and assign-gingerly's `AttrMapping[]`.
