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

**Important**: The base attribute is optional when branch attributes are present. An element can match with:
- Just the base attribute (if `''` is in `hasBranchIn`)
- Just branch attributes without the base attribute
- Both base and branch attributes together

**Empty String Meaning**: The empty string `''` in `hasBranchIn` indicates that the base attribute alone (without any branch attributes) is a valid match.

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
<!-- Base only (no branch attributes) -->
<input my-greetings>

<!-- Base + hello branch -->
<input my-greetings my-greetings-hello>

<!-- Just hello branch (no base attribute) -->
<input my-greetings-hello>

<!-- Base + hello + sub-branch -->
<input my-greetings my-greetings-hello-how-are-you>

<!-- Just nested branch (no base attribute) -->
<input my-greetings-hello-how-are-you>

<!-- Base + goodbye branch -->
<input my-greetings my-greetings-goodbye>

<!-- Just goodbye + sub-branch (no base attribute) -->
<input my-greetings-goodbye-last-words>
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
<!-- All base and branch attributes present -->
<your-custom-element 
    enh-my-greetings="courtesy of hallmark" 
    enh-my-greetings-hello="select from gloomy section"
    enh-my-greetings-hello-how-are-you="one day closer to death"
    enh-my-greetings-goodbye="select from funny section"
    enh-my-greetings-goodbye-last-words="smell you later"
>
</your-custom-element>

<!-- Just nested branch attribute (no base) - also valid -->
<your-custom-element 
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

### map Configuration

The optional `map` property provides metadata for each attribute coordinate in the `whereAttr` hierarchy. This metadata is passed along with `attrchange` events.

#### Structure

```javascript
{
    whereAttr: {
        hasBase: 'my-greetings',
        hasBranchIn: [
            '',
            { 'hello': ['', 'how-are-you'] },
            { 'goodbye': [''] }
        ]
    },
    map: {
        '0': { instanceOf: 'Object', mapsTo: '.' },
        '1': { instanceOf: 'Boolean', mapsTo: 'isHello' },
        '1.1': { instanceOf: 'String', mapsTo: 'firstHelloGreeting' },
        '2': { instanceOf: 'Boolean', mapsTo: 'isGoodbye' }
    }
}
```

#### Coordinate System

Coordinates use a zero-based decimal notation:
- `'0'` or `'0.0'` - Base attribute (first item in `hasBranchIn`)
- `'1'` - First branch object
- `'1.1'` - First sub-branch within first branch
- `'2.2.1'` - Third branch, third sub-branch, second sub-sub-branch

The trailing `.0` is optional and assumed if not present.

#### MapEntry Properties

Each map entry can contain:
- `instanceOf?: string` - Type hint for the attribute value
- `mapsTo?: string` - Property name to map to
- `once?: boolean` - Only fire `attrchange` event once for this attribute
- Any custom properties you need

#### The "once" Feature

When `once: true` is set for an attribute coordinate, the `attrchange` event will only fire the first time that attribute is detected on an element. Subsequent changes, removals, or re-additions of that attribute on the same element will be ignored.

**Use case**: Initialization scenarios where you only care about the initial presence of an attribute.

**Example**:
```javascript
map: {
    '0': {
        instanceOf: 'Object',
        mapsTo: '.',
        once: true  // Only fire event on first detection
    }
}
```

**Behavior with `once: true`**:
- Initial mount with attribute present → Event fires ✓
- Attribute value changes → No event
- Attribute removed → No event
- Attribute re-added → No event

The "once" tracking is per-element, per-attribute. Different elements can each have their own "first time" event for the same attribute.

## Events

### attrchange Event

Fires when attributes matching the `whereAttr` configuration are added, changed, or removed on mounted elements.

**When it fires**:
- Immediately on mount if matching attributes are present
- When any matching attribute value changes
- When any matching attribute is added or removed

**Event properties**:
- `changes: AttrChange[]` - Array of attribute changes

**AttrChange object**:
```typescript
{
    value: string | null,        // Current value (null if removed)
    attrNode: Attr | null,       // Attribute node (null if removed)
    mapEntry: MapEntry | null,   // Corresponding map entry (null if no map)
    attrName: string,            // Full attribute name
    coordinate: string,          // Coordinate (e.g., '0', '1.1', '2.2.1')
    element: Element             // The element whose attribute changed
}
```

**Event batching**: Multiple simultaneous attribute changes result in a single event with all changes in the array.

## Future Considerations

In upcoming requirements, when elements mount due to attribute matching, the system will need to dispatch events when:
- Any of the matching attributes are removed
- Any of the matching attributes change value

This will enable reactive behavior based on attribute changes.
