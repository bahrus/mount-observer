# Integration Of WithAttrs

There was a previous attempt at adding specific help for attributes, but that was rolled back as it didn't make sense when considering how to work with initVals with assignGingerly.

Now that enhancementConfig has been added to MountConfig, please add the attributes specified in enhancementConfig.withAttrs to help create another AND condition for mounting.

But as with the previous implementation, any of attributes defined within withAttrs form a sufficient condition to mount (assuming other AND conditions hold).

## Understanding the Requirement

The requirement asks to add attribute-based matching as an **AND condition** for mounting, where:
- If `enhancementConfig.withAttrs` is specified, it becomes another condition that must be satisfied
- **Within** the `withAttrs` definition, any of the specified attributes forms a **sufficient condition** (OR logic)
- This means: element must have **at least one** of the attributes defined in `withAttrs` to mount

## Key Design Decisions

### 1. Attribute Name Construction

From the `AttrPatterns` type, attributes are constructed using:
- `base` prefix (required)
- Individual attribute keys

For example:
```typescript
withAttrs: {
  base: 'data-btn',
  theme: 'theme',
  size: 'size'
}
```
Would check for attributes: `data-btn-theme` or `data-btn-size`

### 2. Where to Add the Logic

Add the check in `#matchesSelector()` method, after existing AND conditions but before the final return.

### 3. Implementation Strategy

```typescript
// In #matchesSelector() method, add before "All conditions passed":

// Check withAttrs condition if specified (attribute-based matching)
if (this.#init.enhancementConfig?.withAttrs) {
    const withAttrs = this.#init.enhancementConfig.withAttrs;
    const base = withAttrs.base;
    
    // Collect all attribute patterns to check
    const attrPatterns: string[] = [];
    
    for (const key in withAttrs) {
        if (key === 'base' || key === '_base') continue;
        
        // Handle both string and AttrConfig formats
        const value = withAttrs[key];
        let attrName: string;
        
        if (typeof value === 'string') {
            // Simple string format: key maps to attribute suffix
            attrName = `${base}-${value}`;
        } else if (typeof value === 'object' && value !== null) {
            // AttrConfig format: use the key itself as suffix
            const configKey = key.startsWith('_') ? key.substring(1) : key;
            attrName = `${base}-${configKey}`;
        } else {
            continue;
        }
        
        attrPatterns.push(attrName);
    }
    
    // Element must have at least ONE of the specified attributes (OR logic)
    if (attrPatterns.length > 0) {
        const hasAnyAttribute = attrPatterns.some(attrName => 
            element.hasAttribute(attrName)
        );
        
        if (!hasAnyAttribute) {
            return false;
        }
    }
}

// All conditions passed
return true;
```

### Alternative Simpler Approach

Since we're only checking for attribute **presence** (not parsing values), we could simplify:

```typescript
// Check withAttrs condition if specified
if (this.#init.enhancementConfig?.withAttrs) {
    const { base, ...attrs } = this.#init.enhancementConfig.withAttrs;
    const attrKeys = Object.keys(attrs).filter(k => k !== '_base');
    
    if (attrKeys.length > 0) {
        // Element must have at least one attribute matching the pattern
        const hasAnyAttribute = attrKeys.some(key => {
            const suffix = typeof attrs[key] === 'string' ? attrs[key] : key.replace(/^_/, '');
            return element.hasAttribute(`${base}-${suffix}`);
        });
        
        if (!hasAnyAttribute) {
            return false;
        }
    }
}
```

## Test Scenarios

### Test 1: Element with matching attribute mounts
```javascript
const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        withAttrs: {
            base: 'data-btn',
            theme: 'theme'
        }
    }
});
// <button data-btn-theme="dark"> should mount
```

### Test 2: Element without any matching attribute doesn't mount
```javascript
// <button> (no data-btn-* attributes) should NOT mount
```

### Test 3: Element with any one of multiple attributes mounts (OR logic)
```javascript
enhancementConfig: {
    withAttrs: {
        base: 'data-field',
        required: 'required',
        disabled: 'disabled'
    }
}
// <input data-field-required> should mount
// <input data-field-disabled> should mount
// <input data-field-required data-field-disabled> should mount
// <input> should NOT mount
```

### Test 4: Works with other AND conditions
```javascript
{
    matching: 'input',
    withInstance: HTMLInputElement,
    enhancementConfig: {
        withAttrs: {
            base: 'data-field',
            required: 'required'
        }
    }
}
// Must match selector AND be HTMLInputElement AND have data-field-required
```

### Test 5: No withAttrs specified - no attribute checking
```javascript
{
    matching: 'button',
    enhancementConfig: {
        spawn: SomeClass
    }
}
// All buttons mount (no attribute requirement)
```

## Edge Cases to Handle

1. **Empty withAttrs object** (only `base` key): Should not add any attribute requirement
2. **Special keys** (`_base`): Should be ignored when building attribute list
3. **AttrConfig objects**: Extract the key name properly (strip leading underscore if present)
4. **No enhancementConfig**: Skip the check entirely
5. **enhancementConfig without withAttrs**: Skip the check

## Files to Modify

1. **MountObserver.ts**: Add attribute checking logic in `#matchesSelector()`
2. **MountObserver.js**: Compiled output
3. **tests/test-with-attrs.html**: New test file
4. **tests/test-with-attrs.spec.mjs**: New test spec

## Implementation Complexity

**Low to Medium** - The implementation is straightforward:
- Add one conditional block in `#matchesSelector()`
- Parse the `withAttrs` object to extract attribute names
- Check if element has at least one matching attribute
- No need to parse attribute values (that's for spawn/enhancement instantiation, not mounting)

## Questions to Resolve

1. **Should we handle `allowUnprefixed`?** The `EnhancementConfig` has an `allowUnprefixed` property - should we check unprefixed attributes too?
   - **Recommendation**: Ignore for now, can be added later if needed

2. **Case sensitivity?** Should attribute matching be case-sensitive or case-insensitive?
   - **Recommendation**: Case-sensitive (standard HTML behavior)

3. **Attribute value checking?** The requirement says "any of attributes defined within withAttrs form a sufficient condition" - does this mean just presence, or should we validate the attribute has a non-empty value?
   - **Recommendation**: Presence-only checking (simplest approach)  

