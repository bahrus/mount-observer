# Requirement 7: Optimize Attribute Parsing with Shared Logic

## Goal
Extract common attribute parsing logic into a shared utility that both assign-gingerly and mount-observer can use, reducing code duplication and ensuring consistent behavior.

## Background
After implementing Requirements 1-6, we have attribute parsing logic in multiple places:
- assign-gingerly: `readInitialAttributes()` with parser functions
- mount-observer: `createParserFromMapEntry()` for MapConfig
- mount-observer: Attribute coordinate building in `attrCoordinates.ts`

We should consolidate the parsing logic to ensure consistency and maintainability.

## Proposed Shared Utility

### New Package or Shared Module?
Since assign-gingerly is the lower-level dependency, we have two options:

Option A: Add to assign-gingerly (recommended)
- Create `assign-gingerly/attrParsers.ts`
- mount-observer imports from assign-gingerly
- Keeps parsing logic with the initial read logic

Option B: Separate package
- Create `@assign-gingerly/attr-utils` or similar
- Both packages depend on it
- More modular but adds dependency complexity

### Recommendation: Option A

## Implementation

### Create assign-gingerly/attrParsers.ts
```typescript
/**
 * Standard attribute value parsers
 */
export const AttrParsers = {
  /**
   * Parse as string (identity function)
   */
  string: (value: string | null): string | null => value,
  
  /**
   * Parse as number
   */
  number: (value: string | null): number | null => {
    if (value === null) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  
  /**
   * Parse as boolean (presence-based)
   * Attribute present = true, absent = false
   */
  boolean: (value: string | null): boolean => value !== null,
  
  /**
   * Parse as boolean (value-based)
   * "true" = true, "false" = false, absent = null
   */
  booleanStrict: (value: string | null): boolean | null => {
    if (value === null) return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  },
  
  /**
   * Parse as JSON
   */
  json: (value: string | null): any => {
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value; // Fallback to string
    }
  },
  
  /**
   * Parse as array (JSON or comma-separated)
   */
  array: (value: string | null): any[] | null => {
    if (value === null) return null;
    
    // Try JSON first
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        // Fall through to comma-separated
      }
    }
    
    // Comma-separated fallback
    return value.split(',').map(s => s.trim());
  },
  
  /**
   * Parse as object (JSON)
   */
  object: (value: string | null): Record<string, any> | null => {
    if (value === null) return null;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};

/**
 * Type for parser functions
 */
export type AttrParser = (value: string | null) => any;

/**
 * Get a parser by name or instanceOf hint
 */
export function getParserByType(type: string): AttrParser {
  switch (type) {
    case 'String':
      return AttrParsers.string;
    case 'Number':
      return AttrParsers.number;
    case 'Boolean':
      return AttrParsers.boolean;
    case 'Array':
      return AttrParsers.array;
    case 'Object':
      return AttrParsers.object;
    default:
      return AttrParsers.string; // Default to string
  }
}
```

### Update AttrMapping Interface
```typescript
export interface AttrMapping {
  attrName: string;
  propName: string;
  
  // Can now be a named parser or custom function
  parser?: AttrParser | keyof typeof AttrParsers;
  
  initialOnly?: boolean;
}
```

### Update readInitialAttributes
```typescript
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
    
    if (attrValue !== null || mapping.parser === AttrParsers.boolean) {
      // Resolve parser
      let parser: AttrParser;
      if (typeof mapping.parser === 'string') {
        parser = AttrParsers[mapping.parser] || AttrParsers.string;
      } else if (typeof mapping.parser === 'function') {
        parser = mapping.parser;
      } else {
        parser = AttrParsers.string;
      }
      
      result[mapping.propName] = parser(attrValue);
    }
  }
  
  return result;
}
```

### Update mount-observer's createParserFromMapEntry
```typescript
import { getParserByType, AttrParsers } from 'assign-gingerly/attrParsers.js';

function createParserFromMapEntry(mapEntry: MapEntry): AttrParser {
  if (mapEntry.instanceOf) {
    return getParserByType(mapEntry.instanceOf);
  }
  
  // Check for custom parser in mapEntry
  if (mapEntry.parser && typeof mapEntry.parser === 'function') {
    return mapEntry.parser;
  }
  
  return AttrParsers.string;
}
```

## Benefits
- Single source of truth for attribute parsing
- Consistent behavior across both packages
- Easy to add new parser types
- Users can reference standard parsers by name
- Reduces code duplication

## Usage Examples

### In assign-gingerly
```typescript
const registryItem: IBaseRegistryItem = {
  spawn: MyClass,
  enhKey: 'myEnhancement',
  attrMappings: [
    { attrName: 'data-count', propName: 'count', parser: 'number' },
    { attrName: 'data-enabled', propName: 'enabled', parser: 'boolean' },
    { attrName: 'data-config', propName: 'config', parser: 'json' }
  ]
};
```

### In mount-observer
```typescript
const mountInit: MountInit = {
  whereElementMatches: 'button',
  whereAttr: { hasBuiltInRootIn: ['data'], hasBase: 'count' },
  map: {
    '0': {
      mapsTo: 'count',
      instanceOf: 'Number' // Automatically uses AttrParsers.number
    }
  },
  spawn: MyButtonClass,
  enhKey: 'button'
};
```

## Testing Considerations
- Test all standard parsers with various inputs
- Test edge cases (null, empty string, invalid JSON)
- Test custom parser functions
- Test parser resolution by name
- Test backward compatibility with existing code

## Documentation Needs
- Document all standard parsers and their behavior
- Provide examples of custom parsers
- Explain when to use each parser type
- Document the parser resolution logic

## Next Steps
After this, we should create end-to-end examples demonstrating the complete flow from HTML attributes to spawned class instances.
