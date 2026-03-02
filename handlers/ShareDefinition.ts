import { EvtRt } from '../EvtRt.js';
import { MountContext } from '../types/mount-observer/types.js';
import { SharedDefinitionRegistry } from '../SharedDefinitionRegistry.js';

/**
 * Handler that publishes custom element definitions to the shared registry.
 * Matches elements with 'share-definition' attribute that have a dash in their localName.
 */
export class ShareDefinitionHandler extends EvtRt {
    // Static properties define default matching criteria
    static matching = '[share-definition]';
    static whereLocalNameMatches = /-/; // Must have dash (custom element)
    
    constructor(element: Element, context: MountContext) {
        super(element, context);
        this.#publishDefinition(element);
    }
    
    async #publishDefinition(element: Element): Promise<void> {
        const tagName = element.localName;
        
        // Get the element's custom element registry
        const registry = (element as any).customElementRegistry;
        
        // Handle browsers without scoped registry support
        if (!registry) {
            // Fall back to global registry
            const globalRegistry = customElements;
            
            // Wait for definition in global registry
            await globalRegistry.whenDefined(tagName);
            
            // Get constructor
            const constructor = globalRegistry.get(tagName);
            if (!constructor) {
                console.warn(`[ShareDefinition] Definition not found for ${tagName}`);
                return;
            }
            
            // Publish to shared registry
            const sharedRegistry = SharedDefinitionRegistry.getInstance();
            sharedRegistry.publish(tagName, constructor);
            return;
        }
        
        // Wait for the element to be defined in its registry
        try {
            await registry.whenDefined(tagName);
        } catch (error) {
            console.error(`[ShareDefinition] Error waiting for ${tagName}:`, error);
            return;
        }
        
        // Get the constructor from the registry
        const constructor = registry.get(tagName);
        if (!constructor) {
            console.warn(`[ShareDefinition] Definition not found for ${tagName} after whenDefined resolved`);
            return;
        }
        
        // Publish to the shared registry
        const sharedRegistry = SharedDefinitionRegistry.getInstance();
        sharedRegistry.publish(tagName, constructor);
    }
}

// Register built-in handler
import { MountObserver } from '../MountObserver.js';

MountObserver.define('builtIns.shareDefinition', ShareDefinitionHandler);
