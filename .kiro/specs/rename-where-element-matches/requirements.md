# Requirements Document

## Introduction

This specification defines the requirements for refactoring the `matching` property name to `matching` throughout the mount-observer codebase. This is a breaking API change that affects the public interface of the MountConfig configuration object.

## Glossary

- **MountConfig**: The configuration object passed to MountObserver constructor that defines what elements to observe and how to act upon them
- **System**: The mount-observer library codebase including TypeScript source files, compiled JavaScript files, and test files
- **Property_Name**: The identifier used in the MountConfig interface for specifying CSS selector matching

## Requirements

### Requirement 1: Update Type Definitions

**User Story:** As a library maintainer, I want to update the type definitions to use the new property name, so that TypeScript users have correct type information.

#### Acceptance Criteria

1. THE System SHALL rename `matching` to `matching` in the MountConfig interface in types.d.ts
2. THE System SHALL rename `matching` to `matching` in the DismountReason type literal in types.d.ts
3. WHEN the type definitions are updated, THE System SHALL maintain all other interface properties unchanged
4. WHEN the type definitions are updated, THE System SHALL preserve the property type as `string`

### Requirement 2: Update Source Code References

**User Story:** As a library maintainer, I want to update all source code references to use the new property name, so that the implementation matches the type definitions.

#### Acceptance Criteria

1. THE System SHALL identify all TypeScript source files (.ts) that reference `matching`
2. THE System SHALL rename all occurrences of `matching` to `matching` in TypeScript source files
3. THE System SHALL identify all JavaScript files (.js) that reference `matching`
4. THE System SHALL rename all occurrences of `matching` to `matching` in JavaScript files
5. WHEN source code is updated, THE System SHALL preserve all surrounding code structure and logic

### Requirement 3: Update Test Files

**User Story:** As a library maintainer, I want to update all test files to use the new property name, so that tests continue to validate the correct API.

#### Acceptance Criteria

1. THE System SHALL identify all HTML test files in the tests/ directory that reference `matching`
2. THE System SHALL rename all occurrences of `matching` to `matching` in HTML test files
3. THE System SHALL identify all test spec files (.spec.mjs) that reference `matching`
4. THE System SHALL rename all occurrences of `matching` to `matching` in test spec files
5. WHEN test files are updated, THE System SHALL preserve all test logic and assertions

### Requirement 4: Verify Completeness

**User Story:** As a library maintainer, I want to ensure no references to the old property name remain, so that the refactoring is complete and consistent.

#### Acceptance Criteria

1. WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `matching` in type definition files
2. WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `matching` in source code files
3. WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `matching` in test files
4. THE System SHALL allow occurrences of `matching` in documentation files that describe the migration or changelog

### Requirement 5: Compilation and Testing Validation

**User Story:** As a library maintainer, I want to verify the code compiles and tests pass after the change, so that I know the refactoring didn't break functionality.

#### Acceptance Criteria

1. WHEN TypeScript compilation is run, THE System SHALL compile without errors
2. WHEN TypeScript compilation is run, THE System SHALL generate corresponding .js files for all .ts files
3. WHEN the test suite is executed, THE System SHALL pass all existing tests
4. IF compilation fails, THEN THE System SHALL report specific compilation errors
5. IF tests fail, THEN THE System SHALL report which tests failed and why
