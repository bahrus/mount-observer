# Roadmap: Moving Attribute Logic to assign-gingerly

This roadmap outlines the step-by-step process for moving attribute parsing and initial reading logic from mount-observer down to assign-gingerly, creating a more cohesive architecture that aligns with the [WICG proposal](https://github.com/WICG/webcomponents/issues/1000).

## Overview

The goal is to enable assign-gingerly to read initial attribute values when spawning class instances, while mount-observer continues to handle ongoing attribute observation. This creates a clean separation:

- **assign-gingerly**: Initial handshake with server-rendered HTML attributes
- **mount-observer**: Ongoing reactive observation of attribute changes

## Phase 1: Foundation (Requirements 1-2)

### Requirement 1: Add Attribute Mapping Interface
- Add `AttrMapping` interface to assign-gingerly
- Extend `IBaseRegistryItem` with optional `attrMappings` field
- No implementation, just type definitions
- **Estimated effort**: 2-4 hours

### Requirement 2: Implement Initial Attribute Reading
- Create `readInitialAttributes()` helper function
- Modify `ElementEnhancementContainer.get()` to read and merge attribute values
- Merge strategy: attributes first, then `enh` values override
- **Estimated effort**: 4-6 hours
- **Dependencies**: Requirement 1

## Phase 2: Bridge Layer (Requirement 3-4)

### Requirement 3: Create Conversion Utility
- Build `convertToAttrMappings()` in mount-observer
- Reuse existing `buildAttrCoordinateMap()` logic
- Create `createParserFromMapEntry()` for type conversion
- **Estimated effort**: 6-8 hours
- **Dependencies**: Requirements 1-2

### Requirement 4: Update mount-observer Observation
- Add metadata tracking for initial attribute processing
- Modify `checkAttrChanges()` to skip initial read
- Ensure MutationObserver only handles subsequent changes
- **Estimated effort**: 4-6 hours
- **Dependencies**: Requirements 1-3

## Phase 3: Integration (Requirements 5-6)

### Requirement 5: Add spawn Support to MountInit
- Extend `MountInit` interface with `spawn`, `enhKey`, `lifecycleKeys`
- Create `mountInitToRegistryItem()` conversion function
- Update mount logic to use spawn when specified
- Handle precedence: spawn first, then `do` callbacks
- **Estimated effort**: 6-8 hours
- **Dependencies**: Requirements 1-4

### Requirement 6: Formalize Type Relationship
- Make `MountInit` extend `IBaseRegistryItem`
- Resolve `map` property conflict (use `diMap` for DI)
- Update type definitions across both packages
- **Estimated effort**: 4-6 hours
- **Dependencies**: Requirements 1-5

## Phase 4: Optimization (Requirements 7-9)

### Requirement 7: Shared Parsing Logic
- Create `attrParsers.ts` in assign-gingerly
- Implement standard parsers (string, number, boolean, json, array, object)
- Update both packages to use shared parsers
- **Estimated effort**: 4-6 hours
- **Dependencies**: Requirements 1-6

### Requirement 8: Documentation and Examples
- Create end-to-end examples (counter, reactive, hybrid, DI)
- Write architecture documentation
- Create migration guide
- Build integration test suite
- **Estimated effort**: 12-16 hours
- **Dependencies**: Requirements 1-7

### Requirement 9: Performance Optimization
- Implement caching for conversions
- Pre-resolve parser functions
- Batch attribute reads
- Create benchmark suite
- Profile and optimize hot paths
- **Estimated effort**: 8-12 hours
- **Dependencies**: Requirements 1-8

## Phase 5: Hardening (Requirement 10)

### Requirement 10: Error Handling and Edge Cases
- Implement graceful error handling for parsers
- Add validation utilities
- Handle edge cases (circular deps, timing issues)
- Create debug mode
- Write comprehensive error tests
- **Estimated effort**: 8-12 hours
- **Dependencies**: Requirements 1-9

## Total Estimated Effort

- **Minimum**: 58 hours (~1.5 weeks full-time)
- **Maximum**: 84 hours (~2 weeks full-time)
- **Realistic**: 70 hours with testing and iteration

## Milestones

### Milestone 1: Basic Functionality (Requirements 1-4)
- assign-gingerly can read initial attributes
- mount-observer doesn't duplicate initial read
- Basic integration working
- **Target**: End of Week 1

### Milestone 2: Full Integration (Requirements 5-6)
- MountInit supports spawn
- Type system reflects architecture
- Complete feature parity
- **Target**: Mid Week 2

### Milestone 3: Production Ready (Requirements 7-10)
- Optimized and documented
- Comprehensive tests
- Error handling
- Ready for beta release
- **Target**: End of Week 2

## Success Criteria

1. **Functionality**: All existing tests pass, new features work
2. **Performance**: < 10% slower than separate implementations
3. **Documentation**: Complete examples and migration guide
4. **Type Safety**: No TypeScript errors, proper type inference
5. **Error Handling**: Graceful degradation, helpful error messages
6. **Testing**: > 90% code coverage, all edge cases covered

## Risks and Mitigation

### Risk 1: Breaking Changes
- **Mitigation**: Maintain backward compatibility, provide migration path
- **Strategy**: Make all new features optional, deprecate gradually

### Risk 2: Performance Regression
- **Mitigation**: Benchmark early and often, optimize hot paths
- **Strategy**: Implement caching, lazy evaluation, batch operations

### Risk 3: Complexity
- **Mitigation**: Keep APIs simple, hide complexity in implementation
- **Strategy**: Good documentation, clear examples, gradual adoption

### Risk 4: Type System Conflicts
- **Mitigation**: Careful interface design, use discriminated unions
- **Strategy**: Resolve conflicts early (like `map` property)

## Dependencies

### External Dependencies
- TypeScript 4.5+ (for template literal types)
- Modern browsers with WeakMap, Proxy support
- MutationObserver API

### Internal Dependencies
- assign-gingerly must be updated first (lower level)
- mount-observer depends on assign-gingerly changes
- mount-observer-script-element depends on both

## Testing Strategy

### Unit Tests
- Test each requirement in isolation
- Mock dependencies
- Cover edge cases

### Integration Tests
- Test complete flow from HTML to spawned instance
- Test interaction between packages
- Test real-world scenarios

### Performance Tests
- Benchmark each phase
- Compare to baseline
- Regression testing

### Manual Testing
- Test in real applications
- Test with various frameworks
- Test browser compatibility

## Rollout Plan

### Phase 1: Internal Testing
- Implement Requirements 1-6
- Test in controlled environment
- Gather internal feedback

### Phase 2: Beta Release
- Implement Requirements 7-10
- Release as beta version
- Gather community feedback
- Iterate based on feedback

### Phase 3: Stable Release
- Address all feedback
- Complete documentation
- Release as stable version
- Update proposal documentation

## Future Considerations

### Beyond This Roadmap
- TypeScript decorators for attribute mapping
- Automatic type inference from attributes
- DevTools integration for debugging
- Performance monitoring tools
- Additional standard parsers
- Schema validation for attributes

### Potential Extensions
- Support for custom attribute namespaces
- Attribute value transformers (not just parsers)
- Bidirectional attribute binding
- Attribute change batching
- Virtual attribute support

## Questions for Discussion

1. Should we support nested property paths in `propName` (e.g., "style.color")?
2. Should we have built-in parsers for dates, URLs, etc.?
3. How should we handle attribute name conflicts?
4. Should we support attribute value validation/schemas?
5. What's the migration path for existing mount-observer users?
6. Should we deprecate any existing APIs?
7. How do we handle versioning across the three packages?

## Next Steps

1. Review this roadmap with stakeholders
2. Prioritize requirements based on feedback
3. Set up project tracking (GitHub issues/project board)
4. Begin implementation with Requirement 1
5. Iterate based on testing and feedback

---

**Note**: This is a living document. Update as requirements change or new insights emerge during implementation.
