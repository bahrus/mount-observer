# Design Document: Rename whereElementMatches to withMatching

## Overview

This design describes the approach for refactoring the `whereElementMatches` property to `withMatching` throughout the mount-observer codebase. This is a straightforward find-and-replace refactoring that affects:

- Type definitions (types.d.ts)
- Source code implementation (MountObserver.ts and potentially other .ts files)
- Compiled JavaScript files (.js)
- Test files (.html and .spec.mjs)

The refactoring is purely a naming change with no behavioral modifications.

## Architecture

### Affected Components

1. **Type System** (types.d.ts)
   - MountInit interface property definition
   - DismountReason type literal value

2. **Core Implementation** (MountObserver.ts)
   - Property access via `this.#init.whereElementMatches`
   - Comments referencing the property name

3. **Compiled Output** (*.js files)
   - All JavaScript files corresponding to TypeScript sources
   - Generated through TypeScript compilation

4. **Test Suite** (tests/*.html, tests/*.spec.mjs)
   - MountObserver instantiation with configuration objects
   - Test descriptions and comments

### Refactoring Strategy

This is a **global search-and-replace refactoring** with the following characteristics:

- **Scope**: All files in the repository except documentation
- **Pattern**: Exact string match for `whereElementMatches`
- **Replacement**: `withMatching`
- **Validation**: TypeScript compilation + test execution

## Components and Interfaces

### 1. Type Definition Updates

**File**: `types.d.ts`

**Changes**:
```typescript
// Before
export interface MountInit {
    whereElementMatches: string;
    // ...
}

export type DismountReason = 
    | 'media-query-failed'
    | 'where-element-matches-failed';

// After
export interface MountInit {
    withMatching: string;
    // ...
}

export type DismountReason = 
    | 'media-query-failed'
    | 'with-matching-failed';
```

### 2. Source Code Updates

**File**: `MountObserver.ts`

**Changes**:
```typescript
// Before
root.querySelectorAll(this.#init.whereElementMatches).forEach(child => {
    // ...
});

const matchesElement = element.matches(this.#init.whereElementMatches);

// After
root.querySelectorAll(this.#init.withMatching).forEach(child => {
    // ...
});

const matchesElement = element.matches(this.#init.withMatching);
```

### 3. Test File Updates

**Pattern in test files**:
```javascript
// Before
const observer = new MountObserver({
    whereElementMatches: 'input',
    // ...
});

// After
const observer = new MountObserver({
    withMatching: 'input',
    // ...
});
```

## Data Models

No data model changes - this is a property name refactoring only.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 THE System SHALL rename `whereElementMatches` to `withMatching` in the MountInit interface in types.d.ts
  Thoughts: This is a specific file edit that can be verified by checking the file content after the change. This is an example of a specific change.
  Testable: yes - example

1.2 THE System SHALL rename `whereElementMatches` to `withMatching` in the DismountReason type literal in types.d.ts
  Thoughts: This is another specific file edit that can be verified by checking the file content. This is an example.
  Testable: yes - example

1.3 WHEN the type definitions are updated, THE System SHALL maintain all other interface properties unchanged
  Thoughts: This is about ensuring we don't accidentally modify other properties. We can verify this by comparing the before and after state of the file, ensuring only the target property changed.
  Testable: yes - example

1.4 WHEN the type definitions are updated, THE System SHALL preserve the property type as `string`
  Thoughts: This verifies the type annotation remains unchanged. This is an example check.
  Testable: yes - example

2.1 THE System SHALL identify all TypeScript source files (.ts) that reference `whereElementMatches`
  Thoughts: This is about the search process, not a testable property of the final system.
  Testable: no

2.2 THE System SHALL rename all occurrences of `whereElementMatches` to `withMatching` in TypeScript source files
  Thoughts: This is verifiable by searching all .ts files for the old name and ensuring none exist.
  Testable: yes - property

2.3 THE System SHALL identify all JavaScript files (.js) that reference `whereElementMatches`
  Thoughts: This is about the search process, not a testable property of the final system.
  Testable: no

2.4 THE System SHALL rename all occurrences of `whereElementMatches` to `withMatching` in JavaScript files
  Thoughts: This is verifiable by searching all .js files for the old name and ensuring none exist.
  Testable: yes - property

2.5 WHEN source code is updated, THE System SHALL preserve all surrounding code structure and logic
  Thoughts: This is about ensuring we don't break code during refactoring. This is best verified by compilation and tests passing, not a specific property test.
  Testable: no

3.1 THE System SHALL identify all HTML test files in the tests/ directory that reference `whereElementMatches`
  Thoughts: This is about the search process, not a testable property.
  Testable: no

3.2 THE System SHALL rename all occurrences of `whereElementMatches` to `withMatching` in HTML test files
  Thoughts: This is verifiable by searching all .html files in tests/ for the old name.
  Testable: yes - property

3.3 THE System SHALL identify all test spec files (.spec.mjs) that reference `whereElementMatches`
  Thoughts: This is about the search process, not a testable property.
  Testable: no

3.4 THE System SHALL rename all occurrences of `whereElementMatches` to `withMatching` in test spec files
  Thoughts: This is verifiable by searching all .spec.mjs files for the old name.
  Testable: yes - property

3.5 WHEN test files are updated, THE System SHALL preserve all test logic and assertions
  Thoughts: This is best verified by tests passing, not a specific property test.
  Testable: no

4.1 WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `whereElementMatches` in type definition files
  Thoughts: This is verifiable by searching .d.ts files for the old name.
  Testable: yes - property

4.2 WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `whereElementMatches` in source code files
  Thoughts: This is verifiable by searching .ts files for the old name.
  Testable: yes - property

4.3 WHEN the refactoring is complete, THE System SHALL contain zero occurrences of the string `whereElementMatches` in test files
  Thoughts: This is verifiable by searching test files for the old name.
  Testable: yes - property

4.4 THE System SHALL allow occurrences of `whereElementMatches` in documentation files that describe the migration or changelog
  Thoughts: This is about excluding certain files from the search. This is a constraint on the refactoring process, not a testable property of the result.
  Testable: no

5.1 WHEN TypeScript compilation is run, THE System SHALL compile without errors
  Thoughts: This is verifiable by running tsc and checking the exit code.
  Testable: yes - example

5.2 WHEN TypeScript compilation is run, THE System SHALL generate corresponding .js files for all .ts files
  Thoughts: This is verifiable by checking that .js files exist for .ts files after compilation.
  Testable: yes - example

5.3 WHEN the test suite is executed, THE System SHALL pass all existing tests
  Thoughts: This is verifiable by running the test suite and checking results.
  Testable: yes - example

5.4 IF compilation fails, THEN THE System SHALL report specific compilation errors
  Thoughts: This is about error reporting behavior, which is a feature of the TypeScript compiler, not our refactoring.
  Testable: no

5.5 IF tests fail, THEN THE System SHALL report which tests failed and why
  Thoughts: This is about error reporting behavior, which is a feature of the test framework, not our refactoring.
  Testable: no

### Property Reflection

Reviewing the testable properties:
- Properties 2.2, 2.4, 3.2, 3.4, 4.1, 4.2, 4.3 all test the same thing: that `whereElementMatches` doesn't exist in various file types
- These can be consolidated into a single comprehensive property: "No occurrences of whereElementMatches in code files"
- The examples (1.1-1.4, 5.1-5.3) are specific validation steps that should remain separate

**Consolidated properties**:
- Property 1: No occurrences of old name in any code file (consolidates 2.2, 2.4, 3.2, 3.4, 4.1, 4.2, 4.3)
- Examples remain as specific validation steps

### Property 1: Complete Refactoring

*For any* file in the codebase with extensions .ts, .js, .d.ts, .html (in tests/), or .spec.mjs, the file content should contain zero occurrences of the string `whereElementMatches`.

**Validates: Requirements 2.2, 2.4, 3.2, 3.4, 4.1, 4.2, 4.3**

## Error Handling

### Compilation Errors

If TypeScript compilation fails after the refactoring:
1. Review compilation error messages
2. Check for any missed references or typos
3. Verify that only the property name changed, not types or structure

### Test Failures

If tests fail after the refactoring:
1. Review test failure messages
2. Check for any test files that were missed
3. Verify that test logic wasn't accidentally modified
4. Ensure all test HTML files were updated

### Incomplete Refactoring

If any references to `whereElementMatches` remain:
1. Use grep/search to find remaining occurrences
2. Manually review each occurrence
3. Update or document why it should remain (e.g., migration documentation)

## Testing Strategy

### Manual Verification Steps

1. **Search Verification**
   - Run: `grep -r "whereElementMatches" --include="*.ts" --include="*.js" --include="*.d.ts" --include="*.html" --include="*.mjs" .`
   - Expected: No matches (or only in documentation files)

2. **Type Definition Check**
   - Open types.d.ts
   - Verify MountInit interface has `withMatching: string`
   - Verify DismountReason has `'with-matching-failed'`

3. **Compilation Check**
   - Run: `tsc`
   - Expected: Exit code 0, no errors
   - Verify .js files are generated/updated

4. **Test Execution**
   - Run: `npm test`
   - Expected: All tests pass

### Property-Based Testing

For this refactoring, property-based testing is not applicable as this is a one-time code transformation rather than runtime behavior. The correctness property (Property 1) is verified through static analysis (grep search) rather than dynamic testing.

### Unit Testing

Unit tests are not needed for this refactoring. The existing test suite serves as regression tests to ensure the refactoring didn't break functionality. The validation approach is:

1. **Static verification**: Search for old property name (should find none)
2. **Compilation verification**: TypeScript compiles without errors
3. **Regression verification**: Existing tests pass

### Test Configuration

- Use existing Playwright test suite
- No new tests need to be written
- All existing tests should pass after refactoring
- Test command: `npm test`

## Implementation Notes

### File Processing Order

1. Update types.d.ts first (establishes new API contract)
2. Update TypeScript source files (.ts)
3. Compile TypeScript to generate updated JavaScript files
4. Update test files (.html and .spec.mjs)
5. Run final verification

### Tools and Commands

**Search for occurrences**:
```bash
grep -r "whereElementMatches" --include="*.ts" --include="*.js" --include="*.d.ts" --include="*.html" --include="*.mjs" .
```

**Compile TypeScript**:
```bash
tsc
```

**Run tests**:
```bash
npm test
```

### Edge Cases

- **Comments**: Update comments that reference the property name
- **String literals**: Update string literals in DismountReason type
- **Test descriptions**: Update test descriptions that mention the property name
- **Documentation**: Exclude documentation files that describe the migration

### Rollback Plan

If issues are discovered:
1. Git revert the changes
2. Review what went wrong
3. Re-apply the refactoring with corrections

The refactoring should be done in a single commit for easy rollback if needed.
