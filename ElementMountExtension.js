/**
 * Extension to Element.prototype to support mounting observers directly on elements.
 * This finds the appropriate scoped registry container and observes it.
 */
import { MountObserver } from './MountObserver.js';
import { getRootRegistryContainer } from './getRootRegistryContainer.js';
/**
 * Adds a mount method to Element.prototype that:
 * 1. Finds the root registry container for the element
 * 2. Creates a MountObserver with the provided config
 * 3. Observes that root container
 * 4. Returns the element for chaining
 */
Object.defineProperty(Element.prototype, 'mount', {
    value: async function (config, options = {}) {
        const root = getRootRegistryContainer(this);
        const mo = new MountObserver(config, options);
        await mo.observe(root);
        return this;
    },
    writable: true,
    enumerable: false,
    configurable: true,
});
