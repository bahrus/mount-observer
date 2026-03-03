/**
 * Singleton service for managing shared custom element definitions across registries.
 * Allows publishers to register definitions and consumers to retrieve them.
 */
export class SharedDefinitionRegistry extends EventTarget {
    private static instance: SharedDefinitionRegistry | undefined;
    
    // Map of tag name to constructor
    #definitions = new Map<string, CustomElementConstructor>();
    
    // Private constructor for singleton
    private constructor() {
        super();
    }
    
    /**
     * Get the singleton instance
     */
    static getInstance(): SharedDefinitionRegistry {
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
    publish(tagName: string, constructor: CustomElementConstructor): void {
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
    get(tagName: string): CustomElementConstructor | undefined {
        return this.#definitions.get(tagName);
    }
    
    /**
     * Get all shared definitions
     * @returns A new Map containing all shared definitions
     */
    getAll(): Map<string, CustomElementConstructor> {
        return new Map(this.#definitions);
    }
    
    /**
     * Check if a definition has been shared
     * @param tagName - The custom element tag name
     * @returns true if the definition exists
     */
    has(tagName: string): boolean {
        return this.#definitions.has(tagName);
    }
}
