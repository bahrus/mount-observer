"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withScopePerimeter = withScopePerimeter;
/**
 * Check if an element is outside (not inside) any ancestor matching a selector.
 * This implements "donut hole" scoping.
 *
 * @param rootNode - The root node to stop traversal at (not checked against selector)
 * @param matchCandidate - The element to check
 * @param outside - CSS selector for excluding ancestors
 * @returns true if element is outside all matching ancestors, false otherwise
 */
function withScopePerimeter(rootNode, matchCandidate, outside) {
    var current = matchCandidate.parentElement;
    while (current && current !== rootNode) {
        if (current.matches(outside)) {
            return false; // Found an excluding ancestor
        }
        current = current.parentElement;
    }
    return true; // No excluding ancestors found
}
