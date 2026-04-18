# Design Fix: Synthesizer Element Context

## Problem Identified

The original design stated that the synthesizer element would be found by "traversing up the DOM tree from the enhanced element." This was incorrect because:

1. **Outside Shadow DOM**: The be-hive is a sibling (not ancestor) of enhanced elements
2. **Inside Shadow DOM**: The be-hive is in the shadow root, but enhanced elements may be anywhere in the shadow DOM

The enhanced element and the be-hive are NOT in an ancestor-descendant relationship.

## Solution

Instead of DOM traversal from the enhanced element, we use **context passing through the enhancement configuration**:

### Key Insight

The **EMC script element** IS a descendant of the be-hive element. So we:

1. **EMCScript handler** finds the containing be-hive by traversing up from the **script element** (not the enhanced element)
2. Store the be-hive reference in the enhancement configuration
3. Pass it through the SpawnContext to the enhancement constructor
4. Enhancement constructor passes it to parseWithAttrs

### Flow

```
EMCScript.handleMount(scriptElement)
  ↓
  scriptElement.closest('be-hive')  // Script IS inside be-hive
  ↓
  Store in enhancement config
  ↓
  When element matches enhancement:
    ↓
    element.enh.get(enhancementConfig)
    ↓
    SpawnClass constructor(element, ctx, initVals)
    ↓
    ctx.synthesizerElement = the be-hive from config
    ↓
    parseWithAttrs(element, attrPatterns, allowUnprefixed, ctx.synthesizerElement)
    ↓
    resolveParser(parserSpec, ctx.synthesizerElement)
    ↓
    scopedRegistry.get(parserName)
```

### Why This Works

**Outside Shadow DOM:**
```html
<div>
    <input id=lhs>
    <template be-switched='...'>  <!-- Enhanced element -->
</div>
<be-hive>
    <script type=emc src=be-switched/emc.json></script>  <!-- Script IS inside be-hive -->
</be-hive>
```

**Inside Shadow DOM:**
```html
<my-custom-element>
    #shadowRoot
        <div>
            <input id=lhs>
            <template be-switched='...'>  <!-- Enhanced element -->
        </div>
        <be-hive>
            <script type=emc src=be-switched/emc.json></script>  <!-- Script IS inside be-hive -->
        </be-hive>
</my-custom-element>
```

In both cases:
- The script element is physically inside the be-hive (can use `closest()`)
- The enhanced element is NOT inside the be-hive (can't use `closest()`)
- But the enhancement config connects them via the stored reference

### Synthesizer Syndication

When EMC scripts are syndicated to shadow roots:
- The Synthesizer copies the script element into the shadow root's be-hive
- The copied script IS inside the shadow root's be-hive
- Each shadow root's be-hive gets its own parser registry
- Proper scoping is maintained

## Changes Made to Design Document

1. Updated "Critical Design Challenge" section to explain the problem and solution
2. Removed `findContainingSynthesizer()` helper function (no longer needed)
3. Added `SpawnContext` interface extension with `synthesizerElement` property
4. Updated EMCScript handler behavior to find and store synthesizer element
5. Updated implementation phases to reflect context passing approach
6. Added explanation of how Synthesizer pattern syndication works with scoped registries

## Result

The design now correctly handles the relationship between:
- Enhanced elements (anywhere in the DOM)
- Be-hive elements (containing EMC scripts)
- Parser registries (scoped to be-hive elements)

The synthesizer element reference flows through the enhancement configuration and spawn context, not through DOM traversal.
