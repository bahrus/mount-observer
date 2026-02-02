/**
 * Manages shared MutationObserver instances for multiple MountObserver instances
 * observing the same root node. This reduces overhead when multiple observers
 * are watching the same DOM fragment.
 */

export type MutationCallback = (mutations: MutationRecord[]) => void;

interface SharedObserverData {
    observer: MutationObserver;
    callbacks: Set<MutationCallback>;
    config: MutationObserverInit;
}

/**
 * Global registry of shared observers, keyed by root node
 */
const sharedObservers = new WeakMap<Node, SharedObserverData>();

/**
 * Registers a callback with the shared MutationObserver for the given root node.
 * Creates a new shared observer if one doesn't exist for this root.
 */
export function registerSharedObserver(
    rootNode: Node,
    callback: MutationCallback,
    config: MutationObserverInit
): void {
    let sharedData = sharedObservers.get(rootNode);
    
    if (!sharedData) {
        // Create shared data structure first
        sharedData = {
            observer: null as any, // Will be set immediately below
            callbacks: new Set(),
            config
        };
        
        // Create new shared observer for this root node
        const observer = new MutationObserver((mutations) => {
            // Distribute mutations to all registered callbacks
            const callbacks = sharedData!.callbacks;
            for (const cb of callbacks) {
                cb(mutations);
            }
        });
        
        sharedData.observer = observer;
        sharedObservers.set(rootNode, sharedData);
        
        // Start observing after everything is set up
        observer.observe(rootNode, config);
    } else {
        // Verify config matches (for safety)
        // In practice, all MountObservers should use the same config
        if (!configsMatch(sharedData.config, config)) {
            console.warn('MutationObserver config mismatch detected. Using existing config.');
        }
    }
    
    // Register the callback
    sharedData.callbacks.add(callback);
}

/**
 * Unregisters a callback from the shared MutationObserver.
 * If this was the last callback, disconnects and removes the shared observer.
 */
export function unregisterSharedObserver(
    rootNode: Node,
    callback: MutationCallback
): void {
    const sharedData = sharedObservers.get(rootNode);
    
    if (!sharedData) {
        return;
    }
    
    // Remove the callback
    sharedData.callbacks.delete(callback);
    
    // If no more callbacks, disconnect and cleanup
    if (sharedData.callbacks.size === 0) {
        sharedData.observer.disconnect();
        sharedObservers.delete(rootNode);
    }
}

/**
 * Checks if two MutationObserverInit configs are equivalent
 */
function configsMatch(a: MutationObserverInit, b: MutationObserverInit): boolean {
    return a.childList === b.childList &&
           a.subtree === b.subtree &&
           a.attributes === b.attributes &&
           a.attributeOldValue === b.attributeOldValue &&
           a.characterData === b.characterData &&
           a.characterDataOldValue === b.characterDataOldValue;
}
