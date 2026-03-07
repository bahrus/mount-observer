# Mount Scope Options

The `element.mount()` method now supports a `scope` option that determines what part of the DOM tree to observe.

## Implementation

Added `scope` property to `MountObserverOptions`:

```TypeScript
export type MountScope = 
    | 'registry'     // getRootRegistryContainer (default)
    | 'self'         // this element
    | 'root'         // getRootNode()
    | 'shadow'       // shadowRoot (throws if none)
    | Element;       // custom element to observe

export interface MountObserverOptions {
    disconnectedSignal?: AbortSignal;
    scope?: MountScope;
}
```

## Usage

```JavaScript
// Default - observe registry container
await element.mount(config);

// Observe just this element
await element.mount(config, { scope: 'self' });

// Observe root node (document or shadow root)
await element.mount(config, { scope: 'root' });

// Observe element's shadowRoot
await element.mount(config, { scope: 'shadow' });

// Observe a specific custom element
await element.mount(config, { scope: someOtherElement });
```

## Benefits

- More flexible than path-like syntax (`'./'`, `'../'`, `'/'`)
- Descriptive names make intent clear
- Extensible for future scope types
- Optional parameter doesn't force passing empty options
- Allows passing custom elements for maximum flexibility

## Status

✅ Implemented and tested with comprehensive test coverage in `tests/test-mount-scope.html`

