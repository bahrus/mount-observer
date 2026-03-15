"use strict";
/**
 * Manages shared MutationObserver instances for multiple MountObserver instances
 * observing the same root node. This reduces overhead when multiple observers
 * are watching the same DOM fragment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSharedObserver = registerSharedObserver;
exports.unregisterSharedObserver = unregisterSharedObserver;
/**
 * Global registry of shared observers, keyed by root node
 */
var sharedObservers = new WeakMap();
/**
 * Registers a callback with the shared MutationObserver for the given root node.
 * Creates a new shared observer if one doesn't exist for this root.
 */
function registerSharedObserver(rootNode, callback, config) {
    var sharedData = sharedObservers.get(rootNode);
    if (!sharedData) {
        // Create shared data structure first
        sharedData = {
            observer: null, // Will be set immediately below
            callbacks: new Set(),
            config: config
        };
        // Create new shared observer for this root node
        var observer = new MutationObserver(function (mutations) {
            // Distribute mutations to all registered callbacks
            var callbacks = sharedData.callbacks;
            for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                var cb = callbacks_1[_i];
                cb(mutations);
            }
        });
        sharedData.observer = observer;
        sharedObservers.set(rootNode, sharedData);
        // Start observing after everything is set up
        observer.observe(rootNode, config);
    }
    else {
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
function unregisterSharedObserver(rootNode, callback) {
    var sharedData = sharedObservers.get(rootNode);
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
function configsMatch(a, b) {
    return a.childList === b.childList &&
        a.subtree === b.subtree &&
        a.attributes === b.attributes &&
        a.attributeOldValue === b.attributeOldValue &&
        a.characterData === b.characterData &&
        a.characterDataOldValue === b.characterDataOldValue;
}
