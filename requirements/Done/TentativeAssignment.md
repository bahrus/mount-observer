# Stage On Mount - Reversible Property Assignment

## Overview

MountObserver currently supports `assignOnMount` and `assignOnDismount`, which use `assignGingerly` to permanently assign properties to elements when they mount and dismount.

With the latest update of the assign-gingerly npm package, there is a new function `assignTentatively` that has the ability to automatically reverse its changes. This enables a simpler pattern for temporary property assignments that should be automatically undone when elements dismount.

## Feature: `stageOnMount`

### What It Does

`stageOnMount` applies properties to elements when they mount, and **automatically reverses those changes** when they dismount. Unlike `assignOnMount`/`assignOnDismount` which require you to specify both the mount and dismount behavior separately, `stageOnMount` handles both automatically.

**Key Characteristics:**
- Uses `assignTentatively` under the hood
- Tracks the original property values before assignment
- Automatically restores original values on dismount
- Single configuration - no need for separate mount/dismount configs
- Ideal for temporary state changes (disabled, hidden, className additions, etc.)

### Use Cases

**Good for `stageOnMount`:**
- Temporarily disabling elements: `stageOnMount: { disabled: true }`
- Adding temporary CSS classes: `stageOnMount: { className: 'loading' }`
- Temporarily hiding elements: `stageOnMount: { hidden: true }`
- Setting temporary ARIA states: `stageOnMount: { 'aria-busy': 'true' }`

**Better for `assignOnMount`/`assignOnDismount`:**
- Permanent enhancements that shouldn't be reversed
- Different values needed on mount vs dismount
- Complex state management requiring explicit control

### Example Usage

```javascript
// Temporary assignment - auto-reverses on dismount
const observer1 = new MountObserver({
    withMatching: 'button.async-action',
    stageOnMount: {
        disabled: true,
        'aria-busy': 'true',
        className: 'loading'
    }
});

// Permanent assignment - stays after dismount
const observer2 = new MountObserver({
    withMatching: 'input[data-enhanced]',
    assignOnMount: {
        className: 'enhanced',
        autocomplete: 'off'
    }
});

// Can use both together
const observer3 = new MountObserver({
    withMatching: 'form',
    assignOnMount: {
        noValidate: true  // Permanent enhancement
    },
    stageOnMount: {
        'aria-busy': 'true'  // Temporary while processing
    }
});
```

## Implementation Plan

### 1. Type Definitions (types.d.ts)

Add `stageOnMount` property to `MountConfig` interface:

```typescript
export interface MountConfig {
    withMatching: string;
    withInstance?: Constructor | Constructor[];
    withMediaMatching?: string | MediaQueryList;
    whereOutside?: string;
    import?: string | ImportSpec | Array<string | ImportSpec>;
    do?: string | DoCallback | (string | DoCallback)[];
    loadingEagerness?: 'eager' | 'lazy';
    assignOnMount?: Record<string, any>;
    assignOnDismount?: Record<string, any>;
    stageOnMount?: Record<string, any>;  // NEW
    getPlayByPlay?: boolean;
    mountedElemEmits?: EventConfig | EventConfig[];
    reference?: number | number[];
    customData?: unknown;
}
```

### 2. MountObserver Implementation (MountObserver.ts)

#### Add Private Field

```typescript
#stageMtSource: Record<string, any> | undefined;
#stageReversals = new WeakMap<Element, Record<string, any>>();  // Track reversal objects per element
```

#### Constructor Changes

```typescript
constructor(init: MountConfig, options: MountObserverOptions = {}) {
    super();
    this.#init = init;
    this.#options = options;
    this.#abortController = new AbortController();

    const {
        assignOnMount, 
        assignOnDismount, 
        stageOnMount,  // NEW
        do: doValue, 
        reference, 
        loadingEagerness,
        import: imp
    } = init;
    
    // Existing assignOnMount handling
    if (assignOnMount !== undefined) {
        this.#asgMtSource = structuredClone(assignOnMount);
    }
    
    // Existing assignOnDismount handling
    if (assignOnDismount !== undefined) {
        this.#asgDisMtSource = structuredClone(assignOnDismount);
    }
    
    // NEW: stageOnMount handling
    if (stageOnMount !== undefined) {
        this.#stageMtSource = structuredClone(stageOnMount);
    }
    
    // ... rest of constructor
}
```

#### observe() Method Changes

Import assign-gingerly if stageOnMount is configured:

```typescript
async observe(rootNode: Node): Promise<void> {
    if (this.#rootNode) {
        throw new Error('Already observing');
    }
    
    // Import assign-gingerly if any assignment feature is used
    if (this.#asgMtSource || this.#asgDisMtSource || this.#stageMtSource) {
        await import('assign-gingerly/object-extension.js');
    }
    
    // ... rest of observe method
}
```

#### #handleMatch() Method Changes

Apply `assignTentatively` when element mounts, capturing the reversal object:

```typescript
async #handleMatch(element: Element): Promise<void> {
    // ... existing code ...
    
    // Apply assignGingerly if specified (existing)
    if (this.#asgMtSource) {
        element.assignGingerly(this.#asgMtSource);
    }
    
    // NEW: Apply assignTentatively if specified
    if (this.#stageMtSource) {
        const reversal = {};
        element.assignTentatively(this.#stageMtSource, { reversal });
        this.#stageReversals.set(element, reversal);  // Store for later reversal
    }
    
    // ... rest of method ...
}
```

#### #handleRemoval() Method Changes

Reverse tentative assignments when element dismounts using the stored reversal object:

```typescript
async #handleRemoval(element: Element): Promise<void> {
    if (!this.#mountedElements.weakSet.has(element)) {
        return;
    }
    
    // NEW: Reverse tentative assignments first
    if (this.#stageMtSource) {
        const reversal = this.#stageReversals.get(element);
        if (reversal) {
            element.assignTentatively(reversal);  // Apply reversal to undo changes
            this.#stageReversals.delete(element);  // Clean up
        }
    }
    
    // Apply assignGingerly for dismount (existing)
    if (this.#asgDisMtSource) {
        element.assignGingerly(this.#asgDisMtSource);
    }
    
    // ... rest of method ...
}
```

### 3. Key Implementation Details

**Order of Operations on Mount:**
1. `assignGingerly` (permanent assignments)
2. `assignTentatively` (staged assignments)
3. `do` callbacks
4. Dispatch mount event

**Order of Operations on Dismount:**
1. Reverse `assignTentatively` (unstage)
2. `assignGingerly` for dismount (if configured)
3. Dispatch dismount event

**Memory Management:**
- `assignTentatively` generates a reversal object that captures original values
- MountObserver stores reversal objects in a WeakMap keyed by element
- Reversal objects are deleted when elements dismount
- WeakMap allows garbage collection when elements are removed from DOM

### 4. Testing Strategy

**Unit Tests:**
- Test that properties are applied on mount
- Test that properties are reversed on dismount
- Test that original values are restored correctly
- Test interaction with `assignOnMount`/`assignOnDismount`
- Test with dynamically added/removed elements
- Test with re-mounting elements (should re-stage)

**Test File:** `tests/test-stage-on-mount.html` and `tests/test-stage-on-mount.spec.mjs`

### 5. Documentation Updates

- Update README.md with `stageOnMount` examples
- Update API documentation in `.kiro/steering/api.md`
- Add comparison table: when to use `assignOnMount` vs `stageOnMount`

## Questions / Clarifications Needed

1. **Interaction with assignGingerly method**: Should the public `assignGingerly()` method also support staging? Or keep it separate?

2. **Multiple observers**: If two observers both use `stageOnMount` on the same element, how should conflicts be handled? (Likely: last one wins, both reverse independently)

3. **Re-mounting**: If an element dismounts and re-mounts, should it re-stage? (Likely: yes, treat as fresh mount)

4. **Error handling**: What if `assignTentatively` is not available (older version of assign-gingerly)? (Likely: throw clear error message)

Does this implementation plan align with your vision? Any adjustments needed?