import { EvtRt } from './EvtRt.js';
import { MountConfig, MountContext } from './types/mount-observer/types.js';

/**
 * Handler for automatically enhancing mounted elements using assign-gingerly.
 * Searches the first imported module for an export with a "spawn" property
 * and uses element.enh.get() to spawn the enhancement.
 */
export class EnhanceMountedElementHandler extends EvtRt {
    mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext): void {
        // Check if modules are specified
        if (!context.modules || context.modules.length === 0) {
            throw new Error('Must specify an ES Module with import property');
        }
        
        const module = context.modules[0];
        
        // Find registry item (object with spawn property)
        const registryItem = this.findRegistryItem(module);
        
        if (!registryItem) {
            throw new Error('No registry item found in module. Expected an export with a "spawn" property.');
        }
        
        // Validate spawn is a constructor
        if (typeof registryItem.spawn !== 'function') {
            throw new Error('Registry item "spawn" property must be a constructor function');
        }
        
        // Spawn the enhancement
        this.spawnEnhancement(mountedElement, registryItem, context);
    }
    
    /**
     * Spawn the enhancement using element.enh.get().
     * Polyfills customElementRegistry if needed for browsers without scoped registry support.
     */
    private async spawnEnhancement(element: Element, registryItem: any, context: MountContext): Promise<void> {
        // Import assign-gingerly object-extension to enable enh property
        await import('assign-gingerly/object-extension.js');
        
        // Polyfill element.customElementRegistry if it doesn't exist (for browsers without scoped registries)
        if (!(element as any).customElementRegistry) {
            Object.defineProperty(element, 'customElementRegistry', {
                value: customElements,
                writable: true,
                enumerable: false,
                configurable: true
            });
        }
        
        // Use element.enh.get() to spawn the enhancement
        const enh = (element as any).enh;
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
    private findRegistryItem(module: any): any | null {
        // Check default export first
        if (module.default && this.isRegistryItem(module.default)) {
            return module.default;
        }
        
        // Search all exports for a registry item
        const registryItems = Object.values(module)
            .filter(exp => this.isRegistryItem(exp));
        
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
    private isRegistryItem(exp: any): boolean {
        return exp !== null 
            && typeof exp === 'object' 
            && 'spawn' in exp 
            && typeof exp.spawn === 'function';
    }
}
