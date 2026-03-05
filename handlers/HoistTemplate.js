import { EvtRt } from '../EvtRt.js';
/**
 * Symbol for tracking hoisted template references.
 * Uses a compact GUID to ensure uniqueness - this is essentially private.
 */
const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');
/**
 * Handler that hoists template elements from shadow roots to document.head for performance.
 *
 * When templates with IDs are repeated across multiple custom elements, moving them to
 * a centralized location reduces memory usage and improves cloning performance.
 *
 * The handler:
 * 1. Moves template content to a new template in document.head
 * 2. Updates the original template to reference the hoisted version via src="#id"
 * 3. Defines a remoteContent getter that returns the hoisted template's content
 */
export class HoistTemplateHandler extends EvtRt {
    static matching = 'template[id]:not([src])';
    static whereInstanceOf = HTMLTemplateElement;
    static shouldMount(el) {
        const template = el;
        // Don't hoist if empty
        if (template.content.childNodes.length === 0)
            return false;
        // Case 1: Not connected (being cloned)
        // MountObserver checks conditions even before fragment becomes connected
        if (!template.isConnected)
            return true;
        // Case 2: Connected but in a shadow root
        const root = template.getRootNode();
        return root instanceof ShadowRoot;
    }
    mount(mountedElement, mountConfig, context) {
        hoistTemplate(mountedElement);
    }
}
/**
 * Hoists a template element to document.head and sets up the remoteContent getter.
 *
 * @param templ - The template element to hoist
 */
function hoistTemplate(templ) {
    // Skip if already has remoteContent property
    if (templ.hasOwnProperty('remoteContent'))
        return;
    const { head } = document;
    // Initialize counter on globalThis
    if (globalThis[remoteTemplElSym] === undefined) {
        globalThis[remoteTemplElSym] = 0;
    }
    // Create hoisted template in head with unique ID
    const id = `mount-observer-${globalThis[remoteTemplElSym]++}`;
    const sourceTempl = document.createElement('template');
    sourceTempl.id = id;
    sourceTempl.setAttribute('data-mount-observer-hoisted', 'true');
    sourceTempl.content.appendChild(templ.content);
    head.append(sourceTempl);
    // Update original template to reference the hoisted version
    templ.innerHTML = '';
    templ.setAttribute('src', `#${id}`);
    templ.setAttribute('rel', 'preload');
    templ[remoteTemplElSym] = new WeakRef(sourceTempl);
    // Define remoteContent getter
    Object.defineProperty(templ, 'remoteContent', {
        get() {
            const test = this[remoteTemplElSym]?.deref();
            if (test !== undefined)
                return test.content;
            throw new Error('Hoisted template not found or was garbage collected');
        },
        configurable: true
    });
}
// Register the handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.hoistTemplate', HoistTemplateHandler);
