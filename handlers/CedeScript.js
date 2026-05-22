import { EvtRt } from '../EvtRt.js';
import { MountObserver } from '../MountObserver.js';
/**
 * Handler for `<script type="cede" data-extends="...">` elements.
 *
 * Creates a new custom element class that extends the class specified by
 * `data-extends`, and defines it in the same registry as the script element
 * using the parent element's localName as the tag name.
 *
 * The new class gets a static `seedRef` WeakRef pointing back to the script
 * element, allowing the custom element to extract the parent's (Shadow) Fragment
 * and create a cloneable template from it.
 *
 * Example:
 * ```html
 * <time-ticker>
 *     <script type="cede" data-extends="xtal-element"></script>
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
        // Await the base class definition (indefinitely for now)
        const baseCtr = await registry.whenDefined(extendsName);
        // Race condition guard: check again after await
        if (registry.get(tagName))
            return;
        // Create derived class extending the base
        const NewCtr = class extends baseCtr {
        };
        // Attach seedRef so the CE can access the script element
        // (e.g., to extract the parent's fragment as a cloneable template)
        NewCtr.seedRef = new WeakRef(scriptEl);
        // Define the custom element
        registry.define(tagName, NewCtr);
    }
}
MountObserver.define('builtIns.cedeScript', CedeScriptHandler);
export const cedeScript = 'builtIns.cedeScript';
