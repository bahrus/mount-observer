# Support for shouldMount

Since calls to the do method are only called once when all checks are fulfilled, it is useful to provide the developer the ability to add a custom JavaScript check outside the do action.

## Type Definition

```TypeScript
export type ShouldMountCallback<TKeys extends string = string> = (
    mountedElement: Element, 
    context: MountContext<TKeys>
) => boolean;

export interface MountConfig<TKeys extends string = string> {
    /**
     * Custom JavaScript check that runs after all declarative where* conditions pass.
     * This is the final gate before mounting occurs.
     * 
     * @returns true to allow mounting, false to prevent it
     */
    shouldMount?: ShouldMountCallback<TKeys>;
}
```

## Behavior

1. **Call Order**: `shouldMount` is always the very last check, executed only after all declarative `where*` AND conditions have passed.

2. **Return Value**:
   - If `shouldMount` returns `true`: The `do` callback is called and the `mount` event dispatches.
   - If `shouldMount` returns `false`: The element is not mounted. No `do` callback, no `mount` event.

3. **Error Handling**:
   - If `shouldMount` throws an error, it is treated as returning `false`.
   - The error is logged to the console for debugging.
   - The element is not mounted.

4. **Re-evaluation**: 
   - `shouldMount` is called once per element per mount attempt.
   - If it returns `false`, the element will only be re-evaluated if:
     - The element is removed from the DOM and re-added, OR
     - One of the `where*` conditions changes (e.g., media query match changes)

## Use Cases

- **Authorization**: Check if user has permission to interact with element
- **Feature Flags**: Only mount when features are enabled
- **Data Validation**: Ensure required data attributes exist
- **Complex Conditions**: Logic too complex for declarative `where*` properties
- **A/B Testing**: Mount based on experiment groups
- **Runtime State**: Check application state before mounting

## Examples

### Basic Permission Check

```javascript
const observer = new MountObserver({
    matching: '.admin-panel',
    shouldMount: (el) => {
        return currentUser.hasRole('admin');
    },
    do: (el) => {
        enhanceAdminPanel(el);
    }
});
```

### Data Validation

```javascript
const observer = new MountObserver({
    matching: '[data-api-endpoint]',
    shouldMount: (el) => {
        // Only mount if required data attributes are present
        return el.dataset.apiEndpoint && 
               el.dataset.apiKey && 
               el.dataset.apiKey.length > 0;
    },
    do: (el) => {
        initializeApiClient(el);
    }
});
```

### Feature Flag Check

```javascript
const observer = new MountObserver({
    matching: '.new-feature',
    shouldMount: (el) => {
        const feature = el.dataset.feature;
        return featureFlags.isEnabled(feature);
    },
    do: (el) => {
        enhanceNewFeature(el);
    }
});
```

### Complex Conditional Logic

```javascript
const observer = new MountObserver({
    matching: '.contextual-widget',
    shouldMount: (el, ctx) => {
        // Check parent context
        const parent = el.closest('[data-context]');
        if (!parent) return false;
        
        // Check if context is active
        const isActive = parent.dataset.context === 'active';
        
        // Check if widget is enabled for this context
        const widgetType = el.dataset.widgetType;
        const enabledWidgets = parent.dataset.enabledWidgets?.split(',') || [];
        
        return isActive && enabledWidgets.includes(widgetType);
    },
    do: (el) => {
        initializeWidget(el);
    }
});
```

## Event-Driven Mounting

For scenarios where you want to wait for user interaction (like button clicks) before mounting, use the `do` callback with event listeners rather than `shouldMount`:

```javascript
// ❌ Don't use shouldMount for waiting on events
{
    matching: '.form-section',
    shouldMount: (el) => {
        // This won't work - shouldMount should be a synchronous check
        return el.querySelector('button[data-clicked]') !== null;
    }
}

// ✅ Instead, use do callback with event listeners
{
    matching: '.form-section',
    do: (el) => {
        const submitBtn = el.querySelector('button[type=submit]');
        submitBtn.addEventListener('click', () => {
            // Perform action on click
            enhanceForm(el);
        }, { once: true });
    }
}

// ✅ Or coordinate multiple observers
{
    matching: 'button[type=submit]',
    do: (btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.form-section')?.setAttribute('data-ready', '');
        }, { once: true });
    }
}
{
    matching: '.form-section[data-ready]',
    do: (el) => {
        enhanceForm(el);
    }
}
```

## Future Consideration: Async Support

Async `shouldMount` callbacks (returning `Promise<boolean>`) could be added in the future for use cases like:
- Checking remote feature flags via API
- Validating against a remote service
- Loading configuration asynchronously before mounting

However, `shouldMount` should remain a **check**, not a **wait**. For event-driven mounting scenarios, use the `do` callback with event listeners or coordinate multiple observers as shown above.