"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arr = arr;
/**
 * Utility function to normalize a value to an array.
 * - If undefined, returns empty array
 * - If already an array, returns as-is
 * - Otherwise, wraps the value in an array
 *
 * @param inp - Value to normalize to array
 * @returns Array containing the value(s)
 */
function arr(inp) {
    return inp === undefined ? []
        : Array.isArray(inp) ? inp : [inp];
}
