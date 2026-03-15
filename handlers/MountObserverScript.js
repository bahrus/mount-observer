import { EvtRt } from '../EvtRt.js';
import '../ElementMountExtension.js';
/**
 * Handler for Mount Observer Script Elements (MOSEs).
 * Processes script[type="mountobserver"] elements to declaratively configure mount observers.
 *
 * Supports two modes:
 * 1. External JSON: <script type="mountobserver" src="./config.json"></script>
 * 2. Inline JSON: <script type="mountobserver">{ "matching": "div" }</script>
 *
 * Supports multiple configs in one script element:
 * - Single config: { "do": "builtIns.hoistTemplate" }
 * - Multiple configs: [{ "do": "builtIns.hoistTemplate" }, { "do": "builtIns.HTMLInclude" }]
 */
export class MountObserverScriptHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    static matching = 'script[type="mountobserver"]';
    static whereInstanceOf = HTMLScriptElement;
    async mount(mountedElement, MountConfig, context) {
        this.abort(); // Clean up event listeners (one-time operation)
        const scriptElement = mountedElement;
        let config = scriptElement.export;
        if (!config) {
            // Check if script has src attribute
            const srcAttr = scriptElement.getAttribute('src');
            if (srcAttr) {
                // External JSON mode: import from src
                //const resolvedUrl = new URL(srcAttr, document.baseURI).href;
                try {
                    const module = await import(srcAttr, { with: { type: 'json' } });
                    config = module.default;
                }
                catch (error) {
                    throw new Error(`Failed to import JSON from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            else {
                // Inline JSON mode: parse textContent
                const jsonText = scriptElement.textContent?.trim();
                if (!jsonText) {
                    throw new Error('Script element must have either src attribute or JSON content');
                }
                try {
                    config = JSON.parse(jsonText);
                }
                catch (error) {
                    throw new Error(`Failed to parse JSON content: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Validate that config is an object or array
            if (typeof config !== 'object' || config === null) {
                throw new Error('Mount observer config must be an object or array');
            }
            // Store the parsed config on the script element's export property
            scriptElement.export = config;
            // Dispatch resolved event
            const { ResolvedEvent } = await import('../Events.js');
            scriptElement.dispatchEvent(new ResolvedEvent(config));
        }
        // Handle array of configs
        if (Array.isArray(config)) {
            // Mount each config in the array
            for (const singleConfig of config) {
                if (typeof singleConfig !== 'object' || singleConfig === null) {
                    throw new Error('Each config in array must be an object');
                }
                await scriptElement.mount(singleConfig);
            }
        }
        else {
            // Single config object - mount it
            await scriptElement.mount(config);
        }
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.mountObserverScript', MountObserverScriptHandler);
