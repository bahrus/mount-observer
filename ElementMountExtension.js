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
 * Adds a mount method to Node.prototype that works for Element, ShadowRoot, and Document.
 * This provides a unified API for mounting observers on any node type.
 *
 * For Elements:
 * 1. Determines the observation scope based on options.scope
 * 2. Creates a MountObserver with the provided config
 * 3. Observes that scope with registry coordination
 * 4. Returns the node for chaining
 *
 * For ShadowRoot and Document:
 * 1. Observes the node directly (no registry coordination)
 * 2. Returns the node for chaining
 */
Object.defineProperty(Node.prototype, 'mount', {
    value: async function (config, options = {}) {
        // For ShadowRoot and Document, observe directly
        if (this instanceof ShadowRoot || this instanceof Document) {
            const mo = new MountObserver(config, options);
            await mo.observe(this);
            return this;
        }
        // For Element, use the robust registry-aware logic
        if (!(this instanceof Element)) {
            throw new Error('mount() can only be called on Element, ShadowRoot, or Document');
        }
        if (this instanceof HTMLScriptElement) {
            options.mose = new WeakRef(this);
        }
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
                await getOrInsertObserverEntry(registry, config, thingToObserve, options);
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
            await getOrInsertObserverEntry(registry, config, registryRoot, {});
        }
    },
    writable: true,
    enumerable: false,
    configurable: true,
});
/**
 * Adds a mountGlobally method to Node.prototype that works for Element, ShadowRoot, and Document.
 *
 * For Elements:
 * 1. Mounts the config in the current registry
 * 2. Creates propagators to automatically mount in:
 *    - Elements with different custom element registries
 *    - Shadow roots within the same registry
 *
 * For ShadowRoot and Document:
 * 1. Mounts in the current node
 * 2. Creates propagators for child registries and shadow roots
 *
 * This enables "viral" propagation of mount observers across registry boundaries,
 * useful for bootstrapping core handlers like builtIns.mountObserverScript.
 */
Object.defineProperty(Node.prototype, 'mountGlobally', {
    value: async function (config, options = {}) {
        // Mount in current node first
        await this.mount(config, options);
        // Propagator 1: Watch for elements in different registries
        const crossCustomElementRegistryPropagator = new MountObserver({
            matching: '*',
            whereDifferentCustomElementRegistry: true,
            do: async (el) => {
                // Wait for custom element to be defined so it has the chance to add shadowRoot
                const { localName } = el;
                if (localName.includes('-')) {
                    const registry = el.customElementRegistry;
                    if (registry && typeof registry.whenDefined === 'function') {
                        await registry.whenDefined(localName);
                    }
                }
                const shadowRoot = el.shadowRoot;
                if (shadowRoot) {
                    // Use mountGlobally to propagate recursively
                    await shadowRoot.mountGlobally(config, options);
                }
                else {
                    // No shadow root, mount on element
                    await el.mount(config, options);
                }
            }
        }, options);
        await crossCustomElementRegistryPropagator.observe(this);
        // Propagator 2: Watch for shadow roots within the same registry
        const crossShadowRootPropagator = new MountObserver({
            matching: '*',
            whereLocalNameMatches: /-/,
            do: async (el) => {
                const { localName } = el;
                const registry = el.customElementRegistry;
                if (registry && typeof registry.whenDefined === 'function') {
                    await registry.whenDefined(localName);
                }
                const shadowRoot = el.shadowRoot;
                if (shadowRoot === null)
                    return;
                // Use mountGlobally to propagate recursively
                await shadowRoot.mountGlobally(config, options);
            }
        }, options);
        await crossShadowRootPropagator.observe(this);
        return this;
    },
    writable: true,
    enumerable: false,
    configurable: true,
});
