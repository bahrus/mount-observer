import { EvtRt } from '../EvtRt.js';
import { SharedDefinitionRegistry } from '../SharedDefinitionRegistry.js';
/**
 * Handler that imports shared definitions into registries that need them.
 * Matches elements with different customElementRegistry than the observed root.
 */
export class ImportSharedDefinitionsHandler extends EvtRt {
    // Static properties define default matching criteria
    static matching = '*'; // Match all elements
    static whereDifferentCustomElementRegistry = true; // Only different registries
    // Track which registries we've processed to avoid duplicate work
    static #processedRegistries = new WeakSet();
    // Track event listener to avoid duplicate subscriptions
    static #eventListenerAdded = false;
    constructor(element, context) {
        super(element, context);
        // Set up event listener for future definitions (only once)
        if (!ImportSharedDefinitionsHandler.#eventListenerAdded) {
            this.#setupEventListener();
            ImportSharedDefinitionsHandler.#eventListenerAdded = true;
        }
        // Import definitions into this element's registry
        this.#importDefinitions(element);
    }
    #setupEventListener() {
        const sharedRegistry = SharedDefinitionRegistry.getInstance();
        // Listen for new definitions being published
        sharedRegistry.addEventListener('definition-shared', ((event) => {
            const { tagName, constructor } = event.detail;
            // Note: We can't iterate processedRegistries (WeakSet), so this
            // only helps with definitions published after we've seen registries
            // The main registration happens in #importDefinitions
            // This listener is here for future enhancements
        }));
    }
    #importDefinitions(element) {
        // Get the element's custom element registry
        const registry = element.customElementRegistry;
        // Handle browsers without scoped registry support
        if (!registry) {
            // No scoped registries, nothing to do
            return;
        }
        // Skip if we've already processed this registry
        if (ImportSharedDefinitionsHandler.#processedRegistries.has(registry)) {
            return;
        }
        // Mark this registry as processed
        ImportSharedDefinitionsHandler.#processedRegistries.add(registry);
        // Get all shared definitions
        const sharedRegistry = SharedDefinitionRegistry.getInstance();
        const sharedDefinitions = sharedRegistry.getAll();
        // Register each shared definition in this registry
        for (const [tagName, constructor] of sharedDefinitions) {
            this.#registerDefinition(registry, tagName, constructor);
        }
    }
    #registerDefinition(registry, tagName, constructor) {
        try {
            // Check if already defined
            const existing = registry.get(tagName);
            if (existing) {
                // Already defined, skip
                return;
            }
            // Register the definition
            registry.define(tagName, constructor);
        }
        catch (error) {
            // Ignore errors (likely already defined or invalid constructor)
            // This can happen in race conditions
            console.debug(`[ImportSharedDefinitions] Could not register ${tagName}:`, error);
        }
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.importSharedDefinitions', ImportSharedDefinitionsHandler);
