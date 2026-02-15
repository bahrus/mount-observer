# Design Document: Remove whereAttr Support

## Overview

This design outlines the complete removal of the `whereAttr` feature from the mount-observer library. The whereAttr feature enables attribute-based element matching with complex hierarchical configuration, but must be removed due to fundamental changes in the underlying assign-gingerly.js library.

The removal involves:
- Type definitions in types.d.ts
- Event classes in Events.ts
- Three utility modules (attrChanges.ts, attrCoordinates.ts, whereAttr.ts)
- Implementation code in MountObserver.ts
- Test files (test-where-attr.spec.mjs and test-where-attr.html)
- Documentation in README.md

## Architecture

The whereAttr feature is integrated into multiple layers of the mount-observer architecture:

1. **Type Layer**: Defines interfaces and types for whereAttr configuration
2. **Event Layer**: Provides AttrChangeEvent for attribute change notifications
3. **Utility Layer**: Three modules handle attribute matching, coordinate mapping, and change detection
4. **Core Layer**: MountObserver class integrates whereAttr into element matching and observation
5. **Test Layer**: Dedicated test suite validates whereAttr functionality
6. **Documentation Layer**: README.md documents the whereAttr API

The removal strategy is to work from the bottom up: remove utility modules first, then update the core implementation, then remove types and events, and finally update tests and documentation.

## Components and Interfaces

### 1. Type Definitions (types.d.ts)

**Types to Remove**:
- `WhereAttr` interface - Defines the whereAttr configuration structure
- `BranchValue` type - Recursive type for hierarchical attribute branches
- `AttrChange` interface - Represents an attribute change
- `IAttrChangeEvent` interface - Interface for AttrChangeEvent
- `MapConfig` interface - Maps attribute coordinates to metadata
- `MapEntry` interface - Metadata for a single attribute coordinate

**Properties to Remove from MountConfig**:
- `whereAttr?: WhereAttr` - The whereAttr configuration
- `map?: MapConfig` - Metadata mapping for attributes

### 2. Event Classes (Events.ts)

**Event Class to Remove**:
- `AttrChangeEvent` class - Dispatched when attributes change on mounted elements

**Constant to Remove**:
- `attrchangeEventName` constant - The event name string 'attrchange'

**Imports to Remove**:
- `IAttrChangeEvent` from types.js
- `AttrChange` from types.js

### 3. Utility Modules

**Files to Delete**:
- `attrChanges.ts` and `attrChanges.js` - Detects attribute changes on mounted elements
- `attrCoordinates.ts` and `attrCoordinates.js` - Builds attribute-to-coordinate mappings
- `whereAttr.ts` and `whereAttr.js` - Matches elements against whereAttr configuration

### 4. MountObserver Implementation (MountObserver.ts)

**Private Fields to Remove**:
- `#matchesWhereAttrFn` - Cached function for matching whereAttr
- `#buildAttrCoordinateMapFn` - Cached function for building coordinate maps
- `#checkAttrChangesFn` - Cached function for checking attribute changes
- `#elementAttrStates` - WeakMap tracking attribute state per element
- `#elementOnceAttrs` - WeakMap tracking "once" attributes per element

**Methods to Remove**:
- `#preloadWhereAttrUtilities()` - Dynamically loads whereAttr utility modules

**Code Sections to Remove**:
- Constructor: whereAttr preloading logic
- `observe()`: whereAttr utility loading and attribute observation configuration
- `#matchesSelector()`: whereAttr condition check
- `#handleMatch()`: Initial attribute change check
- Mutation callback: Attribute change handling and event dispatching

**Imports to Remove**:
- `AttrChange` from types.js
- `AttrChangeEvent` from Events.js

### 5. Test Files

**Files to Delete**:
- `tests/test-where-attr.spec.mjs` - Playwright test spec for whereAttr
- `tests/test-where-attr.html` - HTML test page for whereAttr

**Other Test Files**:
- Search for and remove any whereAttr references in other test files

### 6. Documentation (README.md)

**Sections to Remove**:
- All whereAttr configuration documentation
- All AttrChange interface documentation
- All attrchange event documentation
- All map configuration documentation
- Examples using whereAttr

## Data Models

No new data models are introduced. The following data models are removed:

**WhereAttr Configuration**:
```typescript
interface WhereAttr {
    hasBuiltInRootIn?: string[];
    hasCERootIn?: string[];
    hasBase: string;
    hasBranchIn?: BranchValue[];
}
```

**AttrChange Data**:
```typescript
interface AttrChange {
    value: string | null;
    attrNode: Attr | null;
    mapEntry: MapEntry | null;
    attrName: string;
    coordinate: string;
    element: Element;
}
```

**Map Configuration**:
```typescript
interface MapConfig {
    [coordinate: string]: MapEntry;
}

interface MapEntry {
    instanceOf?: string;
    mapsTo?: string;
    once?: boolean;
    [key: string]: any;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified that all criteria are verification tasks (checking that code/files have been removed). These are all "example" tests rather than properties, as they verify specific concrete outcomes rather than universal rules across all inputs.

Since this is a deletion/refactoring task, there are no universal properties to test. All verification is done through:
- Checking specific files exist or don't exist
- Checking specific code is present or absent
- Running compilation and tests to verify correctness

Therefore, no property-based tests are needed for this feature. All verification will be done through:
1. Manual code inspection
2. TypeScript compilation (`tsc`)
3. Running the existing test suite (`npm test`)
4. Searching for remaining references to removed code

### Correctness Properties

This feature involves code deletion and refactoring rather than implementing new behavior. As such, there are no universal properties that apply across all inputs. Instead, correctness is verified through:

1. **Compilation Success**: The codebase compiles without TypeScript errors after removal
2. **Test Suite Success**: All remaining tests pass after removal
3. **No Dangling References**: No code references the removed types, functions, or modules

These are concrete verification steps rather than properties that hold for all inputs.

## Error Handling

This is a code removal task with no new error handling requirements. The removal should not introduce new error conditions.

**Potential Issues**:
- If any code outside the identified scope depends on whereAttr, compilation will fail
- If tests depend on whereAttr functionality, they will fail

**Mitigation**:
- Run TypeScript compilation after each major removal step
- Run the test suite after removal to catch any missed dependencies
- Search the codebase for remaining references to removed identifiers

## Testing Strategy

Since this is a code removal task, testing focuses on verification rather than property-based testing.

### Verification Steps

1. **File Deletion Verification**:
   - Verify attrChanges.ts and attrChanges.js are deleted
   - Verify attrCoordinates.ts and attrCoordinates.js are deleted
   - Verify whereAttr.ts and whereAttr.js are deleted
   - Verify test-where-attr.spec.mjs is deleted
   - Verify test-where-attr.html is deleted

2. **Type Definition Verification**:
   - Verify types.d.ts no longer contains: WhereAttr, BranchValue, AttrChange, IAttrChangeEvent, MapConfig, MapEntry
   - Verify MountConfig interface no longer has whereAttr or map properties

3. **Event Class Verification**:
   - Verify Events.ts no longer exports AttrChangeEvent
   - Verify Events.ts no longer exports attrchangeEventName
   - Verify Events.ts no longer imports IAttrChangeEvent or AttrChange

4. **MountObserver Verification**:
   - Verify MountObserver.ts no longer has whereAttr-related private fields
   - Verify MountObserver.ts no longer has #preloadWhereAttrUtilities method
   - Verify #matchesSelector no longer checks whereAttr condition
   - Verify observe() no longer configures attribute observation for whereAttr
   - Verify #handleMatch no longer checks for initial attribute changes
   - Verify mutation callback no longer handles attribute changes
   - Verify MountObserver.ts no longer imports AttrChange or AttrChangeEvent

5. **Documentation Verification**:
   - Verify README.md no longer contains whereAttr documentation
   - Verify README.md no longer contains AttrChange documentation
   - Verify README.md no longer contains attrchange event documentation
   - Verify README.md no longer contains map configuration documentation

6. **Compilation Verification**:
   - Run `tsc` and verify it completes without errors
   - Verify all .ts files produce corresponding .js files

7. **Test Suite Verification**:
   - Run `npm test` and verify all tests pass
   - Verify no tests reference whereAttr functionality

8. **Reference Search**:
   - Search codebase for "whereAttr" and verify no remaining references
   - Search codebase for "AttrChange" and verify no remaining references
   - Search codebase for "attrchange" and verify no remaining references (except in comments explaining removal)

### Manual Testing

After removal, manually verify:
- The library still observes and mounts elements based on CSS selectors
- Other MountConfig properties (withInstance, withMediaMatching, withScopePerimeter) still work
- Mount and dismount events still fire correctly
- The library compiles and runs without errors

### No Property-Based Tests

This feature does not require property-based tests because:
- It's a deletion task, not implementing new behavior
- Verification is concrete (files exist/don't exist, code present/absent)
- Success is measured by compilation and existing test suite passing

All verification is done through unit tests (checking specific files and code) and integration tests (running the full test suite).
