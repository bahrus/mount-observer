# Implementation Plan: Remove whereAttr Support

## Overview

This plan outlines the step-by-step removal of the whereAttr feature from the mount-observer library. The approach is to work from the bottom up: delete utility modules first, update the core implementation, remove types and events, update tests, and finally update documentation. Each step includes verification to ensure the codebase remains in a working state.

## Tasks

- [x] 1. Delete whereAttr utility modules
  - Delete attrChanges.ts and attrChanges.js files
  - Delete attrCoordinates.ts and attrCoordinates.js files
  - Delete whereAttr.ts and whereAttr.js files
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2. Remove whereAttr implementation from MountObserver.ts
  - [x] 2.1 Remove whereAttr-related imports
    - Remove `AttrChange` import from types.js
    - Remove `AttrChangeEvent` import from Events.js
    - _Requirements: 4.10_
  
  - [x] 2.2 Remove whereAttr-related private fields
    - Remove `#matchesWhereAttrFn` field
    - Remove `#buildAttrCoordinateMapFn` field
    - Remove `#checkAttrChangesFn` field
    - Remove `#elementAttrStates` field
    - Remove `#elementOnceAttrs` field
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.3 Remove #preloadWhereAttrUtilities method
    - Delete the entire method implementation
    - _Requirements: 4.6_
  
  - [x] 2.4 Remove whereAttr preloading from constructor
    - Remove the conditional check and call to #preloadWhereAttrUtilities
    - Remove whereAttr destructuring from init parameter
    - _Requirements: 4.10_
  
  - [x] 2.5 Remove whereAttr utility loading from observe() method
    - Remove the conditional check and await for #preloadWhereAttrUtilities
    - _Requirements: 4.10_
  
  - [x] 2.6 Remove whereAttr condition check from #matchesSelector method
    - Remove the entire whereAttr conditional block
    - _Requirements: 4.7_
  
  - [x] 2.7 Remove attribute observation configuration from observe() method
    - Remove the conditional that adds attributes: true to observerConfig
    - _Requirements: 4.8_
  
  - [x] 2.8 Remove attribute change handling from mutation callback
    - Remove the attribute change detection and event dispatching code
    - Remove the attrChanges array and related logic
    - _Requirements: 4.8_
  
  - [x] 2.9 Remove initial attribute change check from #handleMatch method
    - Remove the conditional check for #checkAttrChangesFn
    - Remove the AttrChangeEvent dispatching for initial changes
    - _Requirements: 4.9_

- [x] 3. Remove whereAttr types from types.d.ts
  - [x] 3.1 Remove whereAttr-related interfaces and types
    - Remove `WhereAttr` interface
    - Remove `BranchValue` type
    - Remove `AttrChange` interface
    - Remove `IAttrChangeEvent` interface
    - Remove `MapConfig` interface
    - Remove `MapEntry` interface
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 3.2 Remove whereAttr properties from MountInit interface
    - Remove `whereAttr?: WhereAttr` property
    - Remove `map?: MapConfig` property
    - _Requirements: 1.1, 1.8_

- [x] 4. Remove AttrChangeEvent from Events.ts
  - [x] 4.1 Remove AttrChangeEvent-related imports
    - Remove `IAttrChangeEvent` import from types.js
    - Remove `AttrChange` import from types.js
    - _Requirements: 2.3_
  
  - [x] 4.2 Remove AttrChangeEvent class and constant
    - Remove `attrchangeEventName` constant
    - Remove `AttrChangeEvent` class definition
    - _Requirements: 2.1, 2.2_

- [x] 5. Verify compilation
  - Run `tsc` to compile TypeScript
  - Verify no compilation errors
  - Verify all .ts files produce corresponding .js files
  - _Requirements: 7.1, 7.2_

- [x] 6. Delete whereAttr test files
  - Delete tests/test-where-attr.spec.mjs
  - Delete tests/test-where-attr.html
  - _Requirements: 5.1, 5.2_

- [x] 7. Search for and remove remaining whereAttr references
  - Search codebase for "whereAttr" and remove any remaining references
  - Search codebase for "AttrChange" and remove any remaining references
  - Search codebase for "attrchange" and remove any remaining references
  - Update any other test files that reference whereAttr
  - _Requirements: 5.3, 7.3, 8.3_

- [x] 8. Update README.md documentation
  - Remove all whereAttr configuration documentation
  - Remove all AttrChange interface documentation
  - Remove all attrchange event documentation
  - Remove all map configuration documentation
  - Remove examples that use whereAttr
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Final verification
  - Run `tsc` to ensure compilation succeeds
  - Run `npm test` to ensure all remaining tests pass
  - Verify no dangling references to removed code
  - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

## Notes

- This is a pure deletion task with no new functionality
- Each step should be followed by compilation to catch any missed dependencies
- The test suite should pass after all removals are complete
- Manual testing should verify that other MountInit properties (whereInstanceOf, whereMediaMatches, whereOutside) still work correctly
