# Implementation Ready - Scoped Parser Registry

## Documentation Status ✓

All specification documents have been created and distributed to both repositories:

### Workspace Root (`.kiro/specs/scoped-parser-registry/`)
- ✓ `requirements.md` - Complete requirements (15 requirements)
- ✓ `design.md` - Complete design document
- ✓ `ProblemsWithTheDesign.md` - Problem identification
- ✓ `DesignFix.md` - Solution explanation

### assign-gingerly Repository (`.kiro/specs/`)
- ✓ `scoped-parser-registry-design.md` - **Focused design for assign-gingerly**
- ✓ `scoped-parser-registry-design-full.md` - Complete design (copy)
- ✓ `scoped-parser-registry-requirements.md` - Complete requirements (copy)
- ✓ `README.md` - Documentation guide

### mount-observer Repository (`.kiro/specs/`)
- ✓ `scoped-parser-registry-design.md` - **Focused design for mount-observer**
- ✓ `scoped-parser-registry-design-full.md` - Complete design (copy)
- ✓ `scoped-parser-registry-requirements.md` - Complete requirements (copy)
- ✓ `README.md` - Documentation guide

## Implementation Order

### Phase 1: assign-gingerly (Core Infrastructure)
**Start here** - These changes are foundational

1. Create `ScopedParserRegistry.ts`
2. Add public API functions to `parserRegistry.ts`
3. Modify `parseWithAttrs()` - add `synthesizerElement` parameter
4. Modify `resolveParser()` - add scoped registry lookup, remove tuple syntax
5. Extend `SpawnContext` interface
6. Write unit tests

**Reference**: `assign-gingerly/.kiro/specs/scoped-parser-registry-design.md`

### Phase 2: mount-observer (Parser Loading)
**Depends on**: Phase 1 complete

1. Create `EMCParserScriptHandler.ts`
2. Implement parser module loading
3. Add synthesizer element discovery
4. Register handler with MountObserver
5. Write integration tests

**Reference**: `mount-observer/.kiro/specs/scoped-parser-registry-design.md`

### Phase 3: mount-observer (Parser Waiting)
**Depends on**: Phase 2 complete

1. Modify `EMCScript` handler
2. Add `wait-for-parsers` attribute handling
3. Implement parser waiting with timeout
4. Store synthesizer element in enhancement config
5. Write integration tests

**Reference**: `mount-observer/.kiro/specs/scoped-parser-registry-design.md`

### Phase 4: Enhancement Integration (Both)
**Depends on**: Phases 1-3 complete

1. Update enhancement constructors to use `ctx.synthesizerElement`
2. Test end-to-end flows
3. Verify shadow root syndication works correctly

### Phase 5: Documentation (Both)
**Depends on**: Phases 1-4 complete

1. Update README files
2. Create examples
3. Write migration guide for tuple syntax removal

## Key Design Decisions

### ✓ Context Threading Solution
**Problem**: Enhanced elements are not DOM descendants of synthesizer elements

**Solution**: EMCScript handler finds synthesizer element from script element (which IS a descendant), stores reference in enhancement config, passes through SpawnContext

### ✓ Framework Agnostic
Uses `synthesizerElement` (not `beHiveElement`) to work with any Synthesizer-based container (be-hive, htmx-container, alpine-scope, etc.)

### ✓ Backward Compatible
- Inline parser functions continue to work
- Global registry preserved for built-in parsers
- `parseWithAttrs()` without `synthesizerElement` parameter falls back to global registry

### ✓ Breaking Change
Tuple syntax `['element-name', 'methodName']` is removed - migration path provided

## Testing Strategy

### Unit Tests (assign-gingerly)
- ScopedParserRegistry class
- resolveParser() function
- parseWithAttrs() function
- Public API functions

### Integration Tests (mount-observer + assign-gingerly)
- Declarative parser loading
- Programmatic parser registration
- Parser waiting with timeout
- Shadow root syndication
- Multiple synthesizer isolation
- Global registry fallback

## Ready to Implement

All design documents are in place and distributed to both repositories. Each repository has:
1. A focused design document highlighting its specific changes
2. Complete design and requirements documents for full context
3. A README explaining the documentation structure

**Next Step**: Begin Phase 1 implementation in assign-gingerly repository.
