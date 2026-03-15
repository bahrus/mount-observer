"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upShadowSearch = upShadowSearch;
/**
 * Searches for an element by ID, traversing up through shadow DOM boundaries.
 *
 * This function searches for an element with the specified ID starting from the reference
 * element's root node and continuing up through shadow DOM boundaries until the element
 * is found or the document root is reached.
 *
 * Registry-aware: Only searches in root nodes that share the same customElementRegistry
 * as the reference element. This respects scoped custom element registry boundaries.
 *
 * Search order:
 * 1. Check current root node using getElementById (if same registry)
 * 2. If in shadow root, check host element's properties for the ID
 * 3. Continue up to parent shadow root or document
 * 4. Handle disconnected fragments via targetFragment property
 *
 * @param ref - The reference element to start searching from
 * @param id - The ID of the element to find
 * @returns The found element, or null if not found
 *
 * @example
 * ```typescript
 * const template = document.querySelector('template[src="#myId"]');
 * const source = upShadowSearch(template, 'myId');
 * if (source) {
 *   const clone = source.cloneNode(true);
 * }
 * ```
 */
function upShadowSearch(ref, id) {
    var rn = ref.getRootNode();
    while (rn) {
        // Try getElementById on current root, but only if it shares the same registry
        if ('getElementById' in rn && rn.customElementRegistry === ref.customElementRegistry) {
            var test = rn.getElementById(id);
            if (test)
                return test;
        }
        // If in shadow root, check host element
        if ('host' in rn && rn.host) {
            // Check if host has a property with this ID
            var hostProp = rn.host[id];
            if (hostProp instanceof HTMLElement)
                return hostProp;
            // Move up to host's root
            rn = rn.host.getRootNode();
        }
        else if (rn === document) {
            // Reached document root without finding element
            return null;
        }
        else if (!('isConnected' in rn) || !rn.isConnected) {
            // Handle disconnected fragments
            if (rn.targetFragment) {
                rn = rn.targetFragment;
            }
            else {
                rn = document;
            }
        }
        else {
            // No more parents to check
            return null;
        }
    }
    return null;
}
