# Memory Management in MountObserver v2

## The Problem

When a `MountObserver` instance observes a DOM node (especially shadow roots or detached fragments), storing a strong reference to that node can cause memory leaks:

```typescript
// ❌ Strong reference - memory leak risk
class MountObserver {
    #rootNode: Node | undefined;
    
    observe(rootNode: Node): void {
        this.#rootNode = rootNode;  // Strong reference
    }
}
```

**Leak scenario**:
1. Observer is created and observes a shadow root
2. Shadow root is removed from document
3. Observer instance is still referenced somewhere (e.g., in a closure, global registry)
4. **Result**: Entire DOM subtree stays in memory because observer holds strong reference

## The Solution: WeakRef

```typescript
// ✅ Weak reference - no memory leak
class MountObserver {
    #rootNode: WeakRef<Node> | undefined;
    
    observe(rootNode: Node): void {
        this.#rootNode = new WeakRef(rootNode);
        // Use rootNode directly here while in scope
        this.#processNode(rootNode);
    }
    
    #someMethod(): void {
        const rootNode = this.#rootNode?.deref();
        if (!rootNode) {
            // Node was garbage collected - handle gracefully
            return;
        }
        // Safe to use rootNode here
    }
}
```

## How WeakRef Works

**WeakRef** creates a weak reference that doesn't prevent garbage collection:

```
Strong reference:  Observer → Node → DOM subtree (prevents GC)
Weak reference:    Observer ⇢ Node → DOM subtree (allows GC)
```

When the node is no longer referenced elsewhere, it can be garbage collected even though the observer still exists.

## Implementation Pattern

### 1. Store as WeakRef
```typescript
#rootNode: WeakRef<Node> | undefined;
```

### 2. Create WeakRef on observe
```typescript
observe(rootNode: Node): void {
    this.#rootNode = new WeakRef(rootNode);
    // Use rootNode directly here (still in scope)
    this.#mutationObserver.observe(rootNode, options);
}
```

### 3. Dereference when needed
```typescript
#handleMatch(element: Element): void {
    const rootNode = this.#rootNode?.deref();
    if (!rootNode) {
        // Gracefully handle GC'd node
        return;
    }
    // Use rootNode safely
}
```

## Benefits

1. **Prevents memory leaks** - DOM can be GC'd even if observer lives on
2. **Graceful degradation** - Can detect when node is GC'd and handle appropriately
3. **Minimal overhead** - WeakRef is lightweight
4. **Best practice** - Follows pattern used by platform APIs like MutationObserver

## When to Use WeakRef

Use WeakRef for:
- ✅ Observed DOM nodes (root nodes, shadow roots)
- ✅ Cached DOM elements that might be removed
- ✅ Any long-lived object holding DOM references

Don't use WeakRef for:
- ❌ Elements you're actively processing (use strong refs in local scope)
- ❌ Elements in WeakSet/WeakMap (already weak)
- ❌ Short-lived references

## Real-World Impact

### Without WeakRef
```javascript
// Create observer for shadow root
const observer = new MountObserver({...});
observer.observe(shadowRoot);

// Store observer globally
window.myObserver = observer;

// Remove shadow root from DOM
hostElement.shadowRoot = null;

// ❌ Shadow root + entire subtree still in memory!
```

### With WeakRef
```javascript
// Same scenario
const observer = new MountObserver({...});
observer.observe(shadowRoot);
window.myObserver = observer;
hostElement.shadowRoot = null;

// ✅ Shadow root can be garbage collected
// Observer gracefully handles deref() returning undefined
```

## Testing Memory Leaks

To verify WeakRef prevents leaks:

```javascript
// Create and observe
const observer = new MountObserver({...});
const div = document.createElement('div');
observer.observe(div);

// Remove all other references
div = null;

// Force GC (in dev tools)
// Check: observer.#rootNode.deref() should return undefined
```

## Comparison with v1

Both v1 and v2 use WeakRef for the root node, following the same memory-safe pattern. This is a critical design decision that prevents common memory leak scenarios in DOM observation libraries.
