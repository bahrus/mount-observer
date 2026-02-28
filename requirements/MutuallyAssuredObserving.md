# Mutually Assured Observing

## Problem Analysis

The current implementation has a limitation: when multiple DOM "scopes" share the same `customElementRegistry`, calling `element.mount()` on one scope only observes that specific scope's shoreline. Other scopes with the same registry remain unobserved, even though developers would reasonably expect all elements sharing a registry to be subject to the same mounting rules.

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

## Decision: Keep `observe()` method name, rename parameter to `observedNode`

**Implementation completed:**
- ✅ Parameter renamed from `rootNode` to `observedNode` in method signature
- ✅ JSDoc updated to clarify that this IS the node being observed
- ✅ Type definitions updated (`types/mount-observer/types.d.ts`)
- ✅ README documentation updated with clearer explanation
- ✅ All internal references updated in `MountObserver.ts`

**Clarification on initial misunderstanding:**

The `observe()` method DOES directly observe the node passed to it. When called on a `MountObserver` instance, the `observedNode` parameter is exactly what gets observed - it's where the mutation observer is registered and where matching elements are searched for.

The confusion arose from the `element.mount()` convenience method, which uses the `scope` option to determine WHICH node to pass to `observe()`. But `observe()` itself always directly observes whatever node is passed to it.

**Why `observedNode` is the best name:**
1. **Accuracy**: This IS the node being observed by the mutation observer
2. **Clarity**: No ambiguity - it's the observed node
3. **Simplicity**: Direct and straightforward naming

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
 * @param observedNode - The node that anchors the observation scope. Depending on the
 *                     configured scope option, this may observe:
 *                     - The node itself ('self')
 *                     - The node's registry root ('registryRoot')
 *                     - All scopes sharing the node's registry ('registry')
 *                     - The node's shadow root ('shadow')
 *                     - The node's root node ('root')
 */
async observe(observedNode: Node): Promise<void>
```

**Why "anchorNode" is better than "rootNode":**

1. **Accuracy**: The parameter isn't necessarily the root of what's being observed - it's the reference point for determining the scope
2. **Clarity**: "anchor" clearly conveys that this node is used to locate/determine what to observe
3. **Avoids confusion**: "rootNode" suggests it's the actual root being observed, which isn't always true
4. **Semantic precision**: An anchor is a fixed point used for navigation/reference, which is exactly what this parameter does

**Implementation note**: This would be a parameter name change in the method signature, which is technically a breaking change for code that uses named parameters (though JavaScript doesn't have those). However, since it's just a parameter name in the implementation, it wouldn't break any existing code that calls `observe(someNode)`.

The name `observe()` is semantically correct and consistent with web platform conventions, and `anchorNode` better describes the parameter's role.



## Phase III

ElementMountExtension.ts adds a method to the Element prototype, 'mount', that, by default, searches for the registryRoot containing the element, and starts monitoring that node for matching elements to mount.  That is if the default option of 'registryRoot' is selected.

But here's the thing:  The scoped custom element registry feature allows for multiple copes of nodes that share the same customElementRegistry, as demonstrated by /demo/TestOfScope.html

To my knowledge, we don't have a way for one scope to automatically notify other scopes that share the same customElementRegistry.  However, I think it is reasonable to expect that a developer would want all instances of elements that share the same registry to be subject to the same mounting observations.

I'm thinking that we add another category to MountScope that should be the default value:  'registry'.  

In support of that idea, we need an API of some sort an element to say "I'm here, please find my registry root, add all the joint registry-scoped observers to start observing my scope, and if a mountObserver is added withMountScope 'customElementRegistry' with my root, it should apply to all the other scopes as well. 


## Implementation Strategy



### Proposed Solution

#### 1. Add 'registry' MountScope (New Default)

Update `MountScope` type to include a new option:
```typescript
export type MountScope = 
    | 'registry'       // NEW: Observe all scopes with matching registry (new default)
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
  #items: Set<MountConfig> = new Set();

  get items(){
    return Array.from(this.#items);
  }

  push(items: MountConfig | MountConfig[]): void {
    ...
  }
  ...
}

if (typeof CustomElementRegistry !== 'undefined') {
  Object.defineProperty(CustomElementRegistry.prototype, 'mountConfigRegistry', {
    get: function () {
      // Create a new EnhancementRegistry instance on first access and cache it
      const registry = new MountConfigRegistry();
      // Replace the getter with the actual value
      Object.defineProperty(this, 'mountConfigRegistry', {
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

#### Map:  CustomElementRegistry + MountConfig + Registry Root => MountObserver Instance

Our goal is that every combination of:

1.  customElementRegistry 
2.  + mountConfig in that registry
3.  + registry root

should, ideally, have one MountObserver instance where the value of this.#root that it is monitoring is the registry root.

The term "ideally" is there because each registry scope needs an "opt-in" from the developer, as the platform doesn't have a way of auto discovering new scopes.

Create the following mappings:

#### Mappings

We need mappings to coordinate mount observers across registry scopes. Since each `MountObserver` instance can only observe one node, we need one observer per (registry + config + registry root) combination.

**Key Design Decision: Use MountConfig Object Identity as Key**

Instead of serializing configs or requiring developer-provided GUIDs, we use the `MountConfig` object itself as the Map key. This leverages JavaScript's natural object identity semantics.

**Benefits:**
- No serialization complexity or performance overhead
- No GUID management burden on developers
- Works naturally with functions and non-serializable values in configs
- Explicit and predictable: same object = shared observer, different object = separate observer
- Encourages good pattern: define config once, reuse across scopes

**Usage Pattern:**
```javascript
// Define config once
const sharedConfig = {
    matching: '.my-element',
    do: (el) => console.log('Mounted:', el)
};

// scope 1 - uses sharedConfig object
await div2.mount(sharedConfig, { scope: 'registry' });

// scope 2 - reuses same sharedConfig object
await div4.registerScope();  
// ^ Creates new observer for div4 using sharedConfig
```

```typescript
// In a new file: RegistryMountCoordinator.ts

import type { MountConfig, WeakDual } from './types/mount-observer/types.js';
import type { MountObserver } from './MountObserver.js';

/**
 * Represents a single MountObserver observing a specific registry root.
 */
type ObserverEntry = {
    config: MountConfig;  // Store for reference
    registryRootRef: WeakRef<Node>;
    observer: MountObserver;
};

/**
 * Maps CustomElementRegistry -> Map<MountConfig, WeakMap<Node, ObserverEntry>>
 * The MountConfig object itself is used as the key (object identity).
 * The innermost WeakMap maps registry root nodes to their observer entries.
 */
const registryObservers = new WeakMap<
    CustomElementRegistry, 
    Map<
        MountConfig, 
        WeakMap<Node, ObserverEntry>
    >
>();

/**
 * Tracks all registry root nodes for each CustomElementRegistry.
 * Used to iterate over all scopes when a new config is added.
 */
const registryScopes = new WeakMap<
    CustomElementRegistry, 
    WeakDual<Node>
>();

// Note: assignGingerly.ts already has a polyfill for getOrInsertComputed.
// If this code will already have imported assignGingerly, then no need for the duplicate polyfill below.

// Polyfill for Map.prototype.getOrInsertComputed and WeakMap.prototype.getOrInsertComputed
if (typeof Map.prototype.getOrInsertComputed !== 'function') {
  Map.prototype.getOrInsertComputed = function(key, insert) {
    if (this.has(key)) return this.get(key);
    const value = insert();
    this.set(key, value);
    return value;
  };
}
if (typeof WeakMap.prototype.getOrInsertComputed !== 'function') {
  WeakMap.prototype.getOrInsertComputed = function(key, insert) {
    if (this.has(key)) return this.get(key);
    const value = insert();
    this.set(key, value);
    return value;
  };
}

/**
 * Helper to create an observer entry asynchronously.
 * Separated to handle async operations cleanly.
 */
async function createObserverEntry(
    config: MountConfig,
    registryRoot: Node
): Promise<ObserverEntry> {
    // Dynamically import to avoid circular dependency
    const { MountObserver: MountObserverClass } = await import('./MountObserver.js');
    const observer = new MountObserverClass(config);
    await observer.observe(registryRoot);
    return {
        config,
        registryRootRef: new WeakRef(registryRoot),
        observer
    };
}

/**
 * Get or create a mount observer for a specific registry + config + registry root combination.
 * This function ensures that:
 * 1. The config is registered with the registry's mountConfigRegistry
 * 2. An observer exists for this specific registry root
 * 3. All other registry roots with the same registry get observers for this config
 * 4. All other configs get observers for this registry root
 * 
 * @returns The ObserverEntry for the requested combination
 */
export async function getOrInsertObserverEntry(
    registry: CustomElementRegistry, 
    config: MountConfig,
    registryRoot: Node
): Promise<ObserverEntry> {
    // Add config to the registry's config list (if not already there)
    registry.mountConfigRegistry.push(config);
    
    // Get or create the nested map structure
    const mountConfigMap = registryObservers.getOrInsertComputed(registry, () => new Map());
    const nodeToObserverMap = mountConfigMap.getOrInsertComputed(config, () => new WeakMap());
    
    // Get or create the observer for this specific registry root
    let observerEntry = nodeToObserverMap.get(registryRoot);
    if (!observerEntry) {
        observerEntry = await createObserverEntry(config, registryRoot);
        nodeToObserverMap.set(registryRoot, observerEntry);
    }
    
    // Track this registry root in the scopes set
    const scopes = registryScopes.getOrInsertComputed(registry, () => ({
        weakSet: new WeakSet<Node>(),
        setWeak: new Set<WeakRef<Node>>()
    }));
    
    // Add to tracking sets if not already present
    if (!scopes.weakSet.has(registryRoot)) {
        scopes.weakSet.add(registryRoot);
        scopes.setWeak.add(new WeakRef(registryRoot));
    }
    
    // Get all configs for this registry
    const configs = registry.mountConfigRegistry.items;
    
    // Iterate over all known registry roots for this registry
    const arr = Array.from(scopes.setWeak);
    for (const regRootRef of arr) {
        const regRoot = regRootRef.deref();
        if (regRoot === undefined) continue;
        
        // For each config, ensure an observer exists for this registry root
        for (const conf of configs) {
            // Skip if this is the same config + root we just created
            if (conf === config && registryRoot === regRoot) continue;
            
            // Get or create observer for this conf + regRoot combination
            // This won't cause infinite loop because we only create if missing
            const confObserverMap = mountConfigMap.getOrInsertComputed(conf, () => new WeakMap());
            let existingEntry = confObserverMap.get(regRoot);
            if (!existingEntry) {
                existingEntry = await createObserverEntry(conf, regRoot);
                confObserverMap.set(regRoot, existingEntry);
            }
        }
    }
    
    return observerEntry;
}

// [TODO]  Don't worry about unregistering mount observers for now.  For a later phase

/**
 * Unregister a mount observer for a specific registry root.
 */
// export function unregisterMountObserver(
//     registry: CustomElementRegistry, 
//     observer: MountObserver
// ): void {
//     const observersByRegistry = registryObservers.get(registry);
//     if (!observersByRegistry) return;
    
//     // Find and remove the entry for this observer across all configs
//     for (const [config, entries] of observersByRegistry) {
//         const index = entries.findIndex(entry => entry.observer === observer);
//         if (index !== -1) {
//             entries.splice(index, 1);
            
//             // If no more entries for this config, remove the config key
//             if (entries.length === 0) {
//                 observersByRegistry.delete(config);
//             }
//             break;
//         }
//     }
    
//     // If no more configs for this registry, remove the registry entry
//     if (observersByRegistry.size === 0) {
//         registryObservers.delete(registry);
//     }
// }

// [TODO]  We'll worry about garbage collection later.

// /**
//  * Cleanup: Remove any entries where the registry root has been garbage collected.
//  */
// export function cleanupGarbageCollectedRoots(): void {
//     for (const observersByRegistry of registryObservers.values()) {
//         for (const entries of observersByRegistry.values()) {
//             // Filter out entries with dead WeakRefs
//             for (let i = entries.length - 1; i >= 0; i--) {
//                 if (entries[i].registryRoot.deref() === undefined) {
//                     entries.splice(i, 1);
//                 }
//             }
//         }
//     }
// }
```

### Key Design Decisions:

1. **MountConfig as Map key**: Uses object identity - same object = shared observer, different object = separate observer

2. **One observer per root**: Since `MountObserver` can only observe one node, we create separate instances for each registry root, even if they share the same config

3. **WeakRef for roots**: Registry roots are stored as WeakRefs to prevent memory leaks

4. **Nested Map structure**: `WeakMap<Registry, Map<Config, Entry[]>>` allows efficient lookup by both registry and config

5. **getOrInsert helper**: Temporary helper function until `Map.prototype.getOrInsert()` becomes available in browsers

### Alternative Simpler Approach:

If we don't need to automatically apply existing configs to new scopes, we can simplify to just track observers:

```typescript
// Simpler version: Just track all observers per registry
const registryObservers = new WeakMap<CustomElementRegistry, Set<MountObserver>>();

export function registerMountObserver(registry: CustomElementRegistry, observer: MountObserver): void {
    const observers = registryObservers.getOrInsert(registry, () => new Set());
    observers.add(observer);
}

export function unregisterMountObserver(registry: CustomElementRegistry, observer: MountObserver): void {
    const observers = registryObservers.get(registry);
    if (observers) {
        observers.delete(observer);
        if (observers.size === 0) {
            registryObservers.delete(registry);
        }
    }
}

export function getMountObserversForRegistry(registry: CustomElementRegistry): Set<MountObserver> {
    return registryObservers.get(registry) || new Set();
}

export function getActiveConfigsForRegistry(registry: CustomElementRegistry): MountConfig[] {
    const observers = getMountObserversForRegistry(registry);
    const configs: MountConfig[] = [];
    
    for (const observer of observers) {
        // Access observer's config (would need to expose this)
        configs.push(observer.config);
    }
    
    return configs;
}
```

**Recommendation**: Use the simpler approach. When `registerScope()` is called, it can:
1. Get all active configs for the registry
2. Create new `MountObserver` instances for each config
3. Call `observe()` on the new registry root for each observer

This keeps the coordinator simple and delegates the complexity to the calling code.

####



#### 3. Scope Registration API

Add a method for elements to announce their presence and activate all registry-scoped observers:

```typescript
// Add to Element.prototype
interface Element {
    registerscope(): void;
}

Element.prototype.registerScope = function(): void {
    const registry = (this as any).customElementRegistry;
    if (!registry) return;
    
    // Find the root of this scope
    const registryRoot = getRegistryRoot(this);
    if (!registryRoot) return;
    
    // Get all observers registered for this registry
    const observers = getMountObserversForRegistry(registry);
    
    // Start observing this scope with each registry-scoped observer
    for (const observer of observers) {
        if (observer.scope === 'customElementRegistry') {
            observer.observeAdditionalRoot(registryRoot);
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
            // Find this element's scope root
            const registryContainer = getRootRegistryContainer(this);
            if (!registryContainer) {
                throw new Error('Could not find root registry container');
            }
            thingToObserve = registryContainer;
            
            // The MountObserver will register itself with the registry
            // and automatically observe other scopes when they call registerIsland()
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

// Set up observer on scope 1 - will observe all scopes with reg2
await div2.mount({
    matching: '.my-element',
    do: (el) => console.log('Mounted:', el.id)
});

// Island 2 (created later)
const div4 = document.createElement('div', {customElementRegistry: reg2});
div4.id = 'div4';
document.body.append(div4);

// Announce this scope's presence - will activate all reg2 observers
div4.registerIsland();

// Now .my-element elements in div4 will also be observed!
```

### Benefits

1. **Automatic coordination**: All scopes sharing a registry automatically share mount observers
2. **Backward compatible**: Existing code using 'registry' scope continues to work
3. **Opt-in for new scopes**: New scopes call `registerIsland()` to join the observation network
4. **Memory efficient**: Uses WeakMap/WeakRef to avoid memory leaks
5. **Clean separation**: Registry coordination logic is separate from core MountObserver

### Edge Cases to Handle

1. **Registry cleanup**: When all scopes with a registry are removed, clean up the registry's observer set
2. **Observer lifecycle**: Ensure observers are properly removed when disconnected
3. **Race conditions**: Handle cases where `registerIsland()` is called before any observers exist
4. **Performance**: Multiple roots means multiple mutation observers - ensure SharedMutationObserver handles this efficiently
