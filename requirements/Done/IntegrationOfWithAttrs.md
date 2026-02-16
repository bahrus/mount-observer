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

From the `AttrPatterns` type and `parseWithAttrs` implementation, attributes are constructed using **template strings** with variable substitution:

- `base` is a variable that can be referenced in other attribute patterns
- Attribute patterns use `${base}` or other `${variable}` placeholders
- Template strings are resolved recursively

For example:
```typescript
withAttrs: {
  base: 'data-',
  theme: '${base}theme',
  size: '${base}size'
}
```
Would check for attributes: `data-theme` or `data-size`

**Important**: The value of each key (like `theme`, `size`) is a **template string** that gets resolved, not just a suffix. So:
- `theme: '${base}theme'` → resolves to `data-theme`
- `theme: 'theme'` → resolves to literal `theme` (no prefix)
- `theme: 'my-theme'` → resolves to literal `my-theme`

**enh- Prefix Handling:**

The `parseWithAttrs` function also supports an `enh-` prefix for attribute isolation:

- **Built-in HTML elements**: `enh-` acts as an alias. Tries `enh-` prefixed first, falls back to unprefixed
  - `<div data-count="42">` → reads `data-count`
  - `<div enh-data-count="42">` → reads `enh-data-count`
  - `<div data-count="10" enh-data-count="42">` → reads `enh-data-count` (takes precedence)

- **Custom elements and SVG**: `enh-` prefix is **strictly enforced** by default
  - `<my-element data-count="42">` → ignored
  - `<my-element enh-data-count="42">` → reads `enh-data-count`
  - Can be overridden with `allowUnprefixed` pattern matching

**For mounting purposes**, we need to check if the element has **any** of the specified attributes (with proper `enh-` prefix handling).

### 2. Where to Add the Logic

Add the check in `#matchesSelector()` method, after existing AND conditions but before the final return.

### 3. Implementation Strategy

Since we need to check for attribute **presence** (not parse values), we need to:
1. Resolve template strings in `withAttrs` to get actual attribute names
2. Check if element has any of those attributes (considering `enh-` prefix rules)

**Helper function to resolve templates:**
```typescript
function resolveAttrTemplate(template: string, patterns: Record<string, any>): string {
    return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
        const value = patterns[varName];
        if (value === undefined) {
            throw new Error(`Undefined template variable: ${varName}`);
        }
        if (typeof value === 'string') {
            // Recursively resolve
            return resolveAttrTemplate(value, patterns);
        }
        return String(value);
    });
}
```

**Helper function to check attribute with enh- prefix:**
```typescript
function hasAttributeWithEnhPrefix(
    element: Element, 
    attrName: string, 
    allowUnprefixed?: string | RegExp
): boolean {
    const isCustomElement = element.tagName.includes('-');
    const isSVGElement = element instanceof SVGElement;
    
    // For custom elements and SVG - strict enh- requirement
    if (isCustomElement || isSVGElement) {
        if (element.hasAttribute(`enh-${attrName}`)) {
            return true;
        }
        
        // Only check unprefixed if tag name matches allowUnprefixed pattern
        if (allowUnprefixed) {
            const pattern = typeof allowUnprefixed === 'string' 
                ? new RegExp(allowUnprefixed) 
                : allowUnprefixed;
            const tagName = element.tagName.toLowerCase();
            if (pattern.test(tagName)) {
                return element.hasAttribute(attrName);
            }
        }
        return false;
    }
    
    // For built-in elements - enh- is alias (check both)
    return element.hasAttribute(`enh-${attrName}`) || element.hasAttribute(attrName);
}
```

**Main implementation in #matchesSelector():**
```typescript
// Check withAttrs condition if specified (attribute-based matching)
if (this.#init.enhancementConfig?.withAttrs) {
    const withAttrs = this.#init.enhancementConfig.withAttrs;
    const allowUnprefixed = this.#init.enhancementConfig.allowUnprefixed;
    
    // Collect all attribute names to check
    const attrNames: string[] = [];
    
    for (const key in withAttrs) {
        // Skip base and underscore-prefixed config keys
        if (key === 'base' || key.startsWith('_')) {
            continue;
        }
        
        const value = withAttrs[key];
        if (typeof value === 'string') {
            // Resolve template string to get actual attribute name
            const attrName = resolveAttrTemplate(value, withAttrs);
            attrNames.push(attrName);
        }
    }
    
    // Handle base attribute specially if present
    if ('base' in withAttrs && typeof withAttrs.base === 'string') {
        attrNames.push(withAttrs.base);
    }
    
    // Element must have at least ONE of the specified attributes (OR logic)
    if (attrNames.length > 0) {
        const hasAnyAttribute = attrNames.some(attrName => 
            hasAttributeWithEnhPrefix(element, attrName, allowUnprefixed)
        );
        
        if (!hasAnyAttribute) {
            return false;
        }
    }
}

// All conditions passed
return true;
```

## Test Scenarios

### Test 1: Element with matching attribute mounts
```javascript
const observer = new MountObserver({
    matching: 'button',
    enhancementConfig: {
        withAttrs: {
            base: 'data-',
            theme: '${base}theme'
        }
    }
});
// <button data-theme="dark"> should mount
// <button enh-data-theme="dark"> should also mount (enh- prefix)
```

### Test 2: Element without any matching attribute doesn't mount
```javascript
// <button> (no data-theme attribute) should NOT mount
```

### Test 3: Element with any one of multiple attributes mounts (OR logic)
```javascript
enhancementConfig: {
    withAttrs: {
        base: 'data-',
        required: '${base}required',
        disabled: '${base}disabled'
    }
}
// <input data-required> should mount
// <input data-disabled> should mount
// <input data-required data-disabled> should mount
// <input> should NOT mount
```

### Test 4: Works with other AND conditions
```javascript
{
    matching: 'input',
    withInstance: HTMLInputElement,
    enhancementConfig: {
        withAttrs: {
            base: 'data-',
            required: '${base}required'
        }
    }
}
// Must match selector AND be HTMLInputElement AND have data-required
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

### Test 6: Custom element with enh- prefix (strict enforcement)
```javascript
enhancementConfig: {
    withAttrs: {
        base: 'data-',
        theme: '${base}theme'
    }
}
// <my-element data-theme="dark"> should NOT mount (custom element, no enh- prefix)
// <my-element enh-data-theme="dark"> should mount
```

### Test 7: Custom element with allowUnprefixed pattern
```javascript
enhancementConfig: {
    allowUnprefixed: '^my-',
    withAttrs: {
        base: 'data-',
        theme: '${base}theme'
    }
}
// <my-element data-theme="dark"> should mount (matches pattern)
// <other-element data-theme="dark"> should NOT mount (doesn't match pattern)
// <my-element enh-data-theme="dark"> should mount (enh- always works)
```

### Test 8: Base attribute checking
```javascript
enhancementConfig: {
    withAttrs: {
        base: 'data-config',
        theme: '${base}-theme'
    }
}
// <div data-config="{}"> should mount (base attribute present)
// <div data-config-theme="dark"> should mount (theme attribute present)
// <div> should NOT mount (no attributes)
```

## Edge Cases to Handle

1. **Empty withAttrs object** (only `base` key): Should check for the base attribute itself
2. **Special keys** (`_base`, `_theme`, etc.): Should be ignored when building attribute list (they're config objects)
3. **Template resolution**: Must handle `${variable}` placeholders correctly, including recursive resolution
4. **enh- prefix for custom elements**: Must check `enh-` prefixed attributes for custom elements and SVG
5. **allowUnprefixed pattern**: Must respect pattern matching for custom elements when specified
6. **No enhancementConfig**: Skip the check entirely
7. **enhancementConfig without withAttrs**: Skip the check
8. **Built-in vs custom elements**: Different `enh-` prefix behavior

## Files to Modify

1. **MountObserver.ts**: Add attribute checking logic in `#matchesSelector()`
2. **MountObserver.js**: Compiled output
3. **tests/test-with-attrs.html**: New test file
4. **tests/test-with-attrs.spec.mjs**: New test spec

## Implementation Complexity

**Medium** - The implementation requires:
- Template string resolution with recursive variable substitution
- enh- prefix handling with different behavior for built-in vs custom elements
- allowUnprefixed pattern matching for custom elements
- Proper handling of config keys (underscore-prefixed)
- Integration with existing AND condition logic in `#matchesSelector()`

## Questions to Resolve

1. **Should we handle `allowUnprefixed`?** The `EnhancementConfig` has an `allowUnprefixed` property for custom elements
   - **Recommendation**: Yes, implement it - it's part of the standard `withAttrs` behavior

2. **Case sensitivity?** Should attribute matching be case-sensitive or case-insensitive?
   - **Recommendation**: Case-sensitive (standard HTML behavior, `hasAttribute()` is case-sensitive)

3. **Attribute value checking?** Should we validate the attribute has a non-empty value?
   - **Recommendation**: Presence-only checking - just check if attribute exists, not its value

4. **Template resolution complexity?** Should we implement full recursive template resolution or simplified version?
   - **Recommendation**: Implement proper template resolution to match `parseWithAttrs` behavior - it's needed for correct attribute name construction

5. **Should we extract helper functions to separate file?** The template resolution and enh- prefix logic could be reusable
   - **Recommendation**: Keep inline for now, can refactor later if needed elsewhere  

