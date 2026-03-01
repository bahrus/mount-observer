/**
 * Extension to Element.prototype to support mounting observers directly on elements.
 * This finds the appropriate scoped registry container and observes it.
 */
import { MountObserver } from './MountObserver.js';
import { getRegistryRoot } from './getRegistryRoot.js';
import { getOrInsertObserverEntry } from './RegistryMountCoordinator.js';
/**
 * Registry for tracking MountConfig objects associated with a CustomElementRegistry.
 * This enables coordination of mount observers across multiple DOM scopes that share
 * the same registry.
 */
export class MountConfigRegistry extends EventTarget {
    #items = new Set();
    get items() {
        return Array.from(this.#items);
    }
    push(items) {
        if (Array.isArray(items)) {
            for (const item of items) {
                this.#items.add(item);
            }
        }
        else {
            this.#items.add(items);
        }
    }
}
// Add mountConfigRegistry property to CustomElementRegistry prototype
if (typeof CustomElementRegistry !== 'undefined') {
    Object.defineProperty(CustomElementRegistry.prototype, 'mountConfigRegistry', {
        get: function () {
            // Create a new MountConfigRegistry instance on first access and cache it
            const registry = new MountConfigRegistry();
            // Replace the getter with the actual value
            Object.defineProperty(this, 'mountConfigRegistry', {
                value: registry,
                writable: true,
                enumerable: false,
                configurable: true,
            });
            return registry;
        },
        enumerable: false,
        configurable: true,
    });
}
/**
 * Adds a mount method to Element.prototype that:
 * 1. Determines the observation scope based on options.scope
 * 2. Creates a MountObserver with the provided config
 * 3. Observes that scope
 * 4. Returns the element for chaining
 */
Object.defineProperty(Element.prototype, 'mount', {
    value: async function (config, options = {}) {
        const scope = options.scope ?? 'registry'; // NEW DEFAULT
        let thingToObserve;
        if (scope === 'registry') {
            // Find this element's registry root
            const registryContainer = getRegistryRoot(this);
            if (!registryContainer) {
                throw new Error('Could not find registry root');
            }
            thingToObserve = registryContainer;
            // Get the registry for coordination
            const registry = this.customElementRegistry;
            // Register with coordinator if registry exists
            if (registry) {
                await getOrInsertObserverEntry(registry, config, thingToObserve);
            }
            else {
                // No registry, just create a standalone observer
                const mo = new MountObserver(config, options);
                await mo.observe(thingToObserve);
            }
            return this;
        }
        else if (scope === 'registryRoot') {
            const registryContainer = getRegistryRoot(this);
            if (!registryContainer) {
                throw new Error('Could not find registry root');
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
/**
 * Adds a mountScope method to Element.prototype that:
 * 1. Finds the registry root for this element
 * 2. Gets all active configs for this registry
 * 3. Creates new MountObservers for each config to observe this scope
 */
Object.defineProperty(Element.prototype, 'mountScope', {
    value: async function () {
        const registry = this.customElementRegistry;
        if (!registry) {
            return;
        }
        // Find the root of this scope
        const registryRoot = getRegistryRoot(this);
        if (!registryRoot) {
            return;
        }
        // Get all configs for this registry
        const configs = registry.mountConfigRegistry.items;
        // For each config, ensure an observer exists for this registry root
        for (const config of configs) {
            await getOrInsertObserverEntry(registry, config, registryRoot);
        }
    },
    writable: true,
    enumerable: false,
    configurable: true,
});
