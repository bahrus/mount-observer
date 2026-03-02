import { EvtRt } from '../EvtRt.js';
import { SharedDefinitionRegistry } from '../SharedDefinitionRegistry.js';
/**
 * Handler that publishes custom element definitions to the shared registry.
 * Matches elements with 'share-definition' attribute that have a dash in their localName.
 */
export class ShareDefinitionHandler extends EvtRt {
    // Static properties define default matching criteria
    static matching = '[share-definition]';
    static whereLocalNameMatches = /-/; // Must have dash (custom element)
    mount(mountedElement, mountConfig, context) {
        const tagName = mountedElement.localName;
        const sharedRegistry = SharedDefinitionRegistry.getInstance();
        // Get the element's custom element registry
        const registry = mountedElement.customElementRegistry;
        // Handle browsers without scoped registry support
        if (!registry) {
            // Fall back to global registry
            const globalRegistry = customElements;
            // Wait for definition in global registry
            globalRegistry.whenDefined(tagName).then(() => {
                const constructor = globalRegistry.get(tagName);
                if (!constructor) {
                    console.warn(`[ShareDefinition] Definition not found for ${tagName}`);
                    return;
                }
                sharedRegistry.publish(tagName, constructor);
            }).catch(error => {
                console.error(`[ShareDefinition] Error waiting for ${tagName}:`, error);
            });
            return;
        }
        // Wait for the element to be defined in its registry
        registry.whenDefined(tagName).then(() => {
            const constructor = registry.get(tagName);
            if (!constructor) {
                console.warn(`[ShareDefinition] Definition not found for ${tagName} after whenDefined resolved`);
                return;
            }
            sharedRegistry.publish(tagName, constructor);
        }).catch((error) => {
            console.error(`[ShareDefinition] Error waiting for ${tagName}:`, error);
        });
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.shareDefinition', ShareDefinitionHandler);
