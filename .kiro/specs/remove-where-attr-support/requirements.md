# Requirements Document

## Introduction

This specification defines the complete removal of the `whereAttr` feature from the mount-observer library. The `whereAttr` feature enables attribute-based element matching with complex hierarchical configuration, including support for custom delimiters, branch attributes, and attribute change events. Due to fundamental changes in the underlying assign-gingerly.js library, this feature must be completely removed from the codebase.

The removal affects type definitions, source code, utility modules, event classes, test files, and documentation.

## Glossary

- **MountObserver**: The main class that observes DOM elements and triggers mount/dismount lifecycle events
- **whereAttr**: A configuration property in MountConfig that enables attribute-based element matching
- **AttrChange**: A type representing a change to an attribute on a mounted element
- **AttrChangeEvent**: An event class dispatched when attributes matching whereAttr configuration change
- **MountConfig**: The configuration object passed to MountObserver constructor
- **Utility_Module**: A TypeScript/JavaScript module providing helper functions (e.g., attrChanges.ts, attrCoordinates.ts, whereAttr.ts)
- **Type_Definition**: TypeScript interface or type alias defined in types.d.ts
- **Test_Spec**: A Playwright test file with .spec.mjs extension

## Requirements

### Requirement 1: Remove Type Definitions

**User Story:** As a developer, I want whereAttr-related types removed from the codebase, so that the type system reflects the current API surface.

#### Acceptance Criteria

1. THE System SHALL remove the `whereAttr` property from the `MountConfig` interface
2. THE System SHALL remove the `WhereAttr` interface definition
3. THE System SHALL remove the `BranchValue` type definition
4. THE System SHALL remove the `AttrChange` interface definition
5. THE System SHALL remove the `IAttrChangeEvent` interface definition
6. THE System SHALL remove the `MapConfig` interface definition
7. THE System SHALL remove the `MapEntry` interface definition
8. THE System SHALL remove the `map` property from the `MountConfig` interface

### Requirement 2: Remove Event Classes

**User Story:** As a developer, I want the AttrChangeEvent class removed, so that the event system only includes supported events.

#### Acceptance Criteria

1. THE System SHALL remove the `AttrChangeEvent` class from Events.ts
2. THE System SHALL remove the `attrchangeEventName` constant from Events.ts
3. THE System SHALL remove the import of `IAttrChangeEvent` and `AttrChange` types from Events.ts

### Requirement 3: Remove Utility Modules

**User Story:** As a developer, I want whereAttr utility modules removed, so that the codebase contains no orphaned code.

#### Acceptance Criteria

1. THE System SHALL delete the attrChanges.ts file
2. THE System SHALL delete the attrChanges.js file
3. THE System SHALL delete the attrCoordinates.ts file
4. THE System SHALL delete the attrCoordinates.js file
5. THE System SHALL delete the whereAttr.ts file
6. THE System SHALL delete the whereAttr.js file

### Requirement 4: Remove MountObserver Implementation

**User Story:** As a developer, I want whereAttr-related code removed from MountObserver, so that the implementation is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL remove the `#matchesWhereAttrFn` private field from MountObserver class
2. THE System SHALL remove the `#buildAttrCoordinateMapFn` private field from MountObserver class
3. THE System SHALL remove the `#checkAttrChangesFn` private field from MountObserver class
4. THE System SHALL remove the `#elementAttrStates` private field from MountObserver class
5. THE System SHALL remove the `#elementOnceAttrs` private field from MountObserver class
6. THE System SHALL remove the `#preloadWhereAttrUtilities` method from MountObserver class
7. WHEN checking if an element should mount, THE System SHALL remove the whereAttr condition check
8. WHEN observing mutations, THE System SHALL remove attribute observation configuration related to whereAttr
9. WHEN an element mounts, THE System SHALL remove the initial attribute change check
10. THE System SHALL remove all imports related to whereAttr utilities from MountObserver.ts

### Requirement 5: Remove Test Files

**User Story:** As a developer, I want whereAttr test files removed, so that the test suite only includes tests for supported features.

#### Acceptance Criteria

1. THE System SHALL delete the test-where-attr.spec.mjs file
2. THE System SHALL delete the test-where-attr.html file
3. WHEN other test files reference whereAttr, THE System SHALL remove or update those references

### Requirement 6: Update Documentation

**User Story:** As a user, I want documentation updated to remove whereAttr references, so that I understand the current API.

#### Acceptance Criteria

1. THE System SHALL remove all whereAttr documentation from README.md
2. THE System SHALL remove all AttrChange documentation from README.md
3. THE System SHALL remove all attrchange event documentation from README.md
4. THE System SHALL remove all map configuration documentation from README.md
5. WHEN documentation examples use whereAttr, THE System SHALL remove those examples

### Requirement 7: Ensure Compilation

**User Story:** As a developer, I want the codebase to compile successfully after removal, so that I can continue development.

#### Acceptance Criteria

1. WHEN running `tsc`, THE System SHALL compile without errors
2. WHEN running `tsc`, THE System SHALL produce valid JavaScript output files
3. THE System SHALL ensure no remaining references to removed types or functions

### Requirement 8: Ensure Test Suite Passes

**User Story:** As a developer, I want remaining tests to pass after removal, so that I know existing functionality still works.

#### Acceptance Criteria

1. WHEN running `npm test`, THE System SHALL execute all remaining tests
2. WHEN running `npm test`, THE System SHALL report no test failures
3. THE System SHALL ensure no tests depend on removed whereAttr functionality
