# Requirements Document

## Introduction

This specification defines the requirements for implementing the `configFrom` property in the mount-observer library. The `configFrom` property provides a cleaner, more maintainable alternative to the existing `reference` property for importing MountConfig settings from external modules. Instead of using numeric indices that depend on import array ordering, developers can directly specify module paths that export a `mountConfig` constant. This feature supports composition through multiple config imports with clear merge semantics, while preventing circular dependencies and duplicate imports.

## Glossary

- **MountObserver**: The main class that observes DOM elements matching CSS selectors and executes lifecycle callbacks
- **MountConfig**: The configuration object passed to MountObserver constructor that specifies what elements to observe and how to handle them
- **configFrom**: A new MountConfig property that specifies one or more module paths to import configuration from
- **reference**: The existing MountConfig property that uses numeric indices to reference imported modules (to be deprecated)
- **mountConfig**: The required named export from modules referenced by configFrom
- **Type_Definition_File**: The TypeScript type definition file at types/mount-observer/types.d.ts
- **Constructor**: The MountObserver class constructor method
- **Merge_Semantics**: The rules for combining multiple config objects (shallow merge, inline takes precedence)
- **Circular_Dependency**: A situation where module A imports module B which imports module A, creating an infinite loop
- **Test_Suite**: The collection of Playwright test files in the tests/ directory

## Requirements

### Requirement 1: Add configFrom Property to MountConfig Interface

**User Story:** As a library user, I want to specify configuration modules using the `configFrom` property, so that I can compose configurations from external modules without using numeric indices.

#### Acceptance Criteria

1. THE Type_Definition_File SHALL add the property `configFrom?: string | string[];` to the MountConfig interface
2. THE configFrom_Property SHALL accept a single string module path
3. THE configFrom_Property SHALL accept an array of string module paths
4. WHEN TypeScript compilation runs, THE Compiler SHALL recognize configFrom as a valid MountConfig property
5. THE configFrom_Property SHALL be optional (not required)

### Requirement 2: Load and Validate configFrom Modules

**User Story:** As a library user, I want the MountObserver to automatically load modules specified in `configFrom`, so that I don't have to manually import and merge configurations.

#### Acceptance Criteria

1. THE Constructor SHALL detect when configFrom is specified in the MountConfig
2. WHEN configFrom is a string, THE System SHALL import that single module
3. WHEN configFrom is an array, THE System SHALL import all modules in the array in order
4. THE System SHALL use dynamic import() to load each module
5. WHEN a module fails to load, THE System SHALL throw an error with the module path
6. THE System SHALL load configFrom modules before processing other MountConfig properties
7. WHEN configFrom modules are loading, THE observe() method SHALL wait for loading to complete

### Requirement 3: Validate mountConfig Export

**User Story:** As a library user, I want clear error messages when my config module doesn't export `mountConfig`, so that I can quickly fix configuration issues.

#### Acceptance Criteria

1. THE System SHALL check each loaded module for a named export called `mountConfig`
2. WHEN a module does not export `mountConfig`, THE System SHALL throw an error stating: "Module '{path}' does not export 'mountConfig'"
3. WHEN a module exports `mountConfig` but it is undefined, THE System SHALL throw an error
4. WHEN a module exports `mountConfig` but it is not an object, THE System SHALL throw an error
5. THE Error_Message SHALL include the module path for debugging

### Requirement 4: Prevent Duplicate Module Imports

**User Story:** As a library user, I want the system to prevent me from importing the same config module twice, so that I avoid unintended configuration duplication.

#### Acceptance Criteria

1. WHEN configFrom is an array, THE System SHALL check for duplicate module paths
2. WHEN duplicate paths are detected, THE System SHALL throw an error stating: "Duplicate configFrom module: '{path}'"
3. THE Duplicate_Check SHALL be case-sensitive
4. THE Duplicate_Check SHALL compare exact string values (no path normalization)
5. THE Duplicate_Check SHALL occur before any modules are loaded

### Requirement 5: Merge Configuration with Shallow Object.assign

**User Story:** As a library user, I want imported configurations to be merged using shallow merge semantics, so that I can predictably compose configurations.

#### Acceptance Criteria

1. THE System SHALL use Object.assign() to merge configurations
2. WHEN multiple configFrom modules are specified, THE System SHALL merge them left-to-right (later overrides earlier)
3. WHEN inline MountConfig properties are specified, THE Inline_Config SHALL override all imported configs
4. THE Merge_Process SHALL be shallow (nested objects are replaced, not deep merged)
5. WHEN an array property exists in multiple configs, THE Later_Array SHALL completely replace the earlier array
6. THE Merge_Order SHALL be: first configFrom module → second configFrom module → ... → inline config

### Requirement 6: Handle All MountConfig Properties

**User Story:** As a library user, I want to import any valid MountConfig property from external modules, so that I can fully externalize my configuration.

#### Acceptance Criteria

1. THE imported mountConfig SHALL support the `matching` property
2. THE imported mountConfig SHALL support the `whereInstanceOf` property
3. THE imported mountConfig SHALL support the `withMediaMatching` property
4. THE imported mountConfig SHALL support the `whereObservedRootSizeMatches` property
5. THE imported mountConfig SHALL support the `whereElementIntersectsWith` property
6. THE imported mountConfig SHALL support the `whereConnectionHas` property
7. THE imported mountConfig SHALL support the `import` property
8. THE imported mountConfig SHALL support the `do` property (functions, strings, or arrays)
9. THE imported mountConfig SHALL support the `assignOnMount` property
10. THE imported mountConfig SHALL support the `assignOnDismount` property
11. THE imported mountConfig SHALL support the `stageOnMount` property
12. THE imported mountConfig SHALL support the `customData` property
13. THE imported mountConfig SHALL support the `loadingEagerness` property
14. THE imported mountConfig SHALL support the `getPlayByPlay` property
15. THE imported mountConfig SHALL support the `mountedElemEmits` property

### Requirement 7: Prevent Circular Dependencies

**User Story:** As a library user, I want to be warned about circular dependencies in my config modules, so that I can avoid infinite loops and stack overflow errors.

#### Acceptance Criteria

1. THE Documentation SHALL warn developers about circular dependency risks
2. THE Documentation SHALL recommend that config modules only export configuration (no side effects)
3. THE Documentation SHALL provide an example of a safe config module structure
4. WHEN a circular dependency occurs, THE System SHALL allow the JavaScript engine to handle it naturally (may throw or hang)
5. THE System SHALL NOT implement circular dependency detection (too complex for initial version)

### Requirement 8: Remove reference Property

**User Story:** As a library maintainer, I want to remove the `reference` property entirely, so that the codebase only has one way to import configuration from modules.

#### Acceptance Criteria

1. THE Type_Definition_File SHALL remove the `reference?: number | number[];` property from MountConfig interface
2. THE MountObserver_Class SHALL remove the #validateReference() method
3. THE Constructor SHALL NOT validate or process the reference property
4. THE #matchesSelector_Method SHALL NOT check referenced whereInstanceOf from imported modules
5. THE #handleMatch_Method SHALL NOT call referenced do functions from imported modules
6. THE Documentation SHALL remove all sections describing the reference property
7. THE Documentation SHALL remove the "How the reference property works" section
8. THE Documentation SHALL remove the "Interaction with the reference property" section
9. THE Test_Suite SHALL remove all test files that test the reference property functionality
10. WHEN TypeScript compilation runs, THE Compiler SHALL produce errors if any code tries to use the reference property

### Requirement 9: Update Documentation

**User Story:** As a library user, I want comprehensive documentation for the `configFrom` property, so that I understand how to use it effectively.

#### Acceptance Criteria

1. THE Documentation SHALL add a new section titled "Importing Configuration with configFrom"
2. THE Documentation SHALL show an example of a single configFrom module
3. THE Documentation SHALL show an example of multiple configFrom modules
4. THE Documentation SHALL explain the merge order (left-to-right, inline wins)
5. THE Documentation SHALL show an example config module file structure
6. THE Documentation SHALL explain the mountConfig export requirement
7. THE Documentation SHALL warn about circular dependencies
8. THE Documentation SHALL remove all sections describing the reference property (since it's being removed)

### Requirement 10: Create Comprehensive Tests

**User Story:** As a library maintainer, I want comprehensive tests for the `configFrom` feature, so that I can ensure it works correctly and prevent regressions.

#### Acceptance Criteria

1. THE Test_Suite SHALL include test-config-from-single.html and test-config-from-single.spec.mjs
2. THE Test_Suite SHALL include test-config-from-multiple.html and test-config-from-multiple.spec.mjs
3. THE Test_Suite SHALL include test-config-from-merge.html and test-config-from-merge.spec.mjs
4. THE Test_Suite SHALL include test-config-from-errors.html and test-config-from-errors.spec.mjs
5. THE Single_Module_Test SHALL verify loading a single config module
6. THE Multiple_Module_Test SHALL verify loading multiple config modules in order
7. THE Merge_Test SHALL verify that later configs override earlier configs
8. THE Merge_Test SHALL verify that inline config overrides imported configs
9. THE Error_Test SHALL verify error when module doesn't export mountConfig
10. THE Error_Test SHALL verify error when duplicate modules are specified
11. THE Test_Suite SHALL verify that do functions from imported configs execute correctly
12. THE Test_Suite SHALL verify that whereInstanceOf from imported configs works correctly
13. WHEN all tests run, THE Test_Suite SHALL pass without errors

### Requirement 11: Support Function and Class References in Imported Configs

**User Story:** As a library user, I want to import configs that contain `do` functions and `whereInstanceOf` class references, so that I can fully externalize non-JSON-serializable configuration.

#### Acceptance Criteria

1. THE imported mountConfig SHALL support do property with function values
2. THE imported mountConfig SHALL support do property with array values containing functions
3. THE imported mountConfig SHALL support whereInstanceOf property with constructor references
4. THE imported mountConfig SHALL support whereInstanceOf property with arrays of constructor references
5. WHEN a do function is imported, THE Function SHALL execute when elements mount
6. WHEN whereInstanceOf is imported, THE Class_Check SHALL filter elements correctly
7. THE System SHALL preserve function and class references during merge (no serialization)

### Requirement 12: Implement in MountObserver Constructor

**User Story:** As a library maintainer, I want the configFrom loading logic in the constructor, so that configuration is resolved before observation begins.

#### Acceptance Criteria

1. THE Constructor SHALL add a private method #loadConfigFrom()
2. THE #loadConfigFrom_Method SHALL be async
3. THE #loadConfigFrom_Method SHALL return Promise<MountConfig>
4. THE #loadConfigFrom_Method SHALL handle string and array inputs
5. THE #loadConfigFrom_Method SHALL perform duplicate checking
6. THE #loadConfigFrom_Method SHALL load all modules using dynamic import()
7. THE #loadConfigFrom_Method SHALL validate mountConfig exports
8. THE #loadConfigFrom_Method SHALL merge configs using Object.assign()
9. THE Constructor SHALL call #loadConfigFrom() before storing the final config
10. THE Constructor SHALL await #loadConfigFrom() completion

### Requirement 13: Handle Async Constructor Pattern

**User Story:** As a library user, I want the MountObserver constructor to handle async config loading transparently, so that I don't need to change how I create observers.

#### Acceptance Criteria

1. THE Constructor SHALL remain synchronous (no async constructor)
2. THE Constructor SHALL store a Promise for the loaded config
3. THE observe_Method SHALL await the config loading Promise before observing
4. WHEN observe() is called before config loading completes, THE Method SHALL wait
5. WHEN observe() is called after config loading completes, THE Method SHALL proceed immediately
6. WHEN config loading fails, THE observe_Method SHALL throw the error
7. THE disconnect_Method SHALL work correctly even if observe() was never called

### Requirement 14: Maintain Backward Compatibility (Except reference)

**User Story:** As a library user, I want my existing code without `configFrom` or `reference` to continue working, so that the removal of `reference` doesn't break unrelated functionality.

#### Acceptance Criteria

1. WHEN configFrom is not specified, THE System SHALL behave exactly as before (except for reference removal)
2. THE MountObserver_Class SHALL continue to support all existing MountConfig properties except reference
3. WHEN existing tests that don't use reference run, THE Tests SHALL pass without modification
4. THE System SHALL NOT break any existing functionality except reference-related features

### Requirement 15: Clean Compilation

**User Story:** As a library maintainer, I want the TypeScript code to compile without errors after adding configFrom, so that the library can be built and published.

#### Acceptance Criteria

1. WHEN `tsc` runs with the project tsconfig.json, THE Compilation SHALL complete without errors
2. WHEN `tsc` runs with the project tsconfig.json, THE Compilation SHALL complete without warnings
3. THE Compiled_JavaScript_Files SHALL be generated for all TypeScript source files
4. WHEN the compiled code runs, THE Runtime SHALL NOT throw errors related to configFrom handling
5. THE Type_Definitions SHALL correctly reflect the new configFrom property

## Non-Functional Requirements

### Performance

1. THE configFrom_Loading SHALL not significantly impact MountObserver construction time
2. THE Duplicate_Check SHALL use a Set for O(n) performance
3. THE Module_Loading SHALL use Promise.all() for parallel loading when possible

### Error Messages

1. ALL error messages SHALL include relevant context (module paths, property names)
2. ALL error messages SHALL be clear and actionable
3. ALL error messages SHALL follow the existing error message style in the library

### Code Quality

1. THE Implementation SHALL follow the existing code style in MountObserver.ts
2. THE Implementation SHALL use private methods with # prefix
3. THE Implementation SHALL include JSDoc comments for new methods
4. THE Implementation SHALL handle edge cases (empty arrays, null values, etc.)

## Out of Scope

The following items are explicitly out of scope for this specification:

1. Deep merging of nested configuration objects (use shallow Object.assign only)
2. Circular dependency detection and prevention
3. Path normalization or resolution (use exact string matching)
4. Caching of loaded config modules across MountObserver instances
5. Support for importing configs from non-ES module formats (CommonJS, AMD, etc.)
6. Support for named exports other than `mountConfig` (e.g., `export const mobile = {...}`)
