import { EvtRt } from '../EvtRt.js';
import { MountObserver } from '../MountObserver.js';
/**
 * Handler for `<script type="cede" data-extends="...">` elements.
 * "Cede" stands for Custom Element Definition.
 *
 * Delegates to assign-gingerly's `defineWithFeatures` to create a custom element
 * class extending the base specified by `data-extends`, optionally wiring up
 * features from JSON configuration (inline or via `src`).
 *
 * The new class gets a static `seedRef` WeakRef pointing back to the script
 * element, allowing the custom element to extract the parent's (Shadow) Fragment
 * and create a cloneable template from it.
 *
 * Examples:
 * ```html
 * <!-- Simple (no features) -->
 * <time-ticker>
 *     <script type="cede" data-extends="xtal-element"></script>
 * </time-ticker>
 *
 * <!-- With inline feature config -->
 * <time-ticker>
 *     <script type="cede" data-extends="el-maker">{
 *         "assignFeatures": {
 *             "roundabout": { "callbackForwarding": ["connectedCallback"] }
 *         }
 *     }</script>
 * </time-ticker>
 *
 * <!-- With external JSON config -->
 * <time-ticker>
 *     <script type="cede" data-extends="el-maker" src="./time-ticker-config.json"></script>
 * </time-ticker>
 * ```
 */
export class CedeScriptHandler extends EvtRt {
    static matching = 'script[type="cede"][data-extends]';
    static whereInstanceOf = HTMLScriptElement;
    async mount(mountedElement, mountConfig, context) {
        this.abort();
        const scriptEl = mountedElement;
        const extendsName = scriptEl.dataset.extends;
        if (!extendsName)
            return;
        const parentEl = scriptEl.parentElement;
        if (!parentEl) {
            throw new Error('CedeScript: script element must have a parentElement');
        }
        const tagName = parentEl.localName;
        const registry = scriptEl.customElementRegistry || customElements;
        // Already defined? Do nothing (first one prevails).
        if (registry.get(tagName))
            return;
        // Parse config: from export, src, or inline JSON
        let config = scriptEl.export;
        if (!config) {
            const srcAttr = scriptEl.getAttribute('src');
            if (srcAttr) {
                try {
                    const module = await import(srcAttr, { with: { type: 'json' } });
                    config = module.default;
                }
                catch (error) {
                    throw new Error(`Failed to import JSON from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            else {
                const jsonText = scriptEl.textContent?.trim();
                if (jsonText) {
                    try {
                        config = JSON.parse(jsonText);
                    }
                    catch (error) {
                        throw new Error(`Failed to parse JSON content: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                else {
                    config = {};
                }
            }
            // Store parsed config and dispatch resolved event
            scriptEl.export = config;
            const { ResolvedEvent } = await import('../Events.js');
            scriptEl.dispatchEvent(new ResolvedEvent(config));
        }
        // Delegate to defineWithFeatures
        const { defineWithFeatures } = await import('assign-gingerly/defineWithFeatures.js');
        // Race condition guard: check again after async operations
        if (registry.get(tagName))
            return;
        await defineWithFeatures(tagName, extendsName, config, registry, {
            onSubclassCreated(NewCtr) {
                NewCtr.seedRef = new WeakRef(scriptEl);
            }
        });
    }
}
MountObserver.define('builtIns.cedeScript', CedeScriptHandler);
export const cedeScript = 'builtIns.cedeScript';
