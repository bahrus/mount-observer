# Technology Stack

## Language & Build System

- **Primary Language**: TypeScript (compiled to JavaScript ES modules)
- **Target**: ESNext with strict mode enabled
- **Module System**: ES Modules (ESM)
- **No Build Tool**: TypeScript compiler only, no bundler (Webpack, Rollup, etc.)

## TypeScript Configuration

- Strict mode enabled
- Experimental decorators: false
- Source maps: disabled
- Line endings: LF (Unix-style)
- Skip lib check: true

## Testing

- **Test Framework**: Playwright (browser automation testing)
- **Test Files**: Located in `tests/` directory with `.spec.mjs` extension
- **HTML Test Files**: Corresponding `.html` files for each test spec

## Dependencies

- **Runtime**: None (zero runtime dependencies)
- **Dev Dependencies**: 
  - `@playwright/test` - Browser testing
  - `spa-ssi` - Development server

## Common Commands

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Start development server
npm run serve

# Run Safari browser tests
npm run safari

# Update dependencies
npm run update
```

## Compilation

TypeScript files are compiled to JavaScript using `tsc`. Both `.ts` and `.js` files are committed to the repository. The JavaScript files are the actual runtime artifacts.

## Type Definition Files

**Type-Only Files**: Files containing only TypeScript type definitions should use the `.d.ts` extension and must not generate a `.js` file when compiled.

**Key Rules**:
- Type definition files must end with `.d.ts` (e.g., `types.d.ts`)
- `.d.ts` files should contain only types, interfaces, and type aliases
- Never include runtime values (constants, functions, classes) in `.d.ts` files
- Constants and runtime values belong in separate `.ts` files that compile to `.js`

**Pattern**:
```typescript
// types.d.ts - Type definitions only
export interface MountInit {
    whereElementMatches: string;
}
export type mountEventName = 'mount';

// constants.ts - Runtime values
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
```

**Why this matters**:
- Prevents unnecessary `.js` files from being generated for type-only code
- Keeps type definitions separate from runtime code
- Follows TypeScript best practices for library distribution
- Reduces bundle size by excluding type-only code from runtime

**When to apply**:
- Creating files that only contain TypeScript types, interfaces, or type aliases
- Separating type definitions from implementation
- Defining public API types for library consumers

## Custom Event Classes

**Event Classes over CustomEvent**: When dispatching events, define custom classes that extend the Event class rather than using CustomEvent with detail objects.

**Key Rules**:
- Create dedicated event classes that extend Event
- Define event properties as public class members
- Include a static eventName property for the event type string
- Export corresponding interfaces for type safety

**Pattern**:
```typescript
// Events.ts - Event class definitions
export class MountEvent extends Event implements IMountEvent {
    static eventName: mountEventName = 'mount';
    
    constructor(public matchingElement: Element, public modules: any[]) {
        super(MountEvent.eventName);
    }
}

// Usage in code
this.dispatchEvent(new MountEvent(element, modules));

// Listening with proper typing
observer.addEventListener('mount', (e: MountEvent) => {
    console.log(e.matchingElement, e.modules);
});
```

**Why this matters**:
- CustomEvent is a legacy approach that uses untyped detail objects
- Custom event classes provide better type safety and IDE autocomplete
- Properties are directly accessible without going through event.detail
- Follows modern JavaScript/TypeScript best practices
- Makes the API more discoverable and self-documenting

**When to apply**:
- All event dispatching in the library
- When defining public event APIs
- When you need strongly-typed event data

## Code Splitting Principle

**Conditional Code Loading**: If a significant block of code (>6 lines) only executes based on optional configuration settings, extract it to a separate module and load it dynamically using `import()`.

**Benefits**:
- Reduces initial bundle size for users who don't need the feature
- Improves tree-shaking effectiveness
- Keeps core modules lean and focused

**Example**:
```typescript
// Instead of including all import logic in MountObserver
async #loadImports(): Promise<void> {
    // Dynamically load only when MountInit.import is specified
    const { loadImports } = await import('./loadImports.js');
    this.#modules = await loadImports(this.#init.import);
}
```

**When to apply**:
- Feature-specific utilities (e.g., import loading, intersection observers)
- Complex conditional logic blocks
- Optional API surface areas
- Heavy dependencies used conditionally

## Memory Management

**WeakRef for DOM Nodes**: Store references to DOM nodes (especially observed root nodes) as `WeakRef<Node>` to prevent memory leaks when nodes are removed from the document.

**Why this matters**:
- If a MountObserver instance outlives the observed DOM subtree, a strong reference would prevent garbage collection
- Shadow roots and detached fragments are particularly vulnerable
- WeakRef allows the DOM to be GC'd even if the observer is still referenced

**Pattern**:
```typescript
class MountObserver {
    #rootNode: WeakRef<Node> | undefined;
    
    observe(rootNode: Node): void {
        this.#rootNode = new WeakRef(rootNode);
        // Use rootNode directly here while it's in scope
    }
    
    someMethod(): void {
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Node was garbage collected, handle gracefully
            return;
        }
        // Use rootNode
    }
}
```

**When to apply**:
- Storing references to observed DOM nodes
- Caching DOM elements that might be removed
- Any long-lived object holding DOM references

## Package Exports

The package uses conditional exports in package.json, providing both default (JS) and types (TS) for each module. Main entry point is `MountObserver.js`.

## Bare Specifier Imports & Import Maps

**Import Pattern for Node Dependencies**: This package uses bare specifiers with explicit `.js` extensions when importing from node_modules dependencies.

**Example**:
```typescript
import { assignGingerly } from 'assign-gingerly/index.js';
```

**Key Rules**:
- Always include the `.js` extension in bare specifier imports
- Use the full path including the file (e.g., `/index.js`)
- This works natively in browsers via import maps

**Import Map Setup**: The project uses server-side includes (SSI) to inject import maps into HTML files during development.

**Pattern**:
```html
<!-- In demo/test HTML files -->
<!-- #include virtual="/imports.html" -->
```

**What this does**:
- The `spa-ssi` development server (configured in `package.json` scripts) processes SSI directives
- The `imports.html` file at the project root contains the import map
- The import map maps bare specifiers to `/node_modules/` paths
- This enables native browser support for bare imports without bundling

**Import Map Structure** (`imports.html`):
```html
<script type=importmap>
{
    "imports": {
        "assign-gingerly/": "/node_modules/assign-gingerly/"
    }
}
</script>
```

**Benefits**:
- No build step required for development
- Native ES modules work directly in the browser
- Dependencies resolve naturally via import maps
- Matches production CDN patterns (e.g., unpkg, esm.sh)

**When to apply**:
- All imports from node_modules dependencies
- Demo and test HTML files need the SSI include directive
- Import map must be updated when adding new dependencies
