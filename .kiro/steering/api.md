---
inclusion: always
---

# MountObserver API Documentation

## MountInit Configuration

The `MountInit` object configures what elements the MountObserver should observe and act upon.

### Condition Logic

**AND Conditions**: All `where*` properties in the `MountInit` object form an AND condition. An element must satisfy ALL specified `where*` conditions to mount.

For example:
```javascript
{
    whereElementMatches: 'input, button',
    whereAttr: { hasBase: 'my-enhancement' }
}
```
This will only match elements that are BOTH (`input` or `button`) AND have the `my-enhancement` attribute.

### whereAttr Configuration

The `whereAttr` property enables attribute-based element matching with support for:
- Built-in element vs custom element distinction
- Attribute prefix variations (data-, enh-, data-enh-)
- Hierarchical attribute branches with customizable delimiters

#### Basic Structure

```javascript
{
    whereAttr: {
        hasBuiltInRootIn: ['', 'data', 'enh', 'data-enh'],
        hasCERootIn: ['', 'data', 'enh', 'data-enh'],
        hasBase: 'my-enhancement',
        hasBranchIn: [/* branch definitions */]
    }
}
```

#### hasBuiltInRootIn vs hasCERootIn

These properties define which attribute prefixes are valid for built-in elements vs custom elements.

**Built-in Elements** (input, div, button, etc.):
```html
<input my-greetings>                    <!-- matches if '' in hasBuiltInRootIn -->
<input data-my-greetings>               <!-- matches if 'data' in hasBuiltInRootIn -->
<input enh-my-greetings>                <!-- matches if 'enh' in hasBuiltInRootIn -->
<input data-enh-my-greetings>           <!-- matches if 'data-enh' in hasBuiltInRootIn -->
```

**Custom Elements** (elements with hyphen in tag name):
```html
<!-- Does NOT match even if '' in hasCERootIn -->
<my-custom-element my-greetings></my-custom-element>

<!-- Matches if 'data' in hasCERootIn -->
<my-custom-element data-my-greetings></my-custom-element>

<!-- Matches if 'enh' in hasCERootIn -->
<my-custom-element enh-my-greetings></my-custom-element>

<!-- Matches if 'data-enh' in hasCERootIn -->
<my-custom-element data-enh-my-greetings></my-custom-element>
```

**Rationale**: Custom elements should avoid unprefixed attributes to prevent naming conflicts with future standard attributes.

#### hasBase

The base attribute name (without prefix). This is the core identifier for the enhancement.

```javascript
hasBase: 'my-enhancement'
```

Matches: `my-enhancement`, `data-my-enhancement`, `enh-my-enhancement`, etc. (based on root settings)

#### hasBranchIn - Hierarchical Attributes

The `hasBranchIn` property defines optional hierarchical attribute branches. Each valid combination forms an OR condition within the `whereAttr` context.

**Empty String Meaning**: The empty string `''` indicates that branch is optional (not required for a match).

**Basic Example**:
```javascript
hasBranchIn: [
    '',  // Base attribute alone is valid
    {
        'hello': ['', 'how-are-you', 'hows-it-going']
    },
    {
        'goodbye': ['', 'last-words']
    }
]
```

This matches:
```html
<!-- Base only -->
<input my-greetings>

<!-- Base + hello branch -->
<input my-greetings my-greetings-hello>

<!-- Base + hello + sub-branch -->
<input my-greetings my-greetings-hello-how-are-you>

<!-- Base + goodbye branch -->
<input my-greetings my-greetings-goodbye>

<!-- Base + goodbye + sub-branch -->
<input my-greetings my-greetings-goodbye-last-words>
```

**Nested Branches**:
```javascript
hasBranchIn: [
    '',
    {
        'goodbye': ['', 'last-words', { 'ps': ['', 'pps'] }]
    }
]
```

This enables deeply nested attributes:
```html
<input my-greetings-goodbye-ps>
<input my-greetings-goodbye-ps-pps>
```

**Complete Example**:
```html
<your-custom-element 
    enh-my-greetings="courtesy of hallmark" 
    enh-my-greetings-hello="select from gloomy section"
    enh-my-greetings-hello-how-are-you="one day closer to death"
    enh-my-greetings-goodbye="select from funny section"
    enh-my-greetings-goodbye-last-words="smell you later"
>
</your-custom-element>
```

#### Custom Delimiters

By default, branches are separated by `-` (hyphen). You can customize delimiters using bracket notation `[delimiter]` before the key name.

**Syntax**: `[delimiter]keyName`

**Example**:
```javascript
{
    whereAttr: {
        hasBuiltInRootIn: ['', 'data', 'enh', 'data-enh'],
        hasCERootIn: ['', 'data', 'enh', 'data-enh'],
        hasBase: '[_]my-enhancement',  // Use underscore after prefix
        hasBranchIn: [
            '',
            {
                '[:]hello': ['', '[--]how-are-you', '[--]hows-it-going']
            },
            {
                '[--]goodbye': ['', '[---]last-words', { '[----]ps': ['', 'pps'] }]
            }
        ]
    }
}
```

This matches:
```html
<your-custom-element 
    enh_my-greetings="courtesy of hallmark" 
    enh_my-greetings:hello="select from gloomy section"
    enh_my-greetings:hello--how-are-you="one day closer to death"
    enh_my-greetings--goodbye="select from funny section"
    enh_my-greetings--goodbye---last-words="smell you later"
    enh_my-greetings--goodbye----ps-pps="bon voyage"
>
</your-custom-element>
```

**Delimiter Inheritance**: Each level can specify its own delimiter. If not specified, the default `-` is used.

#### OR Logic Within whereAttr

Within the `whereAttr` configuration, each valid combination of the `has*` values forms a valid OR condition:

- Any valid root prefix (from `hasBuiltInRootIn` or `hasCERootIn`)
- Combined with the base attribute
- Combined with any valid branch path (from `hasBranchIn`)

All these combinations are ORed together to determine if an element matches.

## Future Considerations

In upcoming requirements, when elements mount due to attribute matching, the system will need to dispatch events when:
- Any of the matching attributes are removed
- Any of the matching attributes change value

This will enable reactive behavior based on attribute changes.
