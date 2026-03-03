# Experimental Cross-Scope Registry Sharing

This folder contains an experimental implementation of cross-scope custom element registry sharing that was deemed too complex for the main codebase.

## Contents

### Implementation Files
- `SharedDefinitionRegistry.ts/js` - Singleton service for sharing definitions
- `ShareDefinition.ts/js` - Handler that publishes definitions with `share-definition` attribute
- `ImportSharedDefinitions.ts/js` - Handler that imports shared definitions into different registries

### Test Files
- `test-shared-definition-registry.*` - Unit tests for SharedDefinitionRegistry
- `test-share-definition-handler.*` - Unit tests for ShareDefinition handler (PASSING)
- `test-import-shared-definitions-handler.*` - Unit tests for ImportSharedDefinitions handler
- `test-cross-scope-registry-sharing.*` - Integration tests

### Documentation
- `cross-scope-registry-sharing/` - Full spec with requirements, design, and tasks
- `cross-scope-registry-sharing.html` - Demo file

## Status

The ShareDefinition handler is fully functional and tested. The ImportSharedDefinitions handler is implemented but requires complex integration testing with actual scoped custom element registries (Chrome 146+ feature).

## Restoration

To restore this implementation:

1. Move the `.ts` and `.js` files back to their original locations:
   - `SharedDefinitionRegistry.*` → root
   - `ShareDefinition.*` → `handlers/`
   - `ImportSharedDefinitions.*` → `handlers/`

2. Move test files back to `tests/`

3. Move demo file back to `demo/`

4. Move spec folder back to `.kiro/specs/`

5. Update `index.ts`:
   - Add exports for the handlers and SharedDefinitionRegistry
   - Add imports for side-effect registration

6. Update documentation:
   - Add to README.md Implementation Status
   - Add Cross-Scope Registry Sharing section to README.md
   - Update `.kiro/steering/api.md` with handler descriptions

7. Remove the `testIgnore` line from `playwright.config.ts` to re-enable the tests

8. Compile TypeScript: `npx tsc`

## Original Requirements

See `cross-scope-registry-sharing/requirements.md` for the original requirements that drove this implementation.
