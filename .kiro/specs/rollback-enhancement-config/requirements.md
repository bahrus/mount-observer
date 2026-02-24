# Requirements Document

## Introduction

This specification defines the requirements for removing the `enhancementConfig` feature from the mount-observer library. The `enhancementConfig` property was added to the `MountConfig` interface to support enhancement-based element configuration, but this feature needs to be completely removed from the codebase. This includes removing the property from type definitions, removing all implementation code that processes enhancement configs, removing array argument support from the MountObserver constructor, and removing all related tests and documentation.

## Glossary

- **MountObserver**: The main class that observes DOM elements matching CSS selectors and executes lifecycle callbacks
- **MountConfig**: The configuration object passed to MountObserver constructor that specifies what elements to observe and how to handle them
- **EnhancementConfig**: A configuration object type from the assign-gingerly library that was previously supported in MountConfig
- **Type_Definition_File**: The TypeScript type definition file at types/mount-observer/types.d.ts
- **Constructor**: The MountObserver class constructor method
- **Test_Suite**: The collection of Playwright test files in the tests/ directory
- **Documentation**: The README.md file containing library usage documentation

## Requirements

### Requirement 1: Remove enhancementConfig from Type Definitions

**User Story:** As a library maintainer, I want to remove the enhancementConfig property from the MountConfig interface, so that the type system no longer allows this configuration option.

#### Acceptance Criteria

1. THE Type_Definition_File SHALL NOT contain the property `enhancementConfig?: EnhancementConfig | EnhancementConfig[];` in the MountConfig interface
2. THE Type_Definition_File SHALL NOT import EnhancementConfig from '../assign-gingerly/types'
3. WHEN TypeScript compilation runs, THE Compiler SHALL NOT produce any errors related to missing EnhancementConfig type

### Requirement 2: Remove Array Argument Support from Constructor

**User Story:** As a library maintainer, I want to remove support for passing EnhancementConfig arrays directly to the MountObserver constructor, so that the constructor only accepts MountConfig objects.

#### Acceptance Criteria

1. THE Constructor SHALL accept only MountConfig as its first parameter
2. THE Constructor SHALL NOT accept `EnhancementConfig[]` as its first parameter
3. THE Constructor SHALL NOT contain logic to convert EnhancementConfig arrays to MountConfig objects
4. WHEN an array is passed to the Constructor, THE TypeScript_Compiler SHALL produce a type error

### Requirement 3: Remove Enhancement Config Processing Logic

**User Story:** As a library maintainer, I want to remove all code that processes enhancementConfig from MountObserver, so that the implementation no longer handles enhancement-based configuration.

#### Acceptance Criteria

1. THE MountObserver_Class SHALL NOT contain the #registerEnhancementConfigs method
2. THE MountObserver_Class SHALL NOT reference this.#init.enhancementConfig in any method
3. THE #matchesSelector_Method SHALL NOT check withAttrs conditions from enhancementConfig
4. THE #handleMatch_Method SHALL NOT spawn enhancements from enhancementConfig
5. THE #loadImports_Method SHALL NOT call #registerEnhancementConfigs
6. THE observe_Method SHALL NOT call #registerEnhancementConfigs
7. WHEN MountObserver processes elements, THE System SHALL NOT interact with enhancement registries

### Requirement 4: Remove Enhancement Config Test Files

**User Story:** As a library maintainer, I want to remove all test files related to enhancementConfig functionality, so that the test suite no longer validates removed features.

#### Acceptance Criteria

1. THE Test_Suite SHALL NOT contain test-enhancement-registry.spec.mjs
2. THE Test_Suite SHALL NOT contain test-enhancement-registry.html
3. THE Test_Suite SHALL NOT contain test-load-enhancement-config.spec.mjs
4. THE Test_Suite SHALL NOT contain test-load-enhancement-config.html
5. THE Test_Suite SHALL NOT contain test-spawn-on-mount.spec.mjs
6. THE Test_Suite SHALL NOT contain test-spawn-on-mount.html
7. THE Test_Suite SHALL NOT contain test-with-attrs.spec.mjs
8. THE Test_Suite SHALL NOT contain test-with-attrs.html
9. THE Test_Suite SHALL NOT contain test-array-argument.spec.mjs
10. THE Test_Suite SHALL NOT contain test-array-argument.html

### Requirement 5: Update Remaining Test Files

**User Story:** As a library maintainer, I want to remove enhancementConfig references from test files that are not being deleted, so that remaining tests do not reference the removed feature.

#### Acceptance Criteria

1. WHEN test-element-mount.html contains references to EnhancementConfig arrays, THE File SHALL be updated to remove those test cases
2. FOR ALL remaining test files in the Test_Suite, THE Files SHALL NOT contain references to enhancementConfig property
3. WHEN all tests run, THE Test_Suite SHALL pass without errors

### Requirement 6: Remove Documentation References

**User Story:** As a library user, I want the documentation to not mention enhancementConfig, so that I am not confused by references to removed features.

#### Acceptance Criteria

1. THE Documentation SHALL NOT contain the term "enhancementConfig"
2. THE Documentation SHALL NOT contain examples showing EnhancementConfig usage
3. THE Documentation SHALL NOT describe passing arrays to the MountObserver constructor
4. WHEN developers read the Documentation, THE Content SHALL accurately reflect the current API

### Requirement 7: Remove Array Support from ElementMountExtension

**User Story:** As a library maintainer, I want to remove EnhancementConfig array handling from ElementMountExtension, so that the extension module does not reference the removed feature.

#### Acceptance Criteria

1. THE ElementMountExtension_Module SHALL NOT accept EnhancementConfig[] in its mount method signature
2. THE ElementMountExtension_Module SHALL only accept MountConfig in its mount method signature
3. WHEN ElementMountExtension.ts compiles, THE Compiler SHALL NOT produce errors related to EnhancementConfig

### Requirement 8: Maintain Existing Functionality

**User Story:** As a library user, I want all non-enhancementConfig features to continue working after the removal, so that my existing code is not broken.

#### Acceptance Criteria

1. THE MountObserver_Class SHALL continue to support the matching property
2. THE MountObserver_Class SHALL continue to support the whereInstanceOf property
3. THE MountObserver_Class SHALL continue to support the import property
4. THE MountObserver_Class SHALL continue to support the do property
5. THE MountObserver_Class SHALL continue to support the assignOnMount property
6. THE MountObserver_Class SHALL continue to support the reference property
7. WHEN existing tests for non-enhancementConfig features run, THE Tests SHALL pass
8. FOR ALL MountConfig properties except enhancementConfig, THE Properties SHALL function identically to before the removal

### Requirement 9: Clean Compilation

**User Story:** As a library maintainer, I want the TypeScript code to compile without errors after the removal, so that the library can be built and published.

#### Acceptance Criteria

1. WHEN `tsc` runs with the project tsconfig.json, THE Compilation SHALL complete without errors
2. WHEN `tsc` runs with the project tsconfig.json, THE Compilation SHALL complete without warnings related to enhancementConfig
3. THE Compiled_JavaScript_Files SHALL be generated for all TypeScript source files
4. WHEN the compiled code runs, THE Runtime SHALL NOT throw errors related to missing enhancementConfig handling
