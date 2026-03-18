import { EvtRt } from '../EvtRt.js';
import { EMC, MountConfig, MountContext } from '../types/mount-observer/types.js';
import { findSuitableClass } from '../findSuitableClass.js';
import { MountObserver } from '../MountObserver.js';
import '../ElementMountExtension.js';
import 'assign-gingerly/object-extension.js';

/**
 * Handler for EMC (Element Mount Configuration) Script Elements.
 * Processes script[type="emc"] elements to declaratively configure element enhancements.
 * 
 * Supports two modes:
 * 1. External JSON: <script type="emc" src="./config.json"></script>
 * 2. Inline JSON: <script type="emc">{ "matching": "div", "enhConfig": {...} }</script>
 * 
 * Unlike MountObserverScript, EMC scripts only support single config objects (not arrays).
 */
export class EMCScriptHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    static matching = 'script[type="emc"]';
    static whereInstanceOf = HTMLScriptElement;
    
    async mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext): Promise<void> {
        this.abort(); // Clean up event listeners (one-time operation)
        
        const scriptElement = mountedElement as HTMLScriptElement;
        
        let emcConfig = (scriptElement as any).export;
        if (!emcConfig) {
            // Check if script has src attribute
            const srcAttr = scriptElement.getAttribute('src');
            
            if (srcAttr) {
                // External JSON mode: import from src
                try {
                    const module = await import(srcAttr, { with: { type: 'json' } } as any);
                    emcConfig = module.default;
                } catch (error) {
                    throw new Error(`Failed to import JSON from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
                }
            } else {
                // Inline JSON mode: parse textContent
                const jsonText = scriptElement.textContent?.trim();
                
                if (!jsonText) {
                    throw new Error('Script element must have either src attribute or JSON content');
                }
                
                try {
                    emcConfig = JSON.parse(jsonText);
                } catch (error) {
                    throw new Error(`Failed to parse JSON content: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            
            // Validate that config is an object (not array)
            if (typeof emcConfig !== 'object' || emcConfig === null || Array.isArray(emcConfig)) {
                throw new Error('EMC config must be an object (not an array)');
            }
            
            // Store the parsed config on the script element's export property
            (scriptElement as any).export = emcConfig;
            
            // Dispatch resolved event
            const { ResolvedEvent } = await import('../Events.js');
            scriptElement.dispatchEvent(new ResolvedEvent(emcConfig));
        }
        
        // Validate EMC config has required properties
        if (!emcConfig.enhConfig) {
            throw new Error('EMC config must have enhConfig property');
        }
        
        const enhKey = emcConfig.enhConfig.enhKey;
        if (!enhKey) {
            throw new Error('EMC config enhConfig must have enhKey property');
        }
        
        // Set ID if not specified
        if (!scriptElement.id && scriptElement.parentElement) {
            scriptElement.id = `${scriptElement.parentElement.localName}.${enhKey}`;
        }
        
        // Construct MountConfig from EMC config
        const mountConfig = await this.buildMountConfig(emcConfig);
        
        // Create a MountObserver to watch for elements matching the config
        const observer = new MountObserver(mountConfig);
        
        // Store observer reference for cleanup
        (scriptElement as any).emcObserver = observer;
        
        // Observe from the script element's parent or root node
        // Use parent element if available, otherwise use root node
        const observeTarget = scriptElement.parentElement || scriptElement.getRootNode() as Node;
        console.log('EMCScript: Observing target:', observeTarget);
        console.log('EMCScript: MountConfig:', mountConfig);
        await observer.observe(observeTarget);
    }
    
    /**
     * Build a MountConfig from an EMC config.
     * Combines the matching selector with withAttrs if present.
     */
    private async buildMountConfig(emcConfig: EMC): Promise<MountConfig> {
        const { enhConfig, ...mountConfigBase } = emcConfig;
        
        let matching = mountConfigBase.matching || '';
        
        // If withAttrs is defined, use buildCSSQuery to combine with matching
        if (enhConfig.withAttrs) {
            const { buildCSSQuery } = await import('assign-gingerly/buildCSSQuery.js');
            // Cast to any to avoid type mismatch with spawn property
            const attrQuery = buildCSSQuery(enhConfig as any);
            
            // Combine matching with attribute query
            if (matching) {
                matching = `${matching}${attrQuery}`;
            } else {
                matching = attrQuery;
            }
        }
        
        // Create the mount config with a custom handler
        const mountConfig: MountConfig = {
            ...mountConfigBase,
            matching,
            do: (mountedElement: Element) => {
                return this.handleMount(mountedElement, emcConfig);
            }
        };
        
        return mountConfig;
    }
    
    /**
     * Handle when an element mounts that matches the EMC config.
     */
    private async handleMount(mountedElement: Element, emcConfig: EMC): Promise<void> {
        try {
            console.log('EMCScript: handleMount called for:', mountedElement);
            const enhKey = emcConfig.enhConfig.enhKey;
            
            // Step 1: Check if element already has this enhancement
            const enh = (mountedElement as any).enh;
            if (enh && enh[enhKey]) {
                // Already enhanced, do nothing
                console.log('EMCScript: Element already enhanced with', enhKey);
                return;
            }
            
            console.log('EMCScript: Enhancing element with', enhKey);
            
            // Step 2: Get enhancement registry from the element's custom element registry
            const customElementRegistry = (mountedElement as any).customElementRegistry || customElements;
            const enhancementRegistry = (customElementRegistry as any).enhancementRegistry;
            
            if (!enhancementRegistry) {
                console.error('EMCScript: Enhancement registry not found');
                throw new Error('Enhancement registry not found on custom element registry');
            }
            
            console.log('EMCScript: Enhancement registry:', enhancementRegistry);
            
            // Check if enhancement is already registered using findByEnhKey method
            let enhancementConfig = enhancementRegistry.findByEnhKey(enhKey);
            
            // Step 3: If not registered, register it
            if (!enhancementConfig) {
                console.log('EMCScript: Registering enhancement');
                enhancementConfig = await this.registerEnhancement(emcConfig, enhancementRegistry);
                console.log('EMCScript: Enhancement registered:', enhancementConfig);
            } else {
                console.log('EMCScript: Enhancement already registered');
            }
            
            // Step 4: Spawn enhancement instance
            if (!enh) {
                throw new Error('Element does not have enh property. Make sure ElementMountExtension is loaded.');
            }
            
            console.log('EMCScript: Spawning enhancement instance with config:', enhancementConfig);
            const result = await enh.get(enhancementConfig);
            console.log('EMCScript: Enhancement spawned successfully, result:', result);
        } catch (error) {
            console.error('EMCScript: Error in handleMount:', error);
            throw error;
        }
    }
    
    /**
     * Register an enhancement in the enhancement registry.
     */
    private async registerEnhancement(emcConfig: EMC, enhancementRegistry: any): Promise<any> {
        const { enhConfig } = emcConfig;
        const { spawn } = enhConfig;
        
        if (!spawn) {
            throw new Error('EMC enhConfig must have spawn property');
        }
        // Step 3.1: Import the module
        // Resolve the spawn path relative to the document base URL
        //const resolvedSpawn = new URL(spawn, document.baseURI).href;
        //console.log('EMCScript: Importing from:', resolvedSpawn);
        const module = await import(spawn);
        
        // Get the enhancement class - it should be the default export or any exported class
        let ElementClass = module.default;
        
        // If no default export, try to find a suitable class
        if (!ElementClass) {
            // Look for any exported constructor function
            for (const key of Object.keys(module)) {
                if (typeof module[key] === 'function') {
                    ElementClass = module[key];
                    break;
                }
            }
        }
        
        if (!ElementClass) {
            throw new Error(`No suitable class found in module ${spawn}`);
        }
        
        // Step 3.2: Construct enhancement config
        const enhancementConfig = {
            ...enhConfig,
            spawn: ElementClass
        };
        
        // Step 3.3: Register in enhancement registry
        enhancementRegistry.push(enhancementConfig);
        
        return enhancementConfig;
    }
}

// Register built-in handler
export const emc = 'builtIns.emcScript';

MountObserver.define(emc, EMCScriptHandler);
