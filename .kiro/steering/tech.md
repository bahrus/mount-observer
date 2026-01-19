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
