/**
 * Utility function to normalize a value to an array.
 * - If undefined, returns empty array
 * - If already an array, returns as-is
 * - Otherwise, wraps the value in an array
 * 
 * @param inp - Value to normalize to array
 * @returns Array containing the value(s)
 */
export function arr<T = any>(inp: T | T[] | undefined): T[] {
    return inp === undefined ? []
        : Array.isArray(inp) ? inp : [inp];
}
