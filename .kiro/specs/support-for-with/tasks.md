# Implementation Plan: Support for With Property

## Overview

This implementation adds hierarchical composition support to MountObserver through a new `with` property in MountConfig. The feature enables parent observers to declaratively create and manage multiple sub-observers that observe the same root node. Implementation follows a 5-phase approach: type definitions, core MountObserver changes, breaking change migration (MountConfig → mountConfig), testing, and documentation.

## Tasks

- [x] 1. Update type definitions with generics and new properties
  - [x] 1.1 Add generic type parameter and with property to MountConfig interface
    - Add `<TKeys extends string = string>` generic parameter to MountConfig
    - Add optional `with?: {[K in TKeys]: MountConfig}` property
    - Include JSDoc documentation for the with property
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_
  
  - [x] 1.2 Update MountContext interface with generics and new properties
    - Add `<TKeys extends string = string>` generic parameter to MountContext
    - Rename `MountConfig` property to `mountConfig`
    - Add optional `withObservers?: {[K in TKeys]: IMountObserver}` property
    - Include JSDoc documentation for both properties
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 7.3_
  
  - [x] 1.3 Update event interfaces to use mountConfig naming
    - Update IMountEvent interface to use mountConfig property
    - Update IDismountEvent interface to use mountConfig property
    - _Requirements: 6.1, 6.2_
  
  - [x] 1.4 Compile TypeScript and verify no type errors
    - Run `tsc` to compile with new type definitions
    - Verify compilation succeeds with no errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement MountObserver core changes
  - [x] 2.1 Add generic type parameter to MountObserver class
    - Update class declaration: `class MountObserver<TKeys extends string = string>`
    - Update constructor signature to accept `MountConfig<TKeys>`
    - _Requirements: 7.1, 7.2_
  
  - [x] 2.2 Add private field for sub-observer storage
    - Add `#subObservers: Map<string, MountObserver> | undefined` field
    - Initialize as undefined (created only when needed)
    - _Requirements: 2.4, 9.2_
  
  - [x] 2.3 Implement #createSubObservers() private method
    - Check if `this.#init.with` exists, return early if not
    - Create `Map<string, MountObserver>` and store in `#subObservers`
    - Iterate over `Object.entries(this.#init.with)`
    - For each entry, create new MountObserver with sub-config
    - Call `observe(rootNode)` on each sub-observer
    - Store sub-observer in Map with its key
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 8.1_
  
  - [x] 2.4 Update observe() method to create sub-observers
    - After setting `this.#rootNode = new WeakRef(observedNode)`
    - Call `await this.#createSubObservers(observedNode)`
    - Ensure sub-observers are created before starting observation
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.5 Update disconnect() method for recursive disconnection
    - Add check for `this.#subObservers` at start of method
    - If exists, iterate over `this.#subObservers.values()`
    - Call `disconnect()` on each sub-observer
    - Call `this.#subObservers.clear()`
    - Set `this.#subObservers = undefined`
    - Ensure this happens before existing disconnection logic
    - _Requirements: 4.1, 4.2, 8.3, 9.3_
  
  - [x] 2.6 Update #createMountContext() to use mountConfig and add withObservers
    - Rename `MountConfig: this.#init` to `mountConfig: this.#init`
    - After creating base context object, check if `this.#subObservers` exists and has size > 0
    - If yes, create `context.withObservers = {} as {[K in TKeys]: IMountObserver}`
    - Iterate over `this.#subObservers.entries()` and populate withObservers
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

- [x] 3. Checkpoint - Compile and verify core implementation
  - Ensure TypeScript compiles without errors, ask the user if questions arise.

- [x] 4. Migrate breaking change throughout codebase
  - [x] 4.1 Update MountObserver.ts internal references
    - Search for all occurrences of `context.MountConfig` or `.MountConfig`
    - Replace with `context.mountConfig` or `.mountConfig`
    - Verify all internal methods use new naming
    - _Requirements: 6.2, 6.3_
  
  - [x] 4.2 Update handler classes to use mountConfig
    - Search handler files for `context.MountConfig` or `ctx.MountConfig`
    - Update to `context.mountConfig` or `ctx.mountConfig`
    - Check built-in handlers and any custom handler examples
    - _Requirements: 6.2, 6.3_
  
  - [x] 4.3 Update event classes to use mountConfig
    - Update MountEvent class to use mountConfig property
    - Update DismountEvent class to use mountConfig property
    - Update any other event classes that reference MountConfig
    - _Requirements: 6.1, 6.2_
  
  - [x] 4.4 Update all test files to use mountConfig
    - Search test files for `context.MountConfig` or `ctx.MountConfig`
    - Replace with `context.mountConfig` or `ctx.mountConfig`
    - Update test assertions and expectations
    - _Requirements: 6.4_

- [x] 5. Checkpoint - Verify breaking change migration
  - Ensure all tests pass with new naming, ask the user if questions arise.

- [x] 6. Write unit tests for sub-observer functionality
  - [x] 6.1 Write test for basic sub-observer creation
    - Create MountObserver with single sub-observer in with property
    - Call observe() on parent
    - Verify sub-observer is created and observing same root node
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.2 Write test for multiple sub-observers
    - Create MountObserver with multiple entries in with property
    - Verify all sub-observers are created with correct keys
    - Verify each uses its own configuration
    - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3_
  
  - [x] 6.3 Write test for withObservers in MountContext
    - Create observer with sub-observers
    - Mount an element and capture MountContext in handler
    - Verify withObservers property exists and contains all sub-observers
    - Verify keys match the with property keys
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x]* 6.4 Write test for sub-observer disconnection
    - Create observer with sub-observers
    - Call disconnect() on parent
    - Verify all sub-observers are disconnected
    - Verify sub-observers Map is cleared
    - _Requirements: 4.1, 4.2, 9.3_
  
  - [x]* 6.5 Write test for nested sub-observers
    - Create observer with sub-observer that has its own sub-observers
    - Verify recursive creation works
    - Verify recursive disconnection works
    - _Requirements: 2.5, 8.1, 8.3_
  
  - [x]* 6.6 Write test for observer without with property
    - Create observer without with property
    - Verify withObservers is undefined in MountContext
    - Verify no sub-observers are created
    - _Requirements: 5.4_
  
  - [x]* 6.7 Write test for empty with property
    - Create observer with empty with object `{}`
    - Verify no sub-observers are created
    - Verify withObservers is undefined or empty
    - _Requirements: 2.1_

- [ ] 7. Write property-based tests for correctness properties
  - [ ]* 7.1 Write property test for sub-observer creation completeness
    - **Property 1: Sub-observer Creation Completeness**
    - **Validates: Requirements 1.2, 1.4, 2.1, 2.2, 2.3**
    - Generate random MountConfig with varying numbers of with entries
    - Verify exactly N sub-observers created for N entries
    - Verify each observes the same root node
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.2 Write property test for configuration isolation
    - **Property 2: Configuration Isolation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Generate random parent config with specific properties
    - Generate random sub-configs with different properties
    - Verify sub-observers don't inherit parent properties
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.3 Write property test for recursive disconnection
    - **Property 3: Recursive Disconnection**
    - **Validates: Requirements 4.1, 4.2, 8.3**
    - Generate random nested observer hierarchies
    - Call disconnect() on root
    - Verify all descendants are disconnected
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.4 Write property test for sub-observer access in context
    - **Property 4: Sub-observer Access in Context**
    - **Validates: Requirements 5.2, 5.3, 8.4**
    - Generate random configs with sub-observers
    - Mount elements and capture contexts
    - Verify withObservers contains correct sub-observers
    - Verify keys match with property keys
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.5 Write property test for mountConfig naming
    - **Property 5: MountConfig Property Naming**
    - **Validates: Requirements 6.1, 6.2**
    - Generate random MountConfig objects
    - Create observers and mount elements
    - Verify all contexts have mountConfig property (not MountConfig)
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.6 Write property test for recursive sub-observer creation
    - **Property 6: Recursive Sub-observer Creation**
    - **Validates: Requirements 2.5, 8.1, 8.2**
    - Generate random nested with properties at varying depths
    - Verify each level creates its own sub-observers
    - Verify no artificial depth limit
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 7.7 Write property test for reference lifecycle management
    - **Property 7: Reference Lifecycle Management**
    - **Validates: Requirements 9.2, 9.3**
    - Create observers with sub-observers
    - Verify sub-observers accessible while parent active
    - Call disconnect() and verify references released
    - Use fast-check with minimum 100 iterations

- [ ] 8. Write integration tests with existing features
  - [ ]* 8.1 Write integration test with media queries
    - Create parent and sub-observers with different media queries
    - Verify both observe correctly based on their media conditions
    - _Requirements: 3.3_
  
  - [ ]* 8.2 Write integration test with intersection observers
    - Create parent and sub-observers with different intersection configs
    - Verify both observe correctly based on their intersection conditions
    - _Requirements: 3.3_
  
  - [ ]* 8.3 Write integration test with import loading
    - Create parent and sub-observers with different import requirements
    - Verify each loads its own imports independently
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 8.4 Write integration test with handler execution
    - Create observers with handlers that access withObservers
    - Verify handlers can query sub-observer state
    - Verify coordination patterns work correctly
    - _Requirements: 5.2, 5.3_
  
  - [ ]* 8.5 Write integration test with event dispatching
    - Create parent and sub-observers that dispatch events
    - Verify events from both parent and sub-observers work correctly
    - Verify event contexts use mountConfig naming
    - _Requirements: 6.1, 6.2_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update API documentation
  - [x] 10.1 Document with property in MountConfig
    - Add with property to API documentation
    - Include type signature and description
    - Add basic usage example
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 10.2 Document withObservers in MountContext
    - Add withObservers property to API documentation
    - Explain when it's present vs undefined
    - Add example of accessing sub-observers in handlers
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 10.3 Document mountConfig naming change
    - Update all API docs that reference MountConfig property
    - Change to mountConfig throughout documentation
    - _Requirements: 6.1, 6.2_
  
  - [x] 10.4 Add migration guide for breaking change
    - Create migration guide section
    - Document MountConfig → mountConfig rename
    - Provide before/after code examples
    - List migration steps for users
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 10.5 Add examples of common patterns
    - Add example: Registry management with sub-observers
    - Add example: Progressive enhancement with multiple layers
    - Add example: Nested sub-observers for complex hierarchies
    - Add example: Accessing sub-observers in handlers
    - _Requirements: 1.4, 5.2, 5.3, 8.1_
  
  - [x] 10.6 Document type safety features
    - Explain generic type parameter TKeys
    - Show how TypeScript infers keys from with property
    - Demonstrate autocomplete for withObservers access
    - Show compile-time error examples
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 10.7 Document known limitations
    - Document circular reference limitation
    - Explain why circular configs are not prevented
    - Recommend against circular configurations
    - _Requirements: 2.5, 8.2_

- [x] 11. Final checkpoint - Verify implementation complete
  - Ensure all tests pass, documentation is updated, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify compatibility with existing MountObserver features
- The breaking change (MountConfig → mountConfig) requires systematic migration across the entire codebase
