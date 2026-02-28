# Mutually Assured Observing

## Problem Analysis

The current implementation has a limitation: when multiple DOM "islands" share the same `customElementRegistry`, calling `element.mount()` on one island only observes that specific island's shoreline. Other islands with the same registry remain unobserved, even though developers would reasonably expect all elements sharing a registry to be subject to the same mounting rules.

**Example scenario from TestOfScope.html:**
```javascript
const reg2 = new CustomElementRegistry();
const div2 = document.createElement('div', {customElementRegistry: reg2});
const div4 = document.createElement('div', {customElementRegistry: reg2});
const div5 = cloneNode(template, {customElementRegistry: reg2});

// div2, div4, and div5 all share reg2 but are in different subtrees
// Currently, mounting on div2 won't observe div4 or div5
```

## Phase I

## Definition of Registry Root and Registry Scope

The function `getRegistryRoot()` takes a node and finds the highest-level 
containing node that has a matching customElementRegistry property.

A DOM Node `n` is called a **Registry Root** if `n === getRegistryRoot(n)`.

The **Registry Scope** corresponding to that root is all nodes inside the 
root that aren't registry roots of other registries or anything inside such roots. Think "Donut Hole Scoping".  All elements in a registry scope share the same customElementRegistry.

# Phase II

**Status**: ✅ Implemented

Given that we aren't (by default) really observing the passed in node of mountObserverInstance.observe(node), but rather observing various nodes relative to the passed in node, does it make sense to rename observe to something else?

## Recommendation: Keep `observe()` as the method name

**Implementation completed:**
- ✅ Parameter renamed from `rootNode` to `anchorNode` in method signature
- ✅ JSDoc added to explain the anchor concept
- ✅ Type definitions updated (`types/mount-observer/types.d.ts`)
- ✅ README documentation added explaining the observe method and anchorNode parameter
- ✅ All internal references updated in `MountObserver.ts`

**Reasons to keep `observe()`:**

1. **Semantic accuracy**: The method IS observing - just potentially multiple nodes or scopes relative to the passed node. The node parameter acts as an "anchor" or "context" for determining what to observe.

2. **Platform consistency**: Other observer APIs use `observe()`:
   - `MutationObserver.observe(target, options)`
   - `IntersectionObserver.observe(target)`
   - `ResizeObserver.observe(target)`
   
   Even though these observers may internally track multiple things, the method is still called `observe()`.

3. **Mental model**: Developers think "I want to observe this node/scope" - the method name matches that intent. The fact that it might observe related nodes is an implementation detail.

4. **Backward compatibility**: Changing the name would be a breaking change for existing code.

**Alternative considered: `observeScope()`**
- Pro: More explicit about observing a scope rather than just the node
- Con: Verbose, and "scope" might be confused with JavaScript scope
- Con: Breaking change

**Alternative considered: `watch()`**
- Pro: Shorter, still conveys the intent
- Con: Less consistent with platform observer APIs
- Con: Breaking change

**Recommendation**: Keep `observe()` and make the behavior clear through:
1. Documentation explaining that the node parameter defines the observation scope
2. The `scope` option in `MountObserverOptions` makes it explicit what's being observed
3. JSDoc comments on the method
4. **Consider renaming the parameter from `rootNode` to `anchorNode`** to better reflect its role

```typescript
/**
 * Begins observing elements within the scope determined by the provided node.
 * 
 * @param anchorNode - The node that anchors the observation scope. Depending on the
 *                     configured scope option, this may observe:
 *                     - The node itself ('self')
 *                     - The node's registry root ('registryRoot')
 *                     - All islands sharing the node's registry ('registry')
 *                     - The node's shadow root ('shadow')
 *                     - The node's root node ('root')
 */
async observe(anchorNode: Node): Promise<void>
```

**Why "anchorNode" is better than "rootNode":**

1. **Accuracy**: The parameter isn't necessarily the root of what's being observed - it's the reference point for determining the scope
2. **Clarity**: "anchor" clearly conveys that this node is used to locate/determine what to observe
3. **Avoids confusion**: "rootNode" suggests it's the actual root being observed, which isn't always true
4. **Semantic precision**: An anchor is a fixed point used for navigation/reference, which is exactly what this parameter does

**Implementation note**: This would be a parameter name change in the method signature, which is technically a breaking change for code that uses named parameters (though JavaScript doesn't have those). However, since it's just a parameter name in the implementation, it wouldn't break any existing code that calls `observe(someNode)`.

The name `observe()` is semantically correct and consistent with web platform conventions, and `anchorNode` better describes the parameter's role.



## Phase III

ElementMountExtension.ts adds a method to the Element prototype, 'mount', that, by default, searches for the shoreline containing the element, and starts monitoring that node for matching elements to mount.  That is if the default option of 'registry' is selected.

But here's the thing:  The scoped custom element registry feature allows for multiple "islands" of nodes that share the same customElementRegistry, as demonstrated by /demo/TestOfScope.html

To my knowledge, we don't have a way for one island to automatically notify other islands that share the same customElementRegistry.  However, I think it is reasonable to expect that a developer would want all instances of elements that share the same registry to be subject to the same mounting observations.

I'm thinking that we add another category to MountScope that should be the default value:  'customElementRegistry'.  When we add a mount observer, that customElementRegistry maintains a registry of "mountRegistries'.

In support of that idea, we need an API of some sort an element to say "I'm here, please find my registry root, add all the joint mountObservers to start observing my scope, and if a mountObserver is added withMountScope 'customElementRegistry' with my root, it should apply to all the other islands as well. 


## Implementation Strategy



### Proposed Solution

#### 1. Add 'customElementRegistry' MountScope (New Default)

Update `MountScope` type to include a new option and rename an existing one:
```typescript
export type MountScope = 
    | 'registry'       // NEW: Observe all islands with matching registry (new default)
    | 'registryRoot'   // was the default
    | 'self'           // this element
    | 'root'           // getRootNode()
    | 'shadow'         // shadowRoot
    | Element;
```

#### 2. Registry-Level Mount Config Registry

#### Prior Art

Polyfill package assign-gingerly/object-extension defines a property on the new CustomElementRegistry prototype:  'enhancementRegistry':

```JavaScript
if (typeof CustomElementRegistry !== 'undefined') {
  Object.defineProperty(CustomElementRegistry.prototype, 'enhancementRegistry', {
    get: function () {
      // Create a new EnhancementRegistry instance on first access and cache it
      const registry = new EnhancementRegistry();
      // Replace the getter with the actual value
      Object.defineProperty(this, 'enhancementRegistry', {
        value: registry,
        writable: true,
        enumerable: false,
        configurable: true,
      });
      return registry;
    },
    enumerable: false,
    configurable: true,
  });
}
```

where EnhancementRegistry is defined in assignGingerly.ts:

```TypeScript
 */
export class EnhancementRegistry {
    ...
}
```

#### New Registry Category

For this requirement, we create a similar registry for Mount Observer Configurations in ElementMountExtension:

```TypeScript
export class MountConfigRegistry extends EventTarget {
  #items: MountConfig[] = [];

  push(items: MountConfig | MountConfig[]): void {
    if (Array.isArray(items)) {
      this.#items.push(...items);
    } else {
      this.#items.push(items);
    }
  }
  ...
}

if (typeof CustomElementRegistry !== 'undefined') {
  Object.defineProperty(CustomElementRegistry.prototype, 'mountConfigRegistry', {
    get: function () {
      // Create a new EnhancementRegistry instance on first access and cache it
      const registry = new MountConfigRegistry();
      // Replace the getter with the actual value
      Object.defineProperty(this, 'mountConigRegistry', {
        value: registry,
        writable: true,
        enumerable: false,
        configurable: true,
      });
      return registry;
    },
    enumerable: false,
    configurable: true,
  });
}
```

#### Map:  CustomElementRegistry + MountConfig + Shoreline => MountObserver Instance

Our goal is that every combination of:

1.  customElementRegistry 
2.  + mountConfig in that registry
3.  + shoreline matching that registry

should, ideally, have one MountObserver instance where the value of this.#root that it is monitoring is the shoreline.

The term "ideally" is there because each island needs an "opt-in" from the developer, as the platform doesn't have a way of auto discovering new islands.

Create the following mappings:

#### [TODO]  Please update this section at will

```typescript
// In a new file: RegistryMountCoordinator.ts
const registryMountObservers = new WeakMap<CustomElementRegistry, Set<MountObserver>>();

export function registerMountObserver(registry: CustomElementRegistry, observer: MountObserver): void {
    const observers = registryMountObservers.getOrInsert(registry, () => new Set());
    observers.add(observer);
}

export function unregisterMountObserver(registry: CustomElementRegistry, observer: MountObserver): void {
    const observers = registryMountObservers.get(registry);
    if (observers) {
        observers.delete(observer);
        if (observers.size === 0) {
            registryMountObservers.delete(registry);
        }
    }
}

export function getMountObserversForRegistry(registry: CustomElementRegistry): Set<MountObserver> {
    return registryMountObservers.get(registry) || new Set();
}
```

####



#### 3. Island Registration API

Add a method for elements to announce their presence and activate all registry-scoped observers:

```typescript
// Add to Element.prototype
interface Element {
    registerIsland(): void;
}

Element.prototype.registerIsland = function(): void {
    const registry = (this as any).customElementRegistry;
    if (!registry) return;
    
    // Find the root of this island
    const islandRoot = getRootRegistryContainer(this);
    if (!islandRoot) return;
    
    // Get all observers registered for this registry
    const observers = getMountObserversForRegistry(registry);
    
    // Start observing this island with each registry-scoped observer
    for (const observer of observers) {
        if (observer.scope === 'customElementRegistry') {
            observer.observeAdditionalRoot(islandRoot);
        }
    }
};
```

#### 4. Multi-Root Support in MountObserver

Extend `MountObserver` to support observing multiple root nodes:

```typescript
class MountObserver extends EventTarget {
    #rootNodes: Set<WeakRef<Node>> = new Set();  // Changed from single to multiple
    #mutationCallbacks = new WeakMap<Node, MutationCallback>();
    #scope: MountScope;
    
    async observe(rootNode: Node): Promise<void> {
        // Store the scope for later reference
        if (this.#scope === 'customElementRegistry') {
            const registry = (rootNode as any).customElementRegistry;
            if (registry) {
                registerMountObserver(registry, this);
            }
        }
        
        // Add to set of observed roots
        this.#rootNodes.add(new WeakRef(rootNode));
        
        // Set up mutation observer for this root
        // ... existing logic but per-root
    }
    
    async observeAdditionalRoot(rootNode: Node): Promise<void> {
        // Check if already observing this root
        for (const ref of this.#rootNodes) {
            if (ref.deref() === rootNode) return;
        }
        
        // Add this root to the observation set
        this.#rootNodes.add(new WeakRef(rootNode));
        
        // Set up mutation observer for this root
        // ... similar to observe() but for additional roots
    }
    
    disconnect(): void {
        // Unregister from registry if scope is 'customElementRegistry'
        if (this.#scope === 'customElementRegistry') {
            for (const ref of this.#rootNodes) {
                const rootNode = ref.deref();
                if (rootNode) {
                    const registry = (rootNode as any).customElementRegistry;
                    if (registry) {
                        unregisterMountObserver(registry, this);
                    }
                }
            }
        }
        
        // Disconnect all roots
        for (const ref of this.#rootNodes) {
            const rootNode = ref.deref();
            if (rootNode) {
                const callback = this.#mutationCallbacks.get(rootNode);
                if (callback) {
                    unregisterSharedObserver(rootNode, callback);
                }
            }
        }
        
        this.#rootNodes.clear();
        // ... rest of cleanup
    }
}
```

#### 5. Update ElementMountExtension

Update the default scope and handle the new 'customElementRegistry' option:

```typescript
Object.defineProperty(Element.prototype, 'mount', {
    value: async function <T extends Element>(
        this: T,
        config: MountConfig, 
        options: MountObserverOptions = {}
    ): Promise<T> {
        const scope = options.scope ?? 'customElementRegistry';  // NEW DEFAULT
        let thingToObserve: Node;
        
        if (scope === 'customElementRegistry') {
            // Find this element's island root
            const registryContainer = getRootRegistryContainer(this);
            if (!registryContainer) {
                throw new Error('Could not find root registry container');
            }
            thingToObserve = registryContainer;
            
            // The MountObserver will register itself with the registry
            // and automatically observe other islands when they call registerIsland()
        } else if (scope === 'registry') {
            // ... existing logic
        }
        // ... rest of existing logic
        
        const mo = new MountObserver(config, {...options, scope});
        await mo.observe(thingToObserve);
        return this;
    },
    // ...
});
```

### Usage Pattern

```javascript
// Island 1
const reg2 = new CustomElementRegistry();
const div2 = document.createElement('div', {customElementRegistry: reg2});
div2.id = 'div2';
document.body.append(div2);

// Set up observer on island 1 - will observe all islands with reg2
await div2.mount({
    matching: '.my-element',
    do: (el) => console.log('Mounted:', el.id)
});

// Island 2 (created later)
const div4 = document.createElement('div', {customElementRegistry: reg2});
div4.id = 'div4';
document.body.append(div4);

// Announce this island's presence - will activate all reg2 observers
div4.registerIsland();

// Now .my-element elements in div4 will also be observed!
```

### Benefits

1. **Automatic coordination**: All islands sharing a registry automatically share mount observers
2. **Backward compatible**: Existing code using 'registry' scope continues to work
3. **Opt-in for new islands**: New islands call `registerIsland()` to join the observation network
4. **Memory efficient**: Uses WeakMap/WeakRef to avoid memory leaks
5. **Clean separation**: Registry coordination logic is separate from core MountObserver

### Edge Cases to Handle

1. **Registry cleanup**: When all islands with a registry are removed, clean up the registry's observer set
2. **Observer lifecycle**: Ensure observers are properly removed when disconnected
3. **Race conditions**: Handle cases where `registerIsland()` is called before any observers exist
4. **Performance**: Multiple roots means multiple mutation observers - ensure SharedMutationObserver handles this efficiently
