/**
 * Coordinates MountObserver instances across multiple DOM scopes that share
 * the same CustomElementRegistry. This enables "mutually assured observing"
 * where all scopes with the same registry share mount observers.
 */

import type { MountConfig, MountObserverOptions, WeakDual } from './types/mount-observer/types.js';
import type { MountObserver } from './MountObserver.js';

/**
 * Represents a single MountObserver observing a specific registry root.
 */
type ObserverEntry = {
    config: MountConfig;  // Store for reference
    registryRootRef: WeakRef<Node>;
    observer: MountObserver;
};

const regObsGuid = 'iqj6MOueu0OP4CQi1a_4Sw';

export type CER2MC2N2OE = WeakMap<
    CustomElementRegistry, 
    Map<
        MountConfig, 
        WeakMap<Node, ObserverEntry>
    >
>

/**
 * Maps CustomElementRegistry -> Map<MountConfig, WeakMap<Node, ObserverEntry>>
 * The MountConfig object itself is used as the key (object identity).
 * The innermost WeakMap maps registry root nodes to their observer entries.
 */
export function getRegistryObservers(): CER2MC2N2OE{
  if (!(globalThis as any)[regObsGuid]) {
    (globalThis as any)[regObsGuid] = new WeakMap<CustomElementRegistry, 
        Map<
            MountConfig, 
            WeakMap<Node, ObserverEntry>
        >
    >();
  }
  return (globalThis as any)[regObsGuid] as CER2MC2N2OE;
}


const registryScopeId = 'pt9dS-V7U0SC3Yk708_5Ww';

export type CER2WD = WeakMap<
    CustomElementRegistry, 
    WeakDual<Node>
>

/**
 * Tracks all registry root nodes for each CustomElementRegistry.
 * Used to iterate over all scopes when a new config is added.
 */
export function getRegistryScopes(): CER2WD{
    if (!(globalThis as any)[registryScopeId]) {
    (globalThis as any)[registryScopeId] = new WeakMap<
        CustomElementRegistry, 
        WeakDual<Node>
    >();
  }
  return (globalThis as any)[registryScopeId] as CER2WD;
}


// const registryScopes = new WeakMap<
//     CustomElementRegistry, 
//     WeakDual<Node>
// >();

// Note: assignGingerly.ts already has a polyfill for getOrInsertComputed.
// If this code will already have imported assignGingerly, then no need for the duplicate polyfill below.

// Polyfill for Map.prototype.getOrInsertComputed and WeakMap.prototype.getOrInsertComputed
if (typeof Map.prototype.getOrInsertComputed !== 'function') {
  (Map.prototype as any).getOrInsertComputed = function(key: any, insert: () => any) {
    if (this.has(key)) return this.get(key);
    const value = insert();
    this.set(key, value);
    return value;
  };
}
if (typeof WeakMap.prototype.getOrInsertComputed !== 'function') {
  (WeakMap.prototype as any).getOrInsertComputed = function(key: any, insert: () => any) {
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
    registryRoot: Node,
    options: MountObserverOptions
): Promise<ObserverEntry> {
    // Dynamically import to avoid circular dependency
    const { MountObserver: MountObserverClass } = await import('./MountObserver.js');
    const observer = new MountObserverClass(config, options);
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
    registryRoot: Node,
    options: MountObserverOptions
): Promise<ObserverEntry> {
    // Add config to the registry's config list (if not already there)
    (registry as any).mountConfigRegistry.push(config);
    
    // Get or create the nested map structure
    const mountConfigMap = (getRegistryObservers()).getOrInsertComputed(registry, () => new Map());
    const nodeToObserverMap = mountConfigMap.getOrInsertComputed(config, () => new WeakMap());
    
    // Get or create the observer for this specific registry root
    let observerEntry = nodeToObserverMap.get(registryRoot);
    if (!observerEntry) {
        observerEntry = await createObserverEntry(config, registryRoot, options);
        nodeToObserverMap.set(registryRoot, observerEntry);
    }
    
    // Track this registry root in the scopes set
    const scopes = getRegistryScopes().getOrInsertComputed(registry, () => ({
        weakSet: new WeakSet<Node>(),
        setWeak: new Set<WeakRef<Node>>()
    }));
    
    // Add to tracking sets if not already present
    if (!scopes.weakSet.has(registryRoot)) {
        scopes.weakSet.add(registryRoot);
        scopes.setWeak.add(new WeakRef(registryRoot));
    }
    
    // Get all configs for this registry
    const configs = (registry as any).mountConfigRegistry.items;
    
    // Iterate over all known registry roots for this registry
    const arr = Array.from(scopes.setWeak) as WeakRef<Node>[];
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
                existingEntry = await createObserverEntry(conf, regRoot, options);
                confObserverMap.set(regRoot, existingEntry);
            }
        }
    }
    
    return observerEntry;
}
