# Design: Cross-Scope Registry Sharing

## Overview

This design implements a system for sharing custom element definitions across scoped custom element registries using two coordinated handlers and a shared registry service.

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Publisher       │              │  Consumer        │         │
│  │  MountObserver   │              │  MountObserver   │         │
│  │                  │              │                  │         │
│  │  do: 'builtIns.  │              │  do: 'builtIns.  │         │
│  │  shareDefinition'│              │  importShared    │         │
│  │                  │              │  Definitions'    │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                    │
│           │ observes                        │ observes           │
│           ▼                                 ▼                    │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │ Elements with   │              │ Elements with   │          │
│  │ share-definition│              │ different       │          │
│  │ attribute       │              │ registries      │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                 │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            │ publishes                       │ subscribes & queries
            ▼                                 ▼
   ┌────────────────────────────────────────────────────┐
   │     SharedDefinitionRegistry (Singleton)           │
   │                                                     │
   │  - Map<tagName, constructor>                       │
   │  - EventTarget for 'definition-shared' events      │
   │  - publish(tagName, constructor)                   │
   │  - get(tagName)                                    │
   │  - getAll()                                        │
   └────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. SharedDefinitionRegistry (Singleton Service)
- **Purpose:** Central registry for storing and broadcasting shared custom element definitions
- **Lifecycle:** Created on first use, persists for application lifetime
- **Storage:** Map of tag names to constructors
- **Communication:** EventTarget for broadcasting new definitions

#### 2. ShareDefinitionHandler (Publisher)
- **Purpose:** Identifies elements marked for sharing and publishes their definitions
- **Triggers:** Elements with `share-definition` attribute and dash in localName
- **Actions:** Waits for definition, retrieves constructor, publishes to shared registry

#### 3. ImportSharedDefinitionsHandler (Consumer)
- **Purpose:** Registers shared definitions in registries that need them
- **Triggers:** Elements with different customElementRegistry than observed root
- **Actions:** Registers all shared definitions in the element's registry

## Detailed Component Design

### 1. SharedDefinitionRegistry Service

**File:** `SharedDefinitionRegistry.ts`

**Purpose:** Singleton service managing shared custom element definitions

**Key Methods:**
- `getInstance()` - Get singleton instance
- `publish(tagName, constructor)` - Add definition to registry
- `get(tagName)` - Retrieve specific definition
- `getAll()` - Get all definitions as Map
- `has(tagName)` - Check if definition exists

**Implementation Notes:**
- Extends EventTarget for event-based communication
- Uses Map for O(1) lookups
- Dispatches 'definition-shared' event on new publications
- Idempotent publishing (ignores duplicates)

### 2. ShareDefinitionHandler (Publisher)

**File:** `handlers/ShareDefinition.ts`

**Static Properties:**
- `matching = '[share-definition]'`
- `whereLocalNameMatches = /-/` (must have dash)

**Behavior:**
1. Constructor receives element with share-definition attribute
2. Gets element's customElementRegistry (or falls back to global)
3. Waits for `registry.whenDefined(tagName)`
4. Retrieves constructor via `registry.get(tagName)`
5. Publishes to SharedDefinitionRegistry

**Error Handling:**
- Handles missing customElementRegistry (pre-Chrome 146)
- Logs warnings for missing definitions
- Catches whenDefined() rejections

### 3. ImportSharedDefinitionsHandler (Consumer)

**File:** `handlers/ImportSharedDefinitions.ts`

**Static Properties:**
- `matching = '*'` (all elements)
- `whereDifferentCustomElementRegistry = true`

**Static State:**
- `#processedRegistries` - WeakSet tracking processed registries
- `#eventListenerAdded` - Boolean flag for one-time setup

**Behavior:**
1. Constructor receives element with different registry
2. Checks if registry already processed (WeakSet)
3. If new registry:
   - Marks as processed
   - Gets all shared definitions
   - Registers each definition in the registry
4. Sets up event listener for future definitions (once)

**Error Handling:**
- Handles missing customElementRegistry
- Gracefully handles registration failures
- Checks for existing definitions before registering

## Data Flow Diagrams

### Publishing Flow
```
Element Added
    ↓
MountObserver Detects
    ↓
ShareDefinitionHandler Created
    ↓
await registry.whenDefined(tagName)
    ↓
constructor = registry.get(tagName)
    ↓
SharedDefinitionRegistry.publish(tagName, constructor)
    ↓
Event 'definition-shared' Dispatched
```

### Consuming Flow
```
Element Added (different registry)
    ↓
MountObserver Detects
    ↓
ImportSharedDefinitionsHandler Created
    ↓
Check WeakSet (processed?)
    ↓
If Not Processed:
    ├─ Mark as Processed
    ├─ Get All Shared Definitions
    └─ For Each Definition:
        ├─ Check if Exists
        └─ Register if Missing
```

## Timing Scenarios

### Scenario A: Publisher Before Consumer ✅
```
Time 1: <my-button share-definition> → Published
Time 2: <my-element> (different registry) → Imports my-button
Result: Works perfectly
```

### Scenario B: Consumer Before Publisher ⚠️
```
Time 1: <my-element> (different registry) → No definitions yet
Time 2: <my-button share-definition> → Published
Result: my-element's registry doesn't get my-button
Mitigation: Set up publishers before consumers
```

### Scenario C: Multiple Consumers ✅
```
Time 1: <my-button share-definition> → Published
Time 2: <element-a> (registry A) → Imports my-button
Time 3: <element-b> (registry B) → Imports my-button
Result: Both registries get the definition
```

## Memory Management

### WeakSet for Registry Tracking
```typescript
static #processedRegistries = new WeakSet<CustomElementRegistry>();
```

**Benefits:**
- Registries can be garbage collected
- No manual cleanup needed
- No memory leaks

**Limitation:**
- Cannot iterate to apply new definitions to old registries

### Event Listener Strategy
- Single static listener per handler class
- Never removed (intentionally permanent)
- No memory leak (singleton + static)

## Error Handling Strategy

| Error Condition | Handler Behavior |
|----------------|------------------|
| Missing customElementRegistry | Fall back to global or no-op |
| whenDefined() never resolves | Try/catch, log error, return |
| Definition not found | Log warning, return |
| Registration failure | Catch, log debug message |
| Duplicate registration | Check first, skip if exists |

## Browser Compatibility

### Chrome 146+ / Safari (with scoped registries)
- ✅ Full functionality
- Uses element.customElementRegistry
- Supports scoped registries

### Older Browsers
- ✅ Graceful degradation
- Publisher uses global customElements
- Consumer no-ops (no different registries)
- No errors thrown

## Performance Analysis

### Time Complexity
- `publish()` - O(1)
- `get()` - O(1)
- `has()` - O(1)
- `#importDefinitions()` - O(n) where n = number of shared definitions
  - Only runs once per registry

### Space Complexity
- SharedDefinitionRegistry: O(d) where d = number of definitions
- processedRegistries: O(r) where r = number of registries (WeakSet)

### Optimization: Batch Registration
Register ALL shared definitions when encountering a new registry, rather than one-by-one. This minimizes registry operations.

## Example Usage

### Basic Setup
```javascript
import { MountObserver } from 'mount-observer';

// Publisher observer
const publisher = new MountObserver({
    do: 'builtIns.shareDefinition'
});
publisher.observe(document);

// Consumer observer
const consumer = new MountObserver({
    do: 'builtIns.importSharedDefinitions'
});
consumer.observe(document);
```

### HTML Usage
```html
<!-- Mark component as shareable -->
<my-button share-definition>Click me</my-button>

<!-- Use in different shadow root -->
<my-app>
    #shadow-root (scoped registry)
    <my-button>Auto-registered!</my-button>
</my-app>
```

### Programmatic Usage
```javascript
class MyApp extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ 
            mode: 'open',
            registry: new CustomElementRegistry()
        });
        
        // my-button auto-registered here
        shadow.innerHTML = '<my-button>Works!</my-button>';
    }
}
```

## Design Decisions

### Decision 1: Singleton Registry
**Chosen:** Single global SharedDefinitionRegistry  
**Rationale:** Simplifies communication, ensures consistency  
**Alternative:** Multiple registries with namespacing  
**Trade-off:** Less flexibility, but simpler implementation

### Decision 2: WeakSet for Tracking
**Chosen:** WeakSet<CustomElementRegistry>  
**Rationale:** Allows garbage collection, prevents memory leaks  
**Alternative:** Map with manual cleanup  
**Trade-off:** Cannot iterate, but better memory management

### Decision 3: Batch Registration
**Chosen:** Register all definitions when encountering new registry  
**Rationale:** Minimizes registry operations, simpler logic  
**Alternative:** Register on-demand per element  
**Trade-off:** May register unused definitions, but more efficient overall

### Decision 4: Two Separate Observers
**Chosen:** Publisher and consumer use separate MountObserver instances  
**Rationale:** Different static properties (matching criteria)  
**Alternative:** Single observer with array of handlers  
**Trade-off:** More setup code, but clearer separation of concerns

## Open Design Questions

1. **Definition Removal:** Should we support unpublishing?
   - Current: No
   - Decision: Not needed for v1

2. **Registry Tracking:** Should we track all registries for future definitions?
   - Current: WeakSet prevents iteration
   - Decision: Simpler approach, users set up publishers first

3. **Constructor Validation:** Should we validate before publishing?
   - Current: No validation
   - Decision: Trust the registry

4. **Namespacing:** Should we support prefixes/namespaces?
   - Current: Global tag names
   - Decision: Not needed, tag names already namespaced

## Future Enhancements

1. Definition versioning
2. Selective sharing (specific registries only)
3. Lazy loading of component code
4. Cross-document sharing (iframes)
5. Registry introspection API
