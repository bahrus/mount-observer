import { EvtRt } from '../EvtRt.js';
//import { buildCSSQuery } from 'assign-gingerly/buildCSSQuery.js';
import 'assign-gingerly/object-extension.js';
/**
 * Handler for automatically enhancing mounted elements using assign-gingerly.
 * Searches the first imported module for an export with a "spawn" property
 * and uses element.enh.get() to spawn the enhancement.
 */
export class EnhanceMountedElementHandler extends EvtRt {
    async mount(mountedElement, MountConfig, context) {
        this.abort();
        // Check if modules are specified
        if (!context.modules || context.modules.length === 0) {
            throw new Error('Must specify an ES Module with import property');
        }
        const module = context.modules[0];
        // Find registry item (object with spawn property)
        const registryItem = await this._findRegistryItem(module, mountedElement);
        if (!registryItem) {
            throw new Error('No registry item found in module. Expected an export with a "spawn" property.');
        }
        // Validate spawn is a constructor
        if (typeof registryItem.spawn !== 'function') {
            throw new Error('Registry item "spawn" property must be a constructor function');
        }
        // const mose = context?.observer?.options?.mose;
        // if(mose){
        //     const se = mose.deref() as HTMLScriptElement;
        //     const {parentElement} = se;
        //     const {enhKey} = registryItem;
        //     if(!se.id && enhKey){
        //         se.id = `${parentElement?.localName}.${ enhKey}`;
        //     }
        // }
        // Spawn the enhancement
        this.#spawnEnhancement(mountedElement, registryItem, context);
    }
    /**
     * Spawn the enhancement using element.enh.get().
     * Polyfills customElementRegistry if needed for browsers without scoped registry support.
     */
    #spawnEnhancement(element, registryItem, context) {
        // Polyfill element.customElementRegistry if it doesn't exist (for browsers without scoped registries)
        if (!element.customElementRegistry) {
            Object.defineProperty(element, 'customElementRegistry', {
                value: customElements,
                writable: true,
                enumerable: false,
                configurable: true
            });
        }
        // Use element.enh.get() to spawn the enhancement
        const enh = element.enh;
        if (!enh || typeof enh.get !== 'function') {
            throw new Error('Element does not have enh.get() method. Make sure assign-gingerly/object-extension.js is loaded.');
        }
        enh.get(registryItem, context);
    }
    /**
     * Find a registry item in the module exports.
     * A registry item is an object with a "spawn" property.
     * @param module - The imported module
     * @returns The registry item or null if not found
     */
    async _findRegistryItem(module, el) {
        // Check default export first
        if (module.default && await this._isRegistryItem(module.default, el)) {
            return module.default;
        }
        // Search all exports for a registry item
        const exports = Object.values(module);
        const registryItems = [];
        for (const e of exports) {
            const isRegistryItem = await this._isRegistryItem(e, el);
            if (isRegistryItem)
                registryItems.push(e);
        }
        if (registryItems.length === 0) {
            return null;
        }
        if (registryItems.length > 1) {
            throw new Error('More than one registry item found in module. Expected exactly one export with a "spawn" property.');
        }
        return registryItems[0];
    }
    /**
     * Check if an export is a registry item (has a spawn property).
     * @param exp - The export to check
     * @returns True if the export is a registry item
     */
    async _isRegistryItem(exp, mountedElement) {
        let test = exp !== null
            && typeof exp === 'object'
            && 'spawn' in exp
            && typeof exp.spawn === 'function';
        if (!test)
            return false;
        const emc = exp;
        if (emc.withAttrs !== undefined) {
            const cssQuery = (await import('assign-gingerly/buildCSSQuery.js')).buildCSSQuery(emc);
            return mountedElement.matches(cssQuery);
        }
        return true;
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.enhanceMountedElement', EnhanceMountedElementHandler);
