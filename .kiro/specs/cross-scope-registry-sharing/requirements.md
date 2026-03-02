# Requirements: Cross-Scope Registry Sharing

## Feature Name
`cross-scope-registry-sharing`

## Overview
Enable custom elements to share their definitions across scoped custom element registries, allowing elements defined in one shadow DOM scope to be automatically registered in other scopes that need them.

## Problem Statement

With scoped custom element registries (Chrome 146+, Safari), each shadow root can have its own isolated registry. This creates a challenge:

1. A custom element defined in Shadow Root A cannot be used in Shadow Root B without manually re-registering it
2. Manually tracking and registering shared elements across scopes is error-prone
3. There's no declarative way to indicate "this element should be available in other scopes"

## User Stories

### Story 1: Component Library Sharing
**As a** web component library author  
**I want** to mark certain components as "shareable" across scopes  
**So that** consumers can use them in any shadow root without manual registration

**Acceptance Criteria:**
- Components can be marked with an attribute to indicate they should be shared
- The component definition is automatically available in other scopes
- No manual registration code is needed by consumers

### Story 2: Micro-Frontend Architecture
**As a** micro-frontend developer  
**I want** shared utility components to work across different micro-frontend boundaries  
**So that** I can maintain consistent UI elements without duplicating registrations

**Acceptance Criteria:**
- Utility components defined in one micro-frontend are available in others
- Each micro-frontend maintains its own scoped registry
- Shared components are registered on-demand when encountered

### Story 3: Design System Components
**As a** design system maintainer  
**I want** core design system components to be automatically available everywhere  
**So that** teams can use them without worrying about registry scope issues

**Acceptance Criteria:**
- Design system components are marked as globally shareable
- Components work in any shadow root that needs them
- Registration happens automatically and efficiently

## Functional Requirements

### FR1: Definition Publisher (Handler 1)
**Requirement:** Provide a handler that identifies and publishes shareable custom element definitions

**Behavior:**
1. Match elements with a "share" attribute (name TBD) that have a dash in their localName
2. Wait for the element's definition to be registered in its own registry
3. Retrieve the constructor from the element's registry
4. Publish the definition to a shared registry service
5. Support multiple elements being marked as shareable

**Attribute Name Options:**
- `share-definition` (recommended)
- `cross-registry`
- `registry-share`
- `export-definition`

**Example:**
```html
<my-button share-definition></my-button>
<my-input share-definition></my-input>
```

### FR2: Definition Consumer (Handler 2)
**Requirement:** Provide a handler that automatically registers shared definitions in new scopes

**Behavior:**
1. Detect elements from different registries than the observed root -- they don't have to be custom elements
~~2. Check if the element's tag name has a shared definition available~~
3. If the element's registry doesn't have this definition, register it
4. Track processed registries to avoid duplicate work
5. Listen for new shared definitions and apply them to known registries

**Example:**
```html
<!-- In a different custom element registry -->
<my-custom-element>
    #shadow
    
</my-custom-element> <!-- Auto-registers my-button constructor in my-custom-element's custom element registry -->
```

This is done *just in case* my-custom-element wants to reuse my-button inside its shadow DOM, for example.

### FR3: Shared Definition Registry Service
**Requirement:** Provide a centralized service for storing and retrieving shared definitions

**Behavior:**
1. Store tag name → constructor mappings
2. Emit events when new definitions are published
3. Allow querying for all available shared definitions
4. Support multiple publishers and consumers
5. Maintain singleton instance across the application.   

**API:**
```typescript
interface SharedDefinitionRegistry {
    publish(tagName: string, constructor: CustomElementConstructor): void;
    get(tagName: string): CustomElementConstructor | undefined;
    getAll(): Map<string, CustomElementConstructor>;
    addEventListener(type: 'definition-shared', listener: EventListener): void;
}
```

### FR4: Automatic Registration
**Requirement:** Definitions should be registered automatically without manual intervention

**Behavior:**
1. When a consumer handler encounters an undefined element from a different registry
2. Check the shared registry for a matching definition
3. If found, register it in the element's registry
4. If not found, do nothing (element may be defined later)
5. Avoid re-registering if already defined

### FR5: Lazy Registration
**Requirement:** Only register definitions in registries that actually need them

**Behavior:**
1. Don't pre-register all shared definitions in all registries
2. Only register when an element with that tag name is encountered
3. Track which registries have been processed for each tag name
4. Minimize unnecessary registry operations

## Non-Functional Requirements

### NFR1: Performance
- Publishing a definition should be O(1)
- Checking for shared definitions should be O(1)
- Registry tracking should use WeakMap to avoid memory leaks
- Minimal overhead when feature is not used

### NFR2: Memory Management
- Use WeakMap for registry tracking to allow garbage collection
- Don't hold strong references to custom element registries
- Clean up event listeners when observers disconnect

### NFR3: Error Handling
- Handle cases where `customElementRegistry` is undefined (pre-Chrome 146)
- Handle cases where `whenDefined` never resolves
- Handle duplicate registrations gracefully
- Provide clear error messages for debugging

### NFR4: Browser Compatibility
- Gracefully degrade in browsers without scoped registry support
- Don't break existing functionality in older browsers
- Detect feature availability before attempting to use it

## Edge Cases & Constraints

### EC1: Element Not Yet Defined
**Scenario:** Element has `share-definition` but isn't defined yet  
**Behavior:** Wait for `whenDefined()` to resolve before publishing

### EC2: Multiple Elements Same Tag
**Scenario:** Multiple elements with same tag name have `share-definition`  
**Behavior:** Only publish once per tag name (first wins)

### EC3: Registry Without Support
**Scenario:** Browser doesn't support `customElementRegistry` property  
**Behavior:** Handlers should no-op gracefully, log warning if needed

### EC4: Circular Dependencies
**Scenario:** Component A shares definition, Component B in different scope also shares  
**Behavior:** Both should be published independently, no circular issues

### EC5: Definition Already Exists
**Scenario:** Consumer tries to register but definition already exists in target registry  
**Behavior:** Skip registration, no error (idempotent operation)

### EC6: Global Registry Elements
**Scenario:** Element with `share-definition` is in global registry (no scoped registry)  
**Behavior:** Still publish to shared registry for consistency

### EC7: Dynamic Element Creation
**Scenario:** Elements with `share-definition` are added dynamically  
**Behavior:** MountObserver should detect and process them normally

### EC8: Registry Garbage Collection
**Scenario:** A shadow root with a scoped registry is removed from DOM  
**Behavior:** WeakMap allows registry to be garbage collected

## Open Questions

1. **Attribute Name:** Which attribute name should we use?
   - Recommendation: `share-definition` -- agreed

2. **Handler Names:** What should the built-in handler names be?
   - Recommendation: `builtIns.shareDefinition` and `builtIns.importSharedDefinitions` -- agreed

3. **Automatic vs Explicit:** Should the consumer handler be:
   - Automatically enabled when using `whereDifferentCustomElementRegistry`?  No, have to specify that handler as part of the "do" array of strings.
   - Or explicitly enabled via a separate observer?  The do property supports multiple built-ins, so can be the same observer
   - Recommendation: Explicit - ~~user creates two observers~~  User should be able to list both built-ins in the do: property -- we should confirm that works

4. **Scope of Sharing:** Should we support:
   - Only explicitly marked elements (current proposal)? Yes
   - All elements from a registry?
   - Recommendation: Only explicit marking for safety -- agreed

5. **Timing:** What if consumer encounters element before publisher has processed it?
   - Recommendation: Consumer subscribes to future publications, retries on new definitions

6. **Unsharing:** Should there be a way to "unshare" or revoke a definition?
   - Recommendation: No for v1, can add later if needed -- agreed

## Success Criteria

1. ✅ Elements marked with share attribute are published to shared registry
2. ✅ Elements from different registries automatically get shared definitions
3. ✅ No manual registration code needed by consumers
4. ✅ Works across multiple shadow roots with different registries
5. ✅ Gracefully handles browsers without scoped registry support
6. ✅ No memory leaks from registry tracking
7. ✅ Clear documentation and examples
8. ✅ Comprehensive test coverage

## Out of Scope (Future Enhancements)

- Versioning of shared definitions
- Namespace/prefix support for avoiding conflicts
- Selective sharing (only to specific registries)
- Definition revocation/unsharing
- Cross-document sharing (iframes)
- Lazy loading of shared component code
