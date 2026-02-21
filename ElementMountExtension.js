/**
 * Extension to Element.prototype to support mounting observers directly on elements.
 * This finds the appropriate scoped registry container and observes it.
 */
import { MountObserver } from './MountObserver.js';
import { getRootRegistryContainer } from './getRootRegistryContainer.js';
/**
 * Adds a mount method to Element.prototype that:
 * 1. Determines the observation scope based on options.scope
 * 2. Creates a MountObserver with the provided config
 * 3. Observes that scope
 * 4. Returns the element for chaining
 */
Object.defineProperty(Element.prototype, 'mount', {
    value: async function (config, options = {}) {
        const scope = options.scope ?? 'registry';
        let thingToObserve;
        if (scope === 'registry') {
            const registryContainer = getRootRegistryContainer(this);
            if (!registryContainer) {
                throw new Error('Could not find root registry container');
            }
            thingToObserve = registryContainer;
        }
        else if (scope === 'self') {
            thingToObserve = this;
        }
        else if (scope === 'root') {
            thingToObserve = this.getRootNode();
        }
        else if (scope === 'shadow') {
            const shadowRoot = this.shadowRoot;
            if (!shadowRoot) {
                throw new Error('Element does not have a shadowRoot');
            }
            thingToObserve = shadowRoot;
        }
        else {
            // scope is an Element
            thingToObserve = scope;
        }
        const mo = new MountObserver(config, options);
        await mo.observe(thingToObserve);
        return this;
    },
    writable: true,
    enumerable: false,
    configurable: true,
});
