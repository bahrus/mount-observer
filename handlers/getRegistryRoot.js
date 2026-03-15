"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistryRoot = getRegistryRoot;
/**
 * Recursively traverses up the DOM tree to find the highest node
 * that shares the same customElementRegistry as the passed in node.
 * This is useful for scoped custom element registries where we want to observe within the correct scope.
 *
 * @param node - The starting node to check
 * @returns The highest node with matching customElementRegistry, or null if node is invalid
 */
function getRegistryRoot(node) {
    if (!node) {
        return null;
    }
    // Quick check: if root node has the same registry, return it immediately
    var rn = node.getRootNode();
    var customElementRegistry = node.customElementRegistry;
    if (rn.customElementRegistry === customElementRegistry) {
        return rn;
    }
    var startRegistry = node.customElementRegistry;
    var currentNode = node;
    var highestMatch = node;
    while (currentNode) {
        // Check if current node has matching customElementRegistry
        if (currentNode.customElementRegistry === startRegistry) {
            highestMatch = currentNode;
        }
        // Try to get parent element first
        var parent_1 = currentNode.parentElement;
        if (parent_1) {
            currentNode = parent_1;
            continue;
        }
        // If no parent element, check for rootNode (shadow root case)
        var root = currentNode.getRootNode();
        if (root && root !== currentNode) {
            // If it's a shadow root (not document), return it
            if (root !== document) {
                return root;
            }
            // If it's the document, check if it has the same registry
            if (root.customElementRegistry === startRegistry) {
                return root;
            }
        }
        // Reached the top
        break;
    }
    return highestMatch;
}
