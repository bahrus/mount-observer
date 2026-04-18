# Requirements Document

## Introduction

This feature implements scoped parser registries and EMC parser loading across the assign-gingerly and mount-observer packages. The system enables lazy-loading of complex parsers for enhancement attributes while maintaining framework isolation through scoped registries. Each synthesizer element (be-hive, htmx-container, alpine-scope, etc.) maintains its own parser registry to prevent conflicts between different framework libraries, while a global registry continues to serve built-in parsers.

## Glossary

- **Parser**: A function that transforms an attribute string value into a typed value (e.g., JSON string to object)
- **Scoped_Registry**: A parser registry instance associated with a specific synthesizer element, isolated from other synthesizer instances
- **Global_Registry**: The existing globalParserRegistry in assign-gingerly that stores built-in parsers (JSON, timestamp, etc.)
- **EMC_Script**: A script element with type="emc" that defines enhancement configuration
- **EMC_Parser_Script**: A script element with type="emc-parser" that loads and registers a parser module
- **Synthesizer_Element**: A custom element that extends the Synthesizer base class (be-hive, htmx-container, alpine-scope, etc.), acting as a framework container that provides isolation between enhancement libraries
- **Enhancement**: A behavior attached to DOM elements via the assign-gingerly framework
- **Parser_Module**: An ES module that exports a parser function
- **Synthesizer**: A base class that syndicates scripts across shadow roots within a scope
- **Custom_Element_Static_Method_Parser**: The existing tuple syntax approach `['element-name', 'methodName']` that will be removed

## Requirements

### Requirement 1: Remove Custom Element Static Method Parsers

**User Story:** As a developer, I want the tuple syntax parser approach removed, so that the codebase uses only the scoped registry system.

#### Acceptance Criteria

1. THE Assign_Gingerly SHALL remove support for tuple syntax `['element-name', 'methodName']` from resolveParser function
2. THE Assign_Gingerly SHALL remove all code paths that handle Array.isArray(parserSpec) in parseWithAttrs.ts
3. THE Assign_Gingerly SHALL remove references to Custom_Element_Static_Method_Parser from documentation
4. WHEN a tuple parser specification is encountered, THE Assign_Gingerly SHALL throw an error indicating the feature is removed

### Requirement 2: Scoped Parser Registry

**User Story:** As a framework developer, I want each synthesizer element to maintain its own parser registry, so that different framework libraries can coexist without parser name conflicts.

#### Acceptance Criteria

1. THE Scoped_Registry SHALL store parser name to parser function mappings for a single synthesizer element
2. THE Scoped_Registry SHALL provide a register(name, parser) method that adds a parser
3. THE Scoped_Registry SHALL provide a get(name) method that retrieves a parser by name
4. THE Scoped_Registry SHALL provide a has(name) method that checks if a parser exists
5. THE Scoped_Registry SHALL provide a waitFor(names, timeout) method that returns a Promise resolving when all named parsers are registered
6. WHEN a parser is registered in one synthesizer instance, THE Scoped_Registry SHALL NOT make it available to other synthesizer instances
7. WHEN waitFor timeout expires before parsers are registered, THE Scoped_Registry SHALL reject the Promise with a descriptive error listing missing parsers

### Requirement 3: Global Registry Preservation

**User Story:** As a developer, I want built-in parsers to remain globally available, so that I don't need to register common parsers in every be-hive instance.

#### Acceptance Criteria

1. THE Global_Registry SHALL continue to exist as globalParserRegistry in assign-gingerly
2. THE Global_Registry SHALL contain built-in parsers: timestamp, date, csv, int, float, boolean, json
3. WHEN resolveParser looks up a parser by string name, THE Assign_Gingerly SHALL check the Scoped_Registry first, then fall back to Global_Registry
4. THE Global_Registry SHALL remain accessible for programmatic parser registration outside be-hive contexts

### Requirement 4: Declarative Parser Loading

**User Story:** As a developer, I want to load parsers declaratively via HTML script tags, so that parser dependencies are self-documenting and explicit.

#### Acceptance Criteria

1. THE EMC_Parser_Script SHALL match script elements with type="emc-parser"
2. WHEN an EMC_Parser_Script is processed, THE Mount_Observer SHALL read the src attribute to determine the parser module URL
3. WHEN an EMC_Parser_Script is processed, THE Mount_Observer SHALL read the parser-name attribute to determine the registration name
4. THE Mount_Observer SHALL import the Parser_Module using dynamic import
5. THE Mount_Observer SHALL register the imported parser with the containing be-hive's Scoped_Registry
6. WHEN parser registration succeeds, THE Mount_Observer SHALL dispatch a parser-registered event with the parser name
7. IF the Parser_Module fails to load, THEN THE Mount_Observer SHALL log an error with the src and parser-name, and set data-parser-error attribute on the script element

### Requirement 5: Programmatic Parser Registration

**User Story:** As a developer, I want to register parsers programmatically via JavaScript, so that I can load parsers conditionally or from non-standard sources.

#### Acceptance Criteria

1. THE Assign_Gingerly SHALL export a registerParser(synthesizerElement, name, parser) function
2. WHEN registerParser is called, THE Assign_Gingerly SHALL register the parser with the specified synthesizer element's Scoped_Registry
3. WHEN registerParser is called with a synthesizer element that doesn't have a registry, THE Assign_Gingerly SHALL create a new Scoped_Registry for that element
4. THE Assign_Gingerly SHALL export a getParserRegistry(synthesizerElement) function that returns the Scoped_Registry for a synthesizer element

### Requirement 6: EMC Script Parser Waiting

**User Story:** As a developer, I want EMC scripts to wait for required parsers before processing, so that enhancements have access to all necessary parsers during initialization.

#### Acceptance Criteria

1. THE EMC_Script SHALL support a wait-for-parsers attribute containing space-delimited parser names
2. WHEN an EMC_Script has wait-for-parsers attribute, THE Mount_Observer SHALL parse the parser names from the attribute value
3. THE Mount_Observer SHALL call waitFor on the containing be-hive's Scoped_Registry with the parsed parser names
4. THE Mount_Observer SHALL wait for the waitFor Promise to resolve before processing the enhancement configuration
5. IF the waitFor Promise rejects due to timeout, THEN THE Mount_Observer SHALL log an error listing missing parsers and set data-emc-error attribute on the script element
6. THE Mount_Observer SHALL NOT process the enhancement if parser waiting fails

### Requirement 7: Parser Interface

**User Story:** As a parser author, I want a simple parser interface, so that creating parsers is straightforward.

#### Acceptance Criteria

1. THE Parser SHALL be a function with signature `(v: string | null) => any`
2. THE Parser_Module SHALL export the parser function as the default export
3. WHEN a Parser receives null, THE Parser SHALL handle it appropriately for its type (e.g., return null, return default value)
4. WHEN a Parser receives an invalid string, THE Parser SHALL throw a descriptive error

### Requirement 8: Parser Timeout Configuration

**User Story:** As a developer, I want configurable parser loading timeout, so that I can accommodate varying network speeds.

#### Acceptance Criteria

1. THE Scoped_Registry waitFor method SHALL accept a timeout parameter in milliseconds
2. THE Mount_Observer SHALL use a default timeout of 60000 milliseconds (1 minute) for parser waiting
3. WHERE a data-parser-timeout attribute is present on the EMC_Script, THE Mount_Observer SHALL use that value as the timeout in milliseconds
4. WHEN the timeout expires before all parsers are registered, THE Scoped_Registry SHALL reject the waitFor Promise

### Requirement 9: Parser Registry Syndication

**User Story:** As a developer, I want shadow roots within a be-hive scope to access the parent's parser registry, so that I don't need to re-import parser scripts in every shadow root.

#### Acceptance Criteria

1. WHEN resolveParser is called during enhancement initialization, THE Assign_Gingerly SHALL locate the nearest ancestor synthesizer element
2. THE Assign_Gingerly SHALL access the Scoped_Registry from the located synthesizer element
3. WHEN a parser is registered in a parent synthesizer element, THE Assign_Gingerly SHALL make it available to enhancements in child shadow roots
4. THE Assign_Gingerly SHALL traverse up through shadow root boundaries to find the containing synthesizer element

### Requirement 10: Parser Resolution During Enhancement Initialization

**User Story:** As a framework developer, I want parseWithAttrs to access scoped parsers during enhancement initialization, so that enhancements can use parsers registered in their be-hive scope.

#### Acceptance Criteria

1. WHEN parseWithAttrs is called, THE Assign_Gingerly SHALL accept an optional synthesizerElement parameter
2. WHEN resolveParser is called with a string parser name, THE Assign_Gingerly SHALL first check the Scoped_Registry of the provided synthesizerElement
3. IF the parser is not found in the Scoped_Registry, THEN THE Assign_Gingerly SHALL check the Global_Registry
4. IF the parser is not found in either registry, THEN THE Assign_Gingerly SHALL throw an error indicating the parser is not registered
5. WHEN no synthesizerElement is provided, THE Assign_Gingerly SHALL only check the Global_Registry

### Requirement 11: Error Messages for Missing Parsers

**User Story:** As a developer, I want clear error messages when parsers are missing, so that I can quickly diagnose configuration issues.

#### Acceptance Criteria

1. WHEN a parser is not found during resolution, THE Assign_Gingerly SHALL throw an error message containing the parser name
2. THE error message SHALL suggest checking that the parser is registered in the correct be-hive scope
3. WHEN parser loading times out, THE Mount_Observer SHALL log an error listing all missing parser names
4. THE error message SHALL suggest checking parser-name attributes and script order
5. WHEN an EMC_Parser_Script fails to load, THE Mount_Observer SHALL log an error containing the src attribute value

### Requirement 12: Backward Compatibility with Inline Parsers

**User Story:** As a developer, I want inline parser functions to continue working, so that existing code doesn't break.

#### Acceptance Criteria

1. WHEN a parser specification is a function, THE Assign_Gingerly SHALL use it directly without registry lookup
2. THE Assign_Gingerly SHALL support inline parser functions in AttrConfig.parser field
3. WHEN an inline parser is provided, THE Assign_Gingerly SHALL NOT require synthesizer element context

### Requirement 13: Parser Module Loading

**User Story:** As a developer, I want parser modules to be loaded as ES modules, so that they benefit from browser caching and standard module semantics.

#### Acceptance Criteria

1. WHEN an EMC_Parser_Script is processed, THE Mount_Observer SHALL use dynamic import() to load the Parser_Module
2. THE browser SHALL cache the Parser_Module according to standard ES module caching rules
3. WHEN multiple EMC_Parser_Scripts reference the same src, THE browser SHALL reuse the cached module
4. THE Parser_Module SHALL be loaded asynchronously without blocking other script processing

### Requirement 14: Parser Registry Initialization

**User Story:** As a framework developer, I want synthesizer elements to automatically initialize their parser registry, so that parser registration works immediately.

#### Acceptance Criteria

1. WHEN a synthesizer element is created, THE Synthesizer_Element SHALL initialize an empty Scoped_Registry
2. THE Scoped_Registry SHALL be stored as a property on the synthesizer element instance
3. WHEN getParserRegistry is called on a synthesizer element without a registry, THE Assign_Gingerly SHALL create and attach a new Scoped_Registry
4. THE Scoped_Registry SHALL persist for the lifetime of the synthesizer element

### Requirement 15: Parser Pretty Printer for Round-Trip Testing

**User Story:** As a developer, I want parsers to have corresponding pretty printers, so that I can verify round-trip correctness.

#### Acceptance Criteria

1. WHERE a parser is registered for a complex format, THE Parser_Module SHOULD export a prettyPrint function
2. THE prettyPrint function SHALL have signature `(v: any) => string`
3. FOR ALL valid parsed values, parsing then pretty printing then parsing SHALL produce an equivalent value
4. THE Scoped_Registry SHALL support registering pretty printers alongside parsers
