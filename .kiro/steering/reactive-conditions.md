---
inclusion: auto
fileMatchPattern: "MountObserver.ts|*Observer.ts|*Query.ts"
---

# Reactive Condition Implementation Pattern

## Core Principle

**All reactive conditions (where*, with*Matching) must evaluate their initial state immediately and mount/dismount elements accordingly. Users should not have to wait for conditions to change to see if elements should mount from the get-go.**

## Implementation Requirements

When implementing a new reactive condition (one that can change over time), you MUST:

1. **Evaluate Initial State**: Check the condition immediately when the observer is set up
2. **Return Initial State**: Return the initial condition result so MountObserver can decide whether to process elements
3. **Set Up Reactive Monitoring**: Establish the observer/listener to watch for changes
4. **Handle State Changes**: Mount/dismount elements when the condition changes

## Pattern Examples

### Media Query Pattern (withMediaMatching)
```typescript
// 1. Create MediaQueryList
const mediaQueryList = window.matchMedia(query);

// 2. Check initial state
let mediaMatches = mediaQueryList.matches;

// 3. Set up change listener
mediaQueryList.addEventListener('change', (e) => {
    if (e.matches && !previousMatches) {
        // Mount elements
    } else if (!e.matches && previousMatches) {
        // Dismount elements
    }
});

// 4. Return initial state
return { mediaMatches, cleanup };
```

### Container Query Pattern (whereObservedRootSizeMatches)
```typescript
// 1. Get root element
const rootElement = getRootElement(rootNode);

// 2. Evaluate initial condition
let conditionMatches = evaluateContainerQuery(rootElement, query);

// 3. Set up ResizeObserver
const resizeObserver = new ResizeObserver((entries) => {
    const previousMatches = conditionMatches;
    conditionMatches = evaluateContainerQuery(entry.target, query);
    
    if (conditionMatches && !previousMatches) {
        // Mount elements
    } else if (!conditionMatches && previousMatches) {
        // Dismount elements
    }
});

resizeObserver.observe(rootElement);

// 4. Return initial state
return { conditionMatches, cleanup };
```

### Intersection Observer Pattern (whereElementIntersectsWith)
```typescript
// 1. Create IntersectionObserver
const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            // Mount element
        } else {
            // Dismount element
        }
    }
}, options);

// 2. Initial state is handled automatically
// When intersectionObserver.observe(element) is called,
// the callback fires immediately with the initial intersection state

// 3. Return observer for element observation
return { intersectionObserver, cleanup };
```

## Integration with MountObserver

The MountObserver's `observe()` method must:

1. Set up all reactive conditions BEFORE processing elements
2. Check all condition states before initial processing
3. Only process elements if ALL conditions are met

```typescript
// Set up all observers
if (this.#init.withMediaMatching) {
    await this.#setupMediaQuery();
}
if (this.#init.whereObservedRootSizeMatches) {
    await this.#setupRootSizeObserver();
}
if (this.#init.whereElementIntersectsWith) {
    await this.#setupElementIntersection();
}

// Process elements only if all conditions match
if (this.#mediaMatches && this.#rootSizeMatches) {
    this.#processNode(rootNode);
}
```

## Why This Matters

- **User Experience**: Elements should mount immediately if conditions are already met
- **Performance**: Avoids unnecessary delays waiting for condition changes
- **Predictability**: Behavior is consistent whether conditions are met initially or later
- **Lazy Loading**: Critical for lazy loading scenarios where elements need to mount on page load

## Testing Checklist

When implementing a new reactive condition, verify:

- [ ] Initial state is evaluated immediately
- [ ] Elements mount on page load if condition is met
- [ ] Elements mount when condition becomes true
- [ ] Elements dismount when condition becomes false
- [ ] Multiple conditions work together (AND logic)
- [ ] Cleanup properly disconnects observers
