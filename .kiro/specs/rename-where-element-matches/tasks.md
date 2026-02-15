# Implementation Plan: Rename whereElementMatches to matching

## Overview

This implementation plan breaks down the refactoring of `whereElementMatches` to `matching` into discrete steps. The approach is to update files in a logical order: type definitions first, then source code, then tests, followed by compilation and verification.

## Tasks

- [x] 1. Update type definitions in types.d.ts
  - Rename `whereElementMatches` property to `matching` in MountInit interface
  - Update `'where-element-matches-failed'` to `'with-matching-failed'` in DismountReason type
  - Verify the property type remains `string`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update TypeScript source files
  - [x] 2.1 Update MountObserver.ts
    - Replace all occurrences of `whereElementMatches` with `matching`
    - Update property access: `this.#init.whereElementMatches` → `this.#init.matching`
    - Update any comments referencing the property name
    - _Requirements: 2.2, 2.5_
  
  - [x] 2.2 Search for and update any other TypeScript files
    - Use grep to find any other .ts files with `whereElementMatches`
    - Update all found occurrences to `matching`
    - _Requirements: 2.2, 2.5_

- [x] 3. Compile TypeScript to JavaScript
  - Run `tsc` to compile all TypeScript files
  - Verify compilation completes without errors
  - Verify .js files are generated/updated for all .ts files
  - _Requirements: 5.1, 5.2_

- [x] 4. Update test files
  - [x] 4.1 Update HTML test files
    - Search tests/ directory for all .html files containing `whereElementMatches`
    - Replace all occurrences with `matching` in MountObserver configuration objects
    - Update any test descriptions or comments referencing the property
    - _Requirements: 3.2, 3.5_
  
  - [x] 4.2 Update test spec files
    - Search tests/ directory for all .spec.mjs files containing `whereElementMatches`
    - Replace all occurrences with `matching`
    - Update any test descriptions referencing the property
    - _Requirements: 3.4, 3.5_

- [x] 5. Verify completeness with grep search
  - Run grep search across all code files for `whereElementMatches`
  - Command: `grep -r "whereElementMatches" --include="*.ts" --include="*.js" --include="*.d.ts" --include="*.html" --include="*.mjs" .`
  - Verify zero occurrences found (excluding documentation files if any)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Run test suite
  - Execute `npm test` to run all Playwright tests
  - Verify all tests pass
  - If any tests fail, review and fix issues
  - _Requirements: 5.3_

- [x] 7. Final checkpoint
  - Ensure all tests pass
  - Ensure grep search shows no remaining occurrences
  - Ensure TypeScript compilation is clean
  - Ask the user if questions arise

## Notes

- This refactoring should be completed in a single commit for easy rollback if needed
- The property name change is purely cosmetic - no behavioral changes
- All existing tests serve as regression tests to ensure functionality is preserved
- If compilation or tests fail, review the error messages and verify all occurrences were updated
- Documentation files (if any) that describe the migration may intentionally contain the old name
