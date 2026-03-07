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
    mount(mountedElement, mountConfig, context) {
        // Set up event listener for future definitions (only once)
        if (!ImportSharedDefinitionsHandler.#eventListenerAdded) {
            const sharedRegistry = SharedDefinitionRegistry.getInstance();
            sharedRegistry.addEventListener('definition-shared', ((event) => {
                const { tagName, constructor } = event.detail;
                // Future enhancement: could handle new definitions here
            }));
            ImportSharedDefinitionsHandler.#eventListenerAdded = true;
        }
        // Import definitions into this element's registry
        const registry = mountedElement.customElementRegistry;
        // Handle browsers without scoped registry support
        if (!registry) {
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
            try {
                // Check if already defined
                const existing = registry.get(tagName);
                if (existing) {
                    continue;
                }
                // Register the definition
                registry.define(tagName, constructor);
            }
            catch (error) {
                // Ignore errors (likely already defined or invalid constructor)
                console.debug(`[ImportSharedDefinitions] Could not register ${tagName}:`, error);
            }
        }
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.importSharedDefinitions', ImportSharedDefinitionsHandler);
