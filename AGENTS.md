# Agent Guidance for mount-observer

This document summarizes the conventions, technology stack, API patterns, and historical feature specifications for working on the `mount-observer` repository. It consolidates the steering guidance previously maintained under `.kiro/steering/`. The feature specs under `.kiro/specs/` are included for reference but are believed to be out of date; treat the actual implementation, tests, and this file as the current source of truth.

## Project Overview

`mount-observer` is a zero-runtime-dependency JavaScript/TypeScript library that provides a `MountObserver` API for observing CSS matches in the DOM and executing lifecycle callbacks. It enables:

- Lazy loading of custom element definitions.
- CSS-based observation with mount/dismount lifecycle callbacks.
- Progressive enhancement and "binding from a distance".
- Conditional loading based on intersection, media queries, and container queries.
- Shadow DOM and scoped custom element registry support.

The package is published as ES modules with both JavaScript and TypeScript definitions.

## Technology Stack

- **Primary language**: TypeScript, compiled to JavaScript ES modules.
- **Target**: ESNext with strict mode enabled.
- **Module system**: ES Modules (ESM). No bundler is used.
- **Build tool**: TypeScript compiler only (`tsc`). No Webpack, Rollup, etc.
- **Test framework**: Playwright, with `.spec.mjs` specs and companion `.html` files in `tests/`.
- **Development server**: `spa-ssi`, which processes server-side include directives such as `<!-- #include virtual="/imports.html" -->`.
- **Runtime dependencies**: None.
- **Dev dependencies**: `@playwright/test`, `spa-ssi`.

### Common commands

```bash
npm ci      # Install dependencies
npm test    # Run tests
npm run serve   # Start development server
npm run safari  # Run Safari browser tests
npm run update  # Update dependencies
```

## Compilation Rules

- **Always compile with `tsc` using the project configuration.**
  ```bash
  tsc
  ```
- Do **not** run `tsc` with individual file arguments or custom flags. `tsconfig.json` is the source of truth.
- Both `.ts` and compiled `.js` files are committed to the repository. The `.js` files are the runtime artifacts.
- The `legacy/` directory contains old, unmaintained code. Do **not** expect it to compile or pass tests, and do **not** modify it.

## Project Structure

```
mount-observer/
├── *.ts, *.js          # Core library files (dual TS/JS)
├── handlers/           # Built-in MountObserver handlers
├── tests/              # Playwright test suites
├── demo/               # Demo HTML files
├── legacy/             # Old code — do not touch
├── ts-refs/            # External type definitions (git submodule/reference)
└── .kiro/              # Generated steering and spec documents
```

### Key root-level modules

- `MountObserver.ts/js` — Main API entry point.
- `Synthesizer.ts/js` — Element synthesis utilities.
- `Newish.ts/js` — New element detection.
- `ObsAttr.ts/js` — Attribute observation.
- `RootMutObs.ts/js` — Root mutation observer.
- `Events.ts/js` — Event handling utilities.
- `bindish.ts/js`, `compose.ts/js`, `doCleanup.ts/js` — Utility modules.
- `waitForEvent.ts/js`, `waitForIsh.ts/js` — Async waiting utilities.
- `upShadowSearch.ts/js` — Shadow DOM traversal.

### Subdirectories

- `handlers/` — Built-in handler implementations (`EMCScript`, `EMCParserScript`, `DefineCustomElement`, etc.).
- `tests/` — Playwright tests, organized by feature area and root-level `.html` + `.spec.mjs` pairs.
- `ts-refs/mount-observer/` — Legacy type definitions from an older version. **Do not modify or reference** these; they will be replaced by the current implementation.

### File naming conventions

- TypeScript sources: `PascalCase.ts` or `camelCase.ts`.
- Test specs: `kebab-case.spec.mjs`.
- HTML demos/tests: `kebab-case.html`.
- Directories: `kebab-case`.

## Coding Conventions

### Imports

- Use **relative imports with `.js` extension** in TypeScript files, even when importing TypeScript source:
  ```typescript
  import { RootMutObs } from './RootMutObs.js';
  ```
- Use bare specifiers with `.js` extension for `node_modules` dependencies:
  ```typescript
  import { assignGingerly } from 'assign-gingerly/assignGingerly.js';
  ```
- Bare-specifier imports are resolved at runtime via the import map in `imports.html`, injected by the SSI server.
- All documentation examples that import from `mount-observer` must use bare-specifier paths with `.js` file extension:
  ```typescript
  import { MountObserver } from 'mount-observer/MountObserver.js';
  import 'mount-observer/ElementMountExtension.js';
  ```

### Type-only files

Files containing only types, interfaces, or type aliases must use the `.d.ts` extension and must **not** generate a `.js` file when compiled.

- `.d.ts` files must contain only type-level constructs.
- Never include runtime values (constants, functions, classes) in `.d.ts` files.
- Keep runtime values in separate `.ts` files that compile to `.js`.

```typescript
// types.d.ts — type definitions only
export interface MountConfig {
    matching: string;
}
export type mountEventName = 'mount';

// constants.ts — runtime values
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
```

### Custom event classes

Define dedicated classes that extend `Event` instead of using `CustomEvent` with untyped `detail` objects.

- Create a class per event type.
- Expose event data as public class members.
- Include a static `eventName` property for the event type string.
- Export corresponding interfaces for type safety.

```typescript
export class MountEvent extends Event implements IMountEvent {
    static eventName: mountEventName = 'mount';

    constructor(public mountedElement: Element, public modules: any[]) {
        super(MountEvent.eventName);
    }
}
```

### Code splitting

If a significant block of code (more than ~6 lines) only executes based on optional configuration, extract it into a separate module and load it dynamically with `import()`.

```typescript
async #loadImports(): Promise<void> {
    const { loadImports } = await import('./loadImports.js');
    this.#modules = await loadImports(this.#init.import);
}
```

### Memory management

Store references to observed DOM nodes (especially root nodes) as `WeakRef<Node>` so that detached DOM subtrees can be garbage collected even if the observer instance survives.

```typescript
class MountObserver {
    #rootNode: WeakRef<Node> | undefined;

    observe(rootNode: Node): void {
        this.#rootNode = new WeakRef(rootNode);
    }

    someMethod(): void {
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) return;
        // use rootNode
    }
}
```

## API Conventions

### MountConfig `where*` conditions are ANDed

All `where*` properties in a `MountConfig` object form an AND condition. An element must satisfy **every** specified `where*` condition to mount.

```javascript
{
    matching: 'input, button',
    whereInstanceOf: HTMLInputElement
}
```
The above matches only elements that are **both** (`input` or `button`) **and** instances of `HTMLInputElement`.

### Built-in handlers

The library registers built-in handlers with `MountObserver.define()`:

- `builtIns.logToConsole`
- `builtIns.defineCustomElement`
- `builtIns.defineScopedCustomElement`
- `builtIns.enhanceMountedElement`
- `builtIns.scriptExport`
- `builtIns.mountObserverScript`

### Hierarchical composition with `with`

The `with` property defines sub-observers that observe the same root node as the parent.

- Sub-observers are created when the parent's `observe()` method is called.
- Sub-observers are disconnected when the parent disconnects.
- Sub-observers operate independently and **do not inherit** parent configuration.
- Each sub-observer can have its own `with` property for unlimited nesting.
- Access sub-observers in handlers via `context.withObservers[key]`.

```javascript
const observer = new MountObserver({
    matching: '.parent',
    with: {
        registry: { matching: 'my-element', do: 'builtIns.defineCustomElement' },
        styles: { import: './styles.css' }
    }
});
```

### Handler static defaults

Handler classes can define static properties that serve as default `MountConfig` values. When a handler is referenced by name in the `do` property, its static properties are merged with the inline configuration; inline values take precedence.

```typescript
class MyHandler extends EvtRt {
    static matching = 'script[nomodule][src]';
    static whereInstanceOf = HTMLScriptElement;
}

MountObserver.define('myHandler', MyHandler);

// Uses the handler's static defaults
new MountObserver({ do: 'myHandler' });

// Overrides static matching, keeps static whereInstanceOf
new MountObserver({ matching: 'script.special', do: 'myHandler' });
```

### MountContext

Handlers receive a `MountContext` object:

- `modules`: array of modules loaded via the `import` property.
- `observer`: reference to the observer instance.
- `rootNode`: the observed root node (document, shadow root, or element).
- `mountConfig`: the observer's configuration object (camelCase property name).
- `withObservers`: map of sub-observers, present only when `with` is configured.

## Reactive Conditions Implementation Pattern

Applies when working in `MountObserver.ts`, `*Observer.ts`, or `*Query.ts` files.

All reactive conditions (any `where*` or `with*Matching` property that can change over time) must:

1. **Evaluate initial state immediately** when the observer is set up.
2. **Return the initial condition result** so `MountObserver` can decide whether to process elements.
3. **Set up reactive monitoring** (listeners, observers, etc.).
4. **Mount/dismount elements** when the condition changes.

`MountObserver.observe()` must set up all reactive conditions **before** processing elements and only process elements when **all** conditions are met.

### Testing checklist for reactive conditions

- [ ] Initial state is evaluated immediately.
- [ ] Elements mount on page load if the condition is met.
- [ ] Elements mount when the condition becomes true.
- [ ] Elements dismount when the condition becomes false.
- [ ] Multiple conditions work together (AND logic).
- [ ] Cleanup properly disconnects observers/listeners.

## Historical Feature Specifications

The `.kiro/specs/` directory contains generated requirements, designs, and task plans from earlier planning. **These specs are likely out of date.** Use them only as background reading; the running code, current type definitions, and tests are authoritative.

| Feature | Location | Affected areas |
|---------|----------|----------------|
| Scoped parser registry | `.kiro/specs/scoped-parser-registry/` | `handlers/EMCParserScript.ts`, `handlers/EMCScript.ts`, `Synthesizer.ts`, integration with `assign-gingerly` |
| `with` / sub-observer support | `.kiro/specs/support-for-with/` | `MountObserver.ts`, `MountContext`, `MountConfig` types |
| `configFrom` module imports | `.kiro/specs/config-from-module-import/` | `MountObserver.ts`, `types/mount-observer/types.d.ts` |
| Remove `where` attribute support | `.kiro/specs/remove-where-attr-support/` | Condition-matching APIs |
| Rename `whereElementMatches` | `.kiro/specs/rename-where-element-matches/` | Condition property naming |
| Rollback enhancement config | `.kiro/specs/rollback-enhancement-config/` | Enhancement configuration handling |

When modifying files historically covered by these specs, verify behavior against the current implementation and tests rather than assuming the spec still applies.

## Critical Do's and Don'ts

- Do use `tsc` (project-wide) to compile TypeScript.
- Do include `.js` extensions on all module imports.
- Do put runtime values in `.ts` files, not `.d.ts` files.
- Do use `WeakRef<Node>` for long-lived DOM references.
- Do define custom `Event` subclasses instead of `CustomEvent`.
- Don't modify files in `legacy/`.
- Don't modify or reference files in `ts-refs/mount-observer/`.
- Don't use `tsc` with per-file arguments or custom flags.
