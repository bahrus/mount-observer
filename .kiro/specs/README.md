# Scoped Parser Registry Specification

This folder contains the specification documents for the scoped parser registry feature.

## Document Structure

### Repository-Specific Documents

- **`scoped-parser-registry-design.md`** - Focused design document highlighting changes specific to mount-observer
  - New `EMCParserScript` handler for `<script type="emc-parser">`
  - Modified `EMCScript` handler with parser waiting logic
  - Synthesizer element discovery from script element
  - Error handling and timeout configuration

### Complete Cross-Repository Documents

- **`scoped-parser-registry-design-full.md`** - Complete design document covering both assign-gingerly and mount-observer
- **`scoped-parser-registry-requirements.md`** - Complete requirements document with all 15 requirements

## Quick Reference

**For mount-observer implementation**, start with:
1. `scoped-parser-registry-design.md` (focused on this repo)
2. Reference `scoped-parser-registry-design-full.md` for complete context

**For understanding assign-gingerly integration**, see:
- `assign-gingerly/.kiro/specs/scoped-parser-registry-design.md`

## Key Concepts

### Context Threading
The EMCScript handler finds the synthesizer element by traversing up from the **script element** (not the enhanced element):

```
<be-hive>
  <script type="emc" src="..."></script>  ← Script IS inside be-hive
</be-hive>

<div>
  <template be-switched="..."></template>  ← Enhanced element NOT inside be-hive
</div>
```

The script element IS a DOM descendant of be-hive, so we can use `closest('be-hive')`.

### New Script Types

**`<script type="emc-parser">`** - Loads parser modules:
```html
<script type="emc-parser" 
        src="nested-regex-groups/parser.js" 
        parser-name="nestedRegexGroups"></script>
```

**`<script type="emc" wait-for-parsers="...">`** - Waits for parsers:
```html
<script type="emc" 
        src="be-switched/emc.json" 
        wait-for-parsers="nestedRegexGroups"></script>
```

### Synthesizer Syndication

When EMC scripts are syndicated to shadow roots:
- Scripts are physically copied into shadow root's be-hive
- Each shadow root's be-hive has its own scoped parser registry
- Proper isolation is maintained between shadow roots

## Implementation Phases

1. **Phase 1**: Core registry infrastructure (assign-gingerly)
2. **Phase 2**: EMC parser loading (mount-observer) ← **This repo**
3. **Phase 3**: EMC parser waiting (mount-observer) ← **This repo**
4. **Phase 4**: Enhancement integration (both)
5. **Phase 5**: Documentation and examples (both)
