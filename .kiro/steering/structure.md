# Project Structure

## Root Level Organization

```
mount-observer/
├── *.ts, *.js          # Core library files (dual TS/JS)
├── refid/              # Reference ID utilities
├── slotkin/            # Slot-related utilities
├── tests/              # Playwright test suites
├── demo/               # Demo HTML files
├── ts-refs/            # TypeScript type definitions
└── test-results/       # Test output artifacts
```

## Core Files Pattern

**Dual File System**: Every TypeScript source file has a corresponding JavaScript file committed alongside it:
- `MountObserver.ts` + `MountObserver.js`
- `Synthesizer.ts` + `Synthesizer.js`
- `bindish.ts` + `bindish.js`

The `.js` files are the compiled output and actual runtime artifacts.

## Key Modules

### Root Level
- `MountObserver.ts/js` - Main API entry point
- `Synthesizer.ts/js` - Element synthesis utilities
- `Newish.ts/js` - New element detection
- `ObsAttr.ts/js` - Attribute observation
- `RootMutObs.ts/js` - Root mutation observer
- `Events.ts/js` - Event handling utilities
- `bindish.ts/js` - Binding utilities
- `compose.ts/js` - Composition helpers
- `doCleanup.ts/js` - Cleanup utilities
- `waitForEvent.ts/js`, `waitForIsh.ts/js` - Async waiting utilities
- `upShadowSearch.ts/js` - Shadow DOM traversal

### refid/ Directory
Reference ID and element relationship utilities:
- `getContext.ts/js` - Context retrieval
- `genIds.ts/js` - ID generation
- `getAdjRefs.ts/js` - Adjacent reference lookup
- `joinMatching.ts/js` - Matching element joining
- `splitRefs.ts/js` - Reference splitting
- `itemprops.ts/js` - Item property handling
- `ism.ts/js`, `via.ts/js`, `arr.ts/js` - Helper utilities

### slotkin/ Directory
Slot and fragment manipulation:
- `beKindred.ts/js` - Kindred element handling
- `getFrag.ts/js` - Fragment retrieval
- `getBreadth.ts/js` - Breadth calculation
- `wrap.ts/js` - Element wrapping
- `affine.ts/js`, `toQuery.ts/js` - Query utilities

### tests/ Directory
Organized by feature area:
- `tests/ish/` - Core "ish" functionality tests
- `tests/refid/` - Reference ID tests
- `tests/mediaQuery/` - Media query tests
- `tests/intra/` - Intra-document tests
- `test*.html` + `test*.spec.mjs` - Root level test pairs

### ts-refs/ Directory
External TypeScript type definitions for related libraries (be-* ecosystem, trans-render, etc.). This is a git submodule or reference directory.

## File Naming Conventions

- **TypeScript sources**: camelCase (e.g., `MountObserver.ts`)
- **Test specs**: kebab-case with `.spec.mjs` extension
- **HTML demos/tests**: kebab-case with `.html` extension
- **Directories**: kebab-case (e.g., `test-results`)

## Import Patterns

- Use relative imports with `.js` extension (not `.ts`) in TypeScript files
- Example: `import {RootMutObs} from './RootMutObs.js';`
- Type imports from `./ts-refs/mount-observer/types`
