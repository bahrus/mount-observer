# Implementation Plan: Scoped Parser Registry

## Overview

This feature implements scoped parser registries and EMC parser loading across the assign-gingerly and mount-observer packages. The implementation spans two repositories with clear separation of concerns:

- **assign-gingerly**: Core registry infrastructure, parser resolution, and public API
- **mount-observer**: EMC parser loading, parser waiting, and synthesizer element context management

The implementation follows a phased approach to ensure each component is tested before building dependent features.

## Tasks

- [x] 1. Phase 1: Core Registry Infrastructure (assign-gingerly)
  - [x] 1.1 Create ScopedParserRegistry class
    - Create `assign-gingerly/ScopedParserRegistry.ts` with register/get/has/waitFor/getNames methods
    - Implement Promise-based waitFor mechanism with timeout support
    - Store parsers in Map<string, (v: string | null) => any>
    - Store pending waiters in Map<string, Array<{resolve, reject}>>
    - When register() is called, resolve all pending waiters for that parser
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_
  
  - [ ]* 1.2 Write unit tests for ScopedParserRegistry
    - Test register() and get() methods
    - Test has() method
    - Test waitFor() resolves when all parsers registered
    - Test waitFor() rejects on timeout with descriptive error
    - Test multiple waitFor() calls for same parser
    - Test register() resolves pending waiters
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_
  
  - [x] 1.3 Add public API functions to parserRegistry.ts
    - Add getParserRegistry(synthesizerElement) function
    - Add registerParser(synthesizerElement, name, parser) function
    - Use Symbol.for('assign-gingerly.scopedParserRegistry') for storage
    - Create registry if it doesn't exist
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 1.4 Write unit tests for public API
    - Test registerParser() creates registry if needed
    - Test getParserRegistry() returns same instance
    - Test multiple registrations to same synthesizer element
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Phase 2: Parser Resolution Modifications (assign-gingerly)
  - [x] 2.1 Remove tuple syntax support from resolveParser
    - Delete all code handling Array.isArray(parserSpec) in parseWithAttrs.ts
    - Remove references to Custom Element Static Method Parsers
    - Add error message if tuple syntax is encountered
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.2 Add synthesizerElement parameter to parseWithAttrs
    - Modify parseWithAttrs signature to accept optional synthesizerElement parameter
    - Pass synthesizerElement to resolveParser calls
    - Maintain backward compatibility when parameter not provided
    - _Requirements: 10.1, 10.5_
  
  - [x] 2.3 Modify resolveParser to check scoped registry first
    - Add synthesizerElement parameter to resolveParser function
    - If synthesizerElement provided, check scoped registry first
    - Fall back to global registry if not found in scoped
    - If synthesizerElement not provided, check global registry only
    - Throw descriptive error if parser not found in either registry
    - _Requirements: 3.3, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2_
  
  - [ ]* 2.4 Write unit tests for resolveParser modifications
    - Test inline function returns directly
    - Test string lookup in scoped registry
    - Test string lookup fallback to global registry
    - Test error when parser not found
    - Test backward compatibility without synthesizerElement
    - Test tuple syntax throws error
    - _Requirements: 1.4, 3.3, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3_
  
  - [ ]* 2.5 Write unit tests for parseWithAttrs modifications
    - Test scoped parser resolution with synthesizerElement
    - Test backward compatibility without synthesizerElement
    - Test error propagation from resolveParser
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3. Phase 3: SpawnContext Extension (assign-gingerly)
  - [x] 3.1 Extend SpawnContext interface
    - Add synthesizerElement?: Element property to SpawnContext interface
    - Update type definitions in types/assign-gingerly/types.d.ts
    - Add JSDoc documentation explaining the property's purpose
    - _Requirements: 10.1_
  
  - [x] 3.2 Update enhancement constructor documentation
    - Add examples showing how to pass ctx.synthesizerElement to parseWithAttrs
    - Update README with enhancement constructor pattern
    - _Requirements: 10.1_

- [x] 4. Checkpoint - Ensure all assign-gingerly tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 4: EMC Parser Loading (mount-observer)
  - [x] 5.1 Create EMCParserScriptHandler class
    - Create `mount-observer/handlers/EMCParserScriptHandler.ts`
    - Extend EvtRt base class
    - Set matching = 'script[type="emc-parser"]'
    - Set whereInstanceOf = HTMLScriptElement
    - _Requirements: 4.1_
  
  - [x] 5.2 Implement findContainingSynthesizer helper
    - Traverse up from element to find synthesizer element
    - Check for data-synthesizer attribute, be-hive tag, or __isSynthesizer property
    - Traverse through shadow root boundaries (parentElement, shadowRoot.host, parentNode)
    - Return undefined if no synthesizer found
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 5.3 Implement mount method for parser loading
    - Read src and parser-name attributes
    - Validate required attributes (log error and set data-parser-error if missing)
    - Find containing synthesizer element using findContainingSynthesizer
    - Dynamic import parser module using await import(src)
    - Validate module.default is a function
    - Get scoped registry using getParserRegistry(synthesizerElement)
    - Register parser using registry.register(parserName, parser)
    - Dispatch 'parser-registered' event with parser name
    - Handle errors: log error, set data-parser-error attribute
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 13.1, 13.2, 13.3, 13.4_
  
  - [x] 5.4 Register EMCParserScriptHandler with MountObserver
    - Add EMCParserScriptHandler to mount-observer's handler registry
    - Ensure handler is loaded and registered on initialization
    - _Requirements: 4.1_
  
  - [ ]* 5.5 Write integration tests for declarative parser loading
    - Test parser loads via emc-parser script
    - Test parser registered in synthesizer element's scoped registry
    - Test parser-registered event dispatched
    - Test error handling for missing src attribute
    - Test error handling for missing parser-name attribute
    - Test error handling for invalid parser module
    - Test data-parser-error attribute set on errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.5_

- [x] 6. Phase 5: EMC Parser Waiting (mount-observer)
  - [x] 6.1 Modify EMCScript handler to find synthesizer element
    - Add findContainingSynthesizer helper to EMCScript handler (same logic as EMCParserScriptHandler)
    - Call findContainingSynthesizer from script element (not enhanced element)
    - Store synthesizerElement reference for later use
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 6.2 Implement parser waiting logic in EMCScript handler
    - Check for wait-for-parsers attribute on script element
    - Parse space-delimited parser names from attribute value
    - Read data-parser-timeout attribute (default: 60000ms)
    - Get scoped registry from synthesizerElement
    - Call registry.waitFor(parserNames, timeout)
    - Wait for Promise to resolve before processing enhancement
    - On timeout/rejection: log error, set data-emc-error attribute, stop processing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4, 11.3, 11.4_
  
  - [x] 6.3 Store synthesizerElement in enhancement configuration
    - After parser waiting completes (or if no waiting needed), store synthesizerElement reference
    - Add synthesizerElement to enhancement configuration object
    - Ensure synthesizerElement is passed through SpawnContext when enhancement spawns
    - _Requirements: 10.1_
  
  - [ ]* 6.4 Write integration tests for parser waiting
    - Test EMC script waits for parser
    - Test parser loads after EMC script
    - Test enhancement processes after parser loads
    - Test wait-for-parsers with multiple parsers
    - Test all parsers must be ready before processing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.5 Write integration tests for parser waiting timeout
    - Test EMC script waits for non-existent parser
    - Test timeout occurs after specified duration
    - Test error logged with missing parser names
    - Test data-emc-error attribute set
    - Test enhancement not processed on timeout
    - _Requirements: 6.5, 6.6, 8.4, 11.3, 11.4_

- [x] 7. Checkpoint - Ensure all mount-observer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Phase 6: End-to-End Integration Testing
  - [ ]* 8.1 Write integration test for declarative parser loading with enhancement
    - Load parser via emc-parser script
    - Load enhancement via emc script with wait-for-parsers
    - Use parser in enhancement attribute
    - Verify enhancement processes correctly with scoped parser
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3_
  
  - [ ]* 8.2 Write integration test for programmatic parser registration
    - Register parser via registerParser() API
    - Load enhancement via emc script with wait-for-parsers
    - Verify parser waiting resolves correctly
    - Verify enhancement uses programmatically registered parser
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 8.3 Write integration test for shadow root syndication
    - Register parser in parent synthesizer element
    - Create shadow root with syndicated emc script
    - Verify parser accessible in shadow root enhancement
    - Verify parser resolution traverses shadow boundaries
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 8.4 Write integration test for multiple synthesizer isolation
    - Create two synthesizer elements (e.g., be-hive instances)
    - Register parser "foo" in synthesizer A
    - Register different parser "foo" in synthesizer B
    - Verify enhancements in A use A's parser
    - Verify enhancements in B use B's parser
    - Verify parsers are isolated between synthesizers
    - _Requirements: 2.6_
  
  - [ ]* 8.5 Write integration test for global registry fallback
    - Use built-in parser (json, timestamp, etc.) in enhancement
    - Do not register parser in scoped registry
    - Verify fallback to global registry works
    - Verify enhancement processes correctly with global parser
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 8.6 Write integration test for backward compatibility
    - Use inline parser function in enhancement
    - Do not provide synthesizerElement context
    - Verify inline parser works unchanged
    - Verify global registry parsers work without scoped context
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 9. Phase 7: Documentation and Examples
  - [ ] 9.1 Update assign-gingerly README
    - Document ScopedParserRegistry class and methods
    - Document registerParser() and getParserRegistry() API
    - Document synthesizerElement parameter in parseWithAttrs
    - Add examples of programmatic parser registration
    - Add migration guide for tuple syntax removal
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 9.2 Update mount-observer README
    - Document <script type="emc-parser"> syntax
    - Document wait-for-parsers attribute
    - Document data-parser-timeout attribute
    - Add examples of declarative parser loading
    - Add examples of parser waiting patterns
    - Document error attributes (data-parser-error, data-emc-error)
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 8.1, 8.2, 8.3_
  
  - [ ] 9.3 Create example project demonstrating declarative loading
    - Create HTML example with emc-parser script
    - Create parser module with default export
    - Create enhancement using scoped parser
    - Add comments explaining each step
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 9.4 Create example project demonstrating parser waiting
    - Create HTML example with wait-for-parsers attribute
    - Demonstrate parser loading after EMC script
    - Show timeout configuration
    - Add comments explaining timing and order
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3_
  
  - [ ] 9.5 Create example project demonstrating shadow root syndication
    - Create custom element with shadow root
    - Show parser registration in parent synthesizer
    - Show parser usage in shadow root enhancement
    - Add comments explaining syndication pattern
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- assign-gingerly tasks (Phases 1-3) can be completed independently before mount-observer tasks
- mount-observer tasks (Phases 4-5) depend on assign-gingerly core infrastructure
- Integration tests (Phase 6) require both repositories to be complete
- Documentation (Phase 7) should be completed after all implementation is verified
