/**
 * Singleton service for managing shared custom element definitions across registries.
 * Allows publishers to register definitions and consumers to retrieve them.
 */
export class SharedDefinitionRegistry extends EventTarget {
    static instance;
    // Map of tag name to constructor
    #definitions = new Map();
    // Private constructor for singleton
    constructor() {
        super();
    }
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!SharedDefinitionRegistry.instance) {
            SharedDefinitionRegistry.instance = new SharedDefinitionRegistry();
        }
        return SharedDefinitionRegistry.instance;
    }
    /**
     * Publish a custom element definition to the shared registry
     * @param tagName - The custom element tag name (must contain a dash)
     * @param constructor - The custom element constructor
     */
    publish(tagName, constructor) {
        // Only publish if not already published (idempotent)
        if (this.#definitions.has(tagName)) {
            return; // Already published, skip
        }
        this.#definitions.set(tagName, constructor);
        // Dispatch event to notify consumers
        this.dispatchEvent(new CustomEvent('definition-shared', {
            detail: { tagName, constructor }
        }));
    }
    /**
     * Get a specific shared definition
     * @param tagName - The custom element tag name
     * @returns The constructor if found, undefined otherwise
     */
    get(tagName) {
        return this.#definitions.get(tagName);
    }
    /**
     * Get all shared definitions
     * @returns A new Map containing all shared definitions
     */
    getAll() {
        return new Map(this.#definitions);
    }
    /**
     * Check if a definition has been shared
     * @param tagName - The custom element tag name
     * @returns true if the definition exists
     */
    has(tagName) {
        return this.#definitions.has(tagName);
    }
}
