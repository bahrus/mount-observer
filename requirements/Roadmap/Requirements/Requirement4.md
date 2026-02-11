# Requirement 4: Update mount-observer to Skip Initial Attribute Read

## Goal
Modify mount-observer's attribute change observation logic to avoid redundantly reading initial attribute values that assign-gingerly has already processed.

## Background
Currently, mount-observer's `checkAttrChanges` function observes attribute changes and applies them. Once assign-gingerly handles initial attribute reading, mount-observer should:
1. NOT re-read initial values (assign-gingerly already did this)
2. ONLY observe and apply subsequent attribute changes
3. Continue to provide the full attribute observation capability for users who want reactive attributes

## Proposed Changes

### Add Flag to Track Initial Read
When mount-observer spawns an instance via assign-gingerly, it should mark that the initial attributes have been read:

```typescript
// In the spawning/mounting logic
const registryItem: IBaseRegistryItem = {
  spawn: MyEnhancementClass,
  map: {},
  enhKey: 'myEnhancement',
  attrMappings: convertToAttrMappings(mountInit.whereAttr, mountInit.map, isCustomElement)
};

// Spawn via assign-gingerly (which reads initial attributes)
const instance = element.enh.get(registryItem);

// Mark that initial attributes have been processed
const metadata = {
  initialAttributesProcessed: true,
  registryItem,
  mountInit
};

// Store metadata for attribute observer
storeElementMetadata(element, metadata);
```

### Modify checkAttrChanges Logic
Update `checkAttrChanges` to skip initial processing:

```typescript
export function checkAttrChanges(
  element: Element,
  mountInit: MountInit,
  // ... other params
) {
  const metadata = getElementMetadata(element);
  
  // If initial attributes were already processed by assign-gingerly, skip initial read
  const skipInitialRead = metadata?.initialAttributesProcessed ?? false;
  
  // Build attribute coordinate map
  const attrCoordinateMap = buildAttrCoordinateMap(
    mountInit.whereAttr, 
    isCustomElement
  );
  
  // Set up MutationObserver for ongoing changes
  const observer = new MutationObserver((mutations) => {
    const changes: AttrChange[] = [];
    
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName) {
        const attrName = mutation.attributeName;
        const coordinate = attrCoordinateMap[attrName];
        
        if (coordinate && mountInit.map?.[coordinate]) {
          const mapEntry = mountInit.map[coordinate];
          const attrValue = element.getAttribute(attrName);
          
          changes.push({
            attrName,
            coordinate,
            value: attrValue,
            attrNode: element.getAttributeNode(attrName),
            mapEntry,
            element
          });
        }
      }
    }
    
    if (changes.length > 0) {
      // Apply changes to the spawned instance
      applyAttributeChanges(element, changes, mountInit);
    }
  });
  
  // Start observing
  observer.observe(element, {
    attributes: true,
    attributeOldValue: true
  });
  
  // ONLY if we didn't skip initial read, process current attribute values
  if (!skipInitialRead) {
    // Legacy path: read and apply initial attributes
    const initialChanges = readCurrentAttributes(element, attrCoordinateMap, mountInit.map);
    if (initialChanges.length > 0) {
      applyAttributeChanges(element, initialChanges, mountInit);
    }
  }
  
  return observer;
}
```

## Key Insight
The `initialOnly` flag in `AttrMapping` determines behavior:
- `initialOnly: true` → assign-gingerly reads once, mount-observer observes changes
- `initialOnly: false` → assign-gingerly reads once, mount-observer observes changes (same behavior)

The difference is semantic: `initialOnly: true` signals that the primary use case is server-rendered HTML, while `false` signals reactive attribute binding is expected.

## Benefits
- Eliminates duplicate initial attribute reads
- Clear separation of concerns:
  - assign-gingerly: initial handshake with HTML
  - mount-observer: ongoing reactive observation
- No breaking changes for existing mount-observer users
- Performance improvement (one less attribute scan)

## Edge Cases to Handle
1. What if mount-observer is used without assign-gingerly?
   - Keep legacy path: if no metadata, do initial read
2. What if attributes change between spawn and observation setup?
   - MutationObserver will catch them
3. What if user wants to disable ongoing observation?
   - Could add a flag to MountInit: `observeAttributeChanges?: boolean`

## Testing Considerations
- Test that initial attributes are NOT read twice
- Test that subsequent attribute changes ARE observed
- Test legacy path (mount-observer without assign-gingerly)
- Test timing: attribute changes during spawn
- Test with `initialOnly: true` vs `false` (should behave the same for now)

## Next Steps
After this, we should consider adding the `spawn` option to `MountInit` as mentioned in the original requirement document.
