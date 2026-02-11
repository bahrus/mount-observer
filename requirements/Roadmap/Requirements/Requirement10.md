# Requirement 10: Error Handling and Edge Cases

## Goal
Ensure the unified architecture handles errors gracefully and covers edge cases that could arise in real-world usage.

## Background
The unified architecture introduces several points where errors could occur:
- Invalid attribute values
- Parser failures
- Missing or invalid registry items
- Lifecycle method errors
- Timing issues (attributes changing during spawn)

We need to handle these gracefully and provide helpful error messages.

## Error Scenarios

### 1. Parser Errors
```typescript
// Attribute: data-count="not-a-number"
// Parser: AttrParsers.number
// Result: NaN or null?
```

**Proposed Handling:**
- Return `null` for unparseable values
- Log warning in debug mode
- Don't throw (allow graceful degradation)

```typescript
number: (value: string | null): number | null => {
  if (value === null) return null;
  const num = Number(value);
  if (isNaN(num)) {
    if (DEBUG) console.warn(`Failed to parse "${value}" as number`);
    return null;
  }
  return num;
}
```

### 2. JSON Parse Errors
```typescript
// Attribute: data-config="invalid json"
// Parser: AttrParsers.json
```

**Proposed Handling:**
- Return original string as fallback
- Log warning in debug mode
- Allow custom error handler

```typescript
json: (value: string | null): any => {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    if (DEBUG) console.warn(`Failed to parse JSON: "${value}"`, error);
    return value; // Fallback to string
  }
}
```

### 3. Missing Spawn Class
```typescript
const registryItem: IBaseRegistryItem = {
  spawn: undefined as any, // Oops!
  enhKey: 'test'
};
```

**Proposed Handling:**
- Throw descriptive error
- Include registry item details
- Suggest fix

```typescript
if (!registryItem.spawn) {
  throw new Error(
    `Registry item missing spawn class. ` +
    `enhKey: ${registryItem.enhKey || 'none'}`
  );
}
```

### 4. Constructor Errors
```typescript
class BrokenEnhancement {
  constructor(element: Element, ctx: SpawnContext, initVals: any) {
    throw new Error('Constructor failed!');
  }
}
```

**Proposed Handling:**
- Catch and wrap error with context
- Clean up partial state
- Allow error to propagate with details

```typescript
try {
  instance = new SpawnClass(element, ctx, initVals);
} catch (error) {
  console.error(
    `Failed to spawn instance for enhKey "${registryItem.enhKey}":`,
    error
  );
  // Clean up
  instances.delete(registryItem);
  throw error; // Re-throw with context
}
```

### 5. Lifecycle Method Errors
```typescript
class Enhancement {
  dispose() {
    throw new Error('Dispose failed!');
  }
}
```

**Proposed Handling:**
- Catch and log, but continue cleanup
- Don't let one error prevent other cleanups

```typescript
try {
  if (disposeKey && typeof spawnedInstance[disposeKey] === 'function') {
    spawnedInstance[disposeKey](registryItem);
  }
} catch (error) {
  console.error(
    `Error in dispose lifecycle for enhKey "${registryItem.enhKey}":`,
    error
  );
  // Continue with cleanup anyway
}
```

### 6. Attribute Changes During Spawn
```typescript
// Attribute changes while constructor is running
// Could cause race condition
```

**Proposed Handling:**
- Queue attribute changes during spawn
- Apply after constructor completes
- Use a "spawning" flag

```typescript
class ElementEnhancementContainer {
  private spawning = new Set<IBaseRegistryItem>();
  
  get(registryItem: IBaseRegistryItem): any {
    // Mark as spawning
    this.spawning.add(registryItem);
    
    try {
      instance = new SpawnClass(element, ctx, initVals);
      instances.set(registryItem, instance);
    } finally {
      this.spawning.delete(registryItem);
    }
    
    return instance;
  }
  
  isSpawning(registryItem: IBaseRegistryItem): boolean {
    return this.spawning.has(registryItem);
  }
}
```

### 7. Circular Dependencies
```typescript
// Class A depends on Class B
// Class B depends on Class A
```

**Proposed Handling:**
- Detect circular dependencies
- Throw descriptive error
- Suggest restructuring

```typescript
const spawningStack: IBaseRegistryItem[] = [];

function spawnInstance(registryItem: IBaseRegistryItem): any {
  if (spawningStack.includes(registryItem)) {
    const cycle = spawningStack
      .slice(spawningStack.indexOf(registryItem))
      .map(item => item.enhKey || 'unknown')
      .join(' -> ');
    throw new Error(`Circular dependency detected: ${cycle}`);
  }
  
  spawningStack.push(registryItem);
  try {
    // ... spawn logic
  } finally {
    spawningStack.pop();
  }
}
```

### 8. Missing Element
```typescript
// Element is removed from DOM during spawn
```

**Proposed Handling:**
- Check if element is still connected
- Allow spawn to complete (instance may still be useful)
- Log warning if element is disconnected

```typescript
if (!element.isConnected && DEBUG) {
  console.warn(
    `Spawning instance for disconnected element. ` +
    `enhKey: ${registryItem.enhKey}`
  );
}
```

### 9. Invalid AttrMapping
```typescript
const attrMappings: AttrMapping[] = [
  { attrName: '', propName: 'test' } // Empty attrName!
];
```

**Proposed Handling:**
- Validate during conversion
- Skip invalid mappings
- Log warning

```typescript
function convertToAttrMappings(...): AttrMapping[] {
  const mappings: AttrMapping[] = [];
  
  for (const [attrName, coordinate] of Object.entries(attrCoordinateMap)) {
    if (!attrName) {
      console.warn('Skipping invalid attrMapping: empty attrName');
      continue;
    }
    
    const mapEntry = map[coordinate];
    if (!mapEntry?.mapsTo) {
      console.warn(`Skipping attrMapping: no mapsTo for ${attrName}`);
      continue;
    }
    
    mappings.push({ /* ... */ });
  }
  
  return mappings;
}
```

### 10. Type Mismatches
```typescript
// Attribute: data-count="5"
// Class property: count: string (expected number)
```

**Proposed Handling:**
- Trust the parser
- Document that parsers should match property types
- Consider TypeScript validation (future)

## Validation Utilities

### Validate IBaseRegistryItem
```typescript
export function validateRegistryItem(item: IBaseRegistryItem): string[] {
  const errors: string[] = [];
  
  if (!item.spawn) {
    errors.push('Missing spawn class');
  }
  
  if (item.enhKey && typeof item.enhKey !== 'string') {
    errors.push('enhKey must be a string');
  }
  
  if (item.attrMappings) {
    item.attrMappings.forEach((mapping, index) => {
      if (!mapping.attrName) {
        errors.push(`attrMappings[${index}]: missing attrName`);
      }
      if (!mapping.propName) {
        errors.push(`attrMappings[${index}]: missing propName`);
      }
    });
  }
  
  return errors;
}
```

### Validate MountInit
```typescript
export function validateMountInit(mountInit: MountInit): string[] {
  const errors: string[] = [];
  
  if (!mountInit.whereElementMatches) {
    errors.push('Missing whereElementMatches');
  }
  
  if (mountInit.spawn && !mountInit.enhKey) {
    errors.push('spawn requires enhKey');
  }
  
  // ... more validations
  
  return errors;
}
```

## Error Recovery Strategies

### Strategy 1: Graceful Degradation
- If attribute parsing fails, use default value
- If spawn fails, element remains unenhanced
- If lifecycle method fails, continue with other operations

### Strategy 2: Retry Logic
- For transient errors (network, timing), retry
- Exponential backoff for retries
- Max retry limit

### Strategy 3: Fallback Values
- Provide default values in class constructor
- Use `??` operator for null coalescing
- Document expected defaults

## Debug Mode

### Enable Detailed Logging
```typescript
export const DEBUG = {
  enabled: false,
  logAttrRead: false,
  logSpawn: false,
  logLifecycle: false,
  logErrors: true
};

// Usage
if (DEBUG.enabled && DEBUG.logAttrRead) {
  console.log('[assign-gingerly] Reading attributes:', attrMappings);
}
```

### Error Context
Include helpful context in errors:
```typescript
class EnhancementError extends Error {
  constructor(
    message: string,
    public context: {
      element?: Element;
      registryItem?: IBaseRegistryItem;
      mountInit?: MountInit;
      phase?: 'spawn' | 'lifecycle' | 'attribute';
    }
  ) {
    super(message);
    this.name = 'EnhancementError';
  }
}
```

## Testing Strategy

### Error Handling Tests
```typescript
describe('Error Handling', () => {
  it('should handle invalid attribute values gracefully', () => {
    // Test with invalid number
    // Test with invalid JSON
    // Test with missing attributes
  });
  
  it('should throw on missing spawn class', () => {
    expect(() => {
      element.enh.get({ spawn: undefined } as any);
    }).toThrow('missing spawn class');
  });
  
  it('should handle constructor errors', () => {
    // Test that error is caught and re-thrown with context
  });
  
  it('should handle lifecycle errors', () => {
    // Test that dispose errors don't prevent cleanup
  });
});
```

### Edge Case Tests
```typescript
describe('Edge Cases', () => {
  it('should handle disconnected elements', () => {
    // Test spawning on disconnected element
  });
  
  it('should handle attribute changes during spawn', () => {
    // Test race condition
  });
  
  it('should detect circular dependencies', () => {
    // Test circular spawn
  });
});
```

## Documentation

### Error Handling Guide
Document:
- Common errors and how to fix them
- How to enable debug mode
- How to write robust enhancement classes
- Best practices for error handling

### Troubleshooting Guide
- "Instance not spawning" → Check spawn class, enhKey
- "Attributes not reading" → Check attrMappings, attribute names
- "Parser errors" → Check attribute values, parser types
- "Lifecycle errors" → Check method names, signatures

## Benefits
- Robust system that handles real-world edge cases
- Helpful error messages for debugging
- Graceful degradation when things go wrong
- Clear documentation for troubleshooting

## Deliverables
1. Error handling implementation
2. Validation utilities
3. Debug mode implementation
4. Error handling tests
5. Edge case tests
6. Troubleshooting documentation

## Next Steps
After this, we should create a comprehensive test suite and prepare for a beta release to gather real-world feedback.
