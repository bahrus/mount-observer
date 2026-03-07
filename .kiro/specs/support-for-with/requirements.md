# Requirements Document

## Introduction

This feature adds support for the `with` property to MountObserver, enabling hierarchical composition of multiple mount observers. The `with` property allows a parent observer to create and manage sub-observers that observe the same root node, with their lifecycle tied to the parent. This enables coordination patterns like cross-scope custom element registry management, master-detail relationships, and progressive enhancement with multiple coordinated layers.

## Glossary

- **MountObserver**: The main API class that observes DOM elements matching CSS selectors and executes handlers when elements mount/dismount
- **MountConfig**: Configuration object that defines what elements to observe and what actions to take
- **MountContext**: Context object passed to mount handlers containing information about the mounted element and observer state
- **Sub-observer**: A MountObserver instance created and managed by a parent observer through the `with` property
- **Parent_Observer**: A MountObserver instance that creates and manages sub-observers via its `with` configuration
- **Root_Node**: The DOM node that a MountObserver is observing for changes
- **Handler**: A callback function or class that executes when elements mount or dismount
- **Lifecycle**: The sequence of states an observer goes through: creation, observation, disconnection

## Requirements

### Requirement 1: Add with Property to MountConfig

**User Story:** As a developer, I want to define multiple coordinated observers in a single configuration, so that I can manage related observation patterns together.

#### Acceptance Criteria

1. THE MountConfig SHALL include an optional `with` property of type `{[K in keyof TKeys]: MountConfig}`
2. WHEN a MountConfig includes a `with` property, THE MountObserver SHALL accept it without validation errors
3. THE `with` property SHALL map string keys to MountConfig objects
4. WHEN a MountConfig has a `with` property, THE MountObserver SHALL treat each key-value pair as a sub-observer configuration

### Requirement 2: Create Sub-observers During Parent Observation

**User Story:** As a developer, I want sub-observers to be automatically created when the parent starts observing, so that I don't need to manually manage multiple observer instances.

#### Acceptance Criteria

1. WHEN the Parent_Observer's `observe()` method is called, THE Parent_Observer SHALL create a MountObserver instance for each entry in the `with` property
2. WHEN creating sub-observers, THE Parent_Observer SHALL pass the same Root_Node to each sub-observer's `observe()` method
3. WHEN creating sub-observers, THE Parent_Observer SHALL use the corresponding MountConfig from the `with` property for each sub-observer
4. THE Parent_Observer SHALL store references to all created sub-observers indexed by their keys from the `with` property
5. WHEN a sub-observer's MountConfig includes its own `with` property, THE sub-observer SHALL recursively create its own sub-observers

### Requirement 3: Sub-observer Configuration Independence

**User Story:** As a developer, I want each sub-observer to have its own independent configuration, so that I can define different observation patterns for each sub-observer.

#### Acceptance Criteria

1. THE Parent_Observer SHALL NOT inherit any configuration properties to sub-observers
2. WHEN creating a sub-observer, THE Parent_Observer SHALL use only the MountConfig specified in the corresponding `with` entry
3. THE sub-observer SHALL operate independently with its own `matching`, `whereInstanceOf`, and other MountConfig properties

### Requirement 4: Manage Sub-observer Lifecycle

**User Story:** As a developer, I want sub-observers to be automatically cleaned up when the parent disconnects, so that I don't have memory leaks or orphaned observers.

#### Acceptance Criteria

1. WHEN the Parent_Observer's `disconnect()` method is called, THE Parent_Observer SHALL call `disconnect()` on all sub-observers
2. WHEN the Parent_Observer's `disconnect()` method is called, THE Parent_Observer SHALL disconnect all sub-observers before completing its own disconnection
3. THE sub-observers SHALL follow the same lifecycle states as the Parent_Observer

### Requirement 5: Expose Sub-observers in MountContext

**User Story:** As a handler developer, I want access to sub-observers from within mount handlers, so that I can query their state and coordinate behavior across observers.

#### Acceptance Criteria

1. THE MountContext SHALL include an optional `withObservers` property of type `{[K in keyof TKeys]: IMountObserver}`
2. WHEN a Parent_Observer has sub-observers, THE MountContext passed to handlers SHALL include the `withObservers` property
3. THE `withObservers` property SHALL contain all sub-observers indexed by their keys from the `with` property
4. WHEN a Parent_Observer has no sub-observers, THE MountContext SHALL either omit the `withObservers` property or set it to undefined

### Requirement 6: Fix MountConfig Property Naming in MountContext

**User Story:** As a developer, I want consistent naming conventions in the API, so that the codebase is easier to understand and maintain.

#### Acceptance Criteria

1. THE MountContext SHALL rename the `MountConfig` property to `mountConfig`
2. THE MountObserver SHALL pass `mountConfig` (not `MountConfig`) in all MountContext objects
3. THE MountObserver SHALL update all internal code that references `MountConfig` in MountContext to use `mountConfig`
4. THE test suite SHALL update all assertions that reference `MountConfig` in MountContext to use `mountConfig`

### Requirement 7: Type Safety for with Property

**User Story:** As a TypeScript developer, I want full type safety when using the `with` property, so that I catch configuration errors at compile time.

#### Acceptance Criteria

1. THE MountConfig type definition SHALL use a generic type parameter TKeys for the `with` property keys
2. WHEN a developer defines a `with` property, THE TypeScript compiler SHALL infer the keys and provide autocomplete
3. THE `withObservers` property in MountContext SHALL use the same TKeys type parameter to ensure key consistency
4. THE TypeScript compiler SHALL enforce that `withObservers` keys match the `with` property keys

### Requirement 8: Nested Sub-observer Support

**User Story:** As a developer, I want to create hierarchies of observers with multiple levels, so that I can model complex coordination patterns.

#### Acceptance Criteria

1. WHEN a sub-observer's MountConfig includes a `with` property, THE sub-observer SHALL create its own sub-observers
2. THE nesting depth SHALL be unlimited
3. WHEN a parent observer disconnects, THE Parent_Observer SHALL recursively disconnect all descendant sub-observers
4. THE MountContext for nested sub-observers SHALL include their own `withObservers` property for their immediate children

### Requirement 9: Memory Management for Sub-observers

**User Story:** As a developer, I want efficient memory usage when using sub-observers, so that my application doesn't leak memory.

#### Acceptance Criteria

1. WHEN the Parent_Observer is garbage collected, THE sub-observers SHALL be eligible for garbage collection
2. THE Parent_Observer SHALL maintain strong references to sub-observers during its active lifecycle
3. WHEN all sub-observers are disconnected, THE Parent_Observer SHALL release all references to sub-observers
