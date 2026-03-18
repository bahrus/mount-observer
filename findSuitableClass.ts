/**
 * Utility function to find a suitable HTMLElement class from a module.
 * Used by handlers that need to extract a class from an imported module.
 */

/**
 * Find a suitable HTMLElement class from a module.
 * Checks the default export first, then searches all exports.
 * @param module - The imported module
 * @returns The HTMLElement class constructor
 * @throws Error if no suitable class is found or multiple classes are found
 */
export function findSuitableClass(module: any): typeof HTMLElement {
    // Check default export first
    const defaultExport = module.default;
    
    if (defaultExport && extendsHTMLElement(defaultExport)) {
        return defaultExport;
    }
    
    // Find all exports that extend HTMLElement
    const htmlElementClasses = Object.values(module)
        .filter(exp => typeof exp === 'function' && extendsHTMLElement(exp));
    
    if (htmlElementClasses.length === 0) {
        throw new Error('No suitable class found in module');
    }
    
    if (htmlElementClasses.length > 1) {
        throw new Error('More than one class found in module');
    }
    
    return htmlElementClasses[0] as typeof HTMLElement;
}

/**
 * Check if a class extends HTMLElement.
 * @param cls - The class to check
 * @returns true if the class extends HTMLElement
 */
function extendsHTMLElement(cls: any): boolean {
    try {
        // Must be a function
        if (typeof cls !== 'function') {
            return false;
        }
        // Handle direct HTMLElement export
        if (cls === HTMLElement) {
            return true;
        }
        // Check if it has a prototype and extends HTMLElement
        if (cls.prototype && cls.prototype instanceof HTMLElement) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}
