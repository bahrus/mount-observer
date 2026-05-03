import { EvtRt } from '../EvtRt.js';
import { EMC, MountConfig, MountContext } from '../types/mount-observer/types.js';
import '../ElementMountExtension.js';
import 'assign-gingerly/object-extension.js';
import { getParserRegistry } from 'assign-gingerly/parserRegistry.js';

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
        
        // Find containing synthesizer element early (needed for parser waiting)
        const synthesizerElement = this.findContainingSynthesizer(scriptElement);
        
        // Check for parser waiting before processing EMC config
        const waitForParsers = scriptElement.getAttribute('wait-for-parsers');
        if (waitForParsers && synthesizerElement) {
            const parserNames = waitForParsers.trim().split(/\s+/).filter(name => name.length > 0);
            
            if (parserNames.length > 0) {
                // Read timeout attribute (default: 60000ms = 1 minute)
                const timeoutAttr = scriptElement.getAttribute('data-parser-timeout');
                const timeout = timeoutAttr ? parseInt(timeoutAttr, 10) : 60000;
                
                try {
                    // Get scoped registry and wait for parsers
                    const registry = getParserRegistry(synthesizerElement);
                    await registry.waitFor(parserNames, timeout);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`Parser waiting failed for EMC script:`, errorMessage, scriptElement);
                    scriptElement.setAttribute('data-emc-error', errorMessage);
                    return; // Stop processing on timeout/error
                }
            }
        }
        
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
        
        // Construct MountConfig from EMC config and mount it
        const mountConfig = await this.buildMountConfig(emcConfig, synthesizerElement);
        await scriptElement.mount(mountConfig);
    }
    
    /**
     * Build a MountConfig from an EMC config.
     * Combines the matching selector with withAttrs if present.
     */
    private async buildMountConfig(emcConfig: EMC, synthesizerElement?: Element): Promise<MountConfig> {
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
                return this.handleMount(mountedElement, emcConfig, synthesizerElement);
            }
        };
        
        return mountConfig;
    }
    
    /**
     * Handle when an element mounts that matches the EMC config.
     */
    private async handleMount(mountedElement: Element, emcConfig: EMC, synthesizerElement?: Element): Promise<void> {
        const enhKey = emcConfig.enhConfig.enhKey;
        
        // Step 1: Check if element already has this enhancement
        const enh = (mountedElement as any).enh;
        if (enh && enh[enhKey]) {
            // Already enhanced, do nothing
            return;
        }
        
        // Step 2: Get enhancement registry from the element's custom element registry
        const customElementRegistry = (mountedElement as any).customElementRegistry || customElements;
        const enhancementRegistry = (customElementRegistry as any).enhancementRegistry;
        
        if (!enhancementRegistry) {
            throw new Error('Enhancement registry not found on custom element registry');
        }
        
        // Check if enhancement is already registered using findByEnhKey method
        let enhancementConfig = enhancementRegistry.findByEnhKey(enhKey);
        
        // Step 3: If not registered, register it
        if (!enhancementConfig) {
            enhancementConfig = await this.registerEnhancement(emcConfig, enhancementRegistry);
        }
        
        // Step 4: Spawn enhancement instance
        if (!enh) {
            throw new Error('Element does not have enh property. Make sure ElementMountExtension is loaded.');
        }
        
        // Pass synthesizerElement and full EMC config through SpawnContext
        const spawnContext = { synthesizerElement, emc: emcConfig };
        await enh.get(enhancementConfig, spawnContext);
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
    
    /**
     * Find the nearest ancestor synthesizer element.
     * Traverses up through shadow root boundaries.
     * Looks for elements with data-synthesizer attribute, be-hive tag, or __isSynthesizer property.
     */
    private findContainingSynthesizer(element: Element): Element | undefined {
        let current: Node | null = element;
        
        while (current) {
            if (current instanceof Element) {
                // Check for synthesizer marker or known synthesizer tag names
                if (current.hasAttribute('data-synthesizer') || 
                    current.localName === 'be-hive' ||
                    (current as any).__isSynthesizer === true) {
                    return current;
                }
            }
            
            // Try parent element
            if (current.parentElement) {
                current = current.parentElement;
            }
            // Try shadow root host
            else if (current instanceof ShadowRoot) {
                current = (current as ShadowRoot).host;
            }
            // Try parent node (for document fragments)
            else if (current.parentNode) {
                current = current.parentNode;
            }
            else {
                break;
            }
        }
        
        return undefined;
    }
}

// Register built-in handler
import { MountObserver } from '../MountObserver.js';

export const emc = 'builtIns.emcScript';

MountObserver.define(emc, EMCScriptHandler);
