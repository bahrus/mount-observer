import './ElementMountExtension.js';
import { waitForEvent } from 'assign-gingerly/waitForEvent.js';
import { AddedScriptElementEvent } from './Events.js';
import 'mount-observer/handlers/MountObserverScript.js';
import { mos } from 'mount-observer/handlers/MountObserverScript.js';
import 'mount-observer/handlers/ScriptExport.js';
import { scriptExport } from 'mount-observer/handlers/ScriptExport.js';
import 'mount-observer/handlers/HTMLInclude.js';
import { include } from 'mount-observer/handlers/HTMLInclude.js';
import 'mount-observer/handlers/HoistTemplate.js';
import { hoist } from 'mount-observer/handlers/HoistTemplate.js';
import { emc } from 'mount-observer/handlers/EMCScript.js';
import 'mount-observer/handlers/EMCScript.js';
import 'mount-observer/handlers/EMCParserScript.js';
import { emcParser } from 'mount-observer/handlers/EMCParserScript.js';
import 'mount-observer/handlers/GenIds.js';
import { genIds } from 'mount-observer/handlers/GenIds.js';
import 'mount-observer/handlers/CedeScript.js';
import { cedeScript } from 'mount-observer/handlers/CedeScript.js';
/**
 * Track which root nodes have already had handlers activated.
 * Uses WeakSet to avoid memory leaks when nodes are garbage collected.
 */
const activatedRootNodes = new WeakSet();
/**
 * Abstract base class for syndicating mount observer and EMC script elements across shadow roots.
 *
 * Synthesizer instances act as either:
 * - Syndicator (in document root): Broadcasts script elements to subscribers
 * - Subscriber (in shadow roots): Receives and clones script elements from syndicator
 *
 * Ensures that handlers are only activated once per root node, even if multiple
 * Synthesizer instances exist in the same root.
 *
 * Usage:
 * ```javascript
 * class MySynthesizer extends Synthesizer {}
 * customElements.define('my-synthesizer', MySynthesizer);
 * ```
 *
 * ```html
 * <!-- Syndicator in document -->
 * <my-synthesizer>
 *   <script type="mountobserver">...</script>
 *   <script type="emc">...</script>
 * </my-synthesizer>
 *
 * <!-- Subscriber in shadow root -->
 * <my-component>
 *   #shadow-root
 *     <my-synthesizer></my-synthesizer>
 * </my-component>
 * ```
 */
export class Synthesizer extends HTMLElement {
    #mutationObserver;
    #isSyndicator = false;
    /**
     * List of built-in handlers to activate.
     */
    static builtInHandlers = [
        mos, scriptExport, include, hoist, genIds, emcParser, emc, cedeScript
    ];
    connectedCallback() {
        // Synthesizer elements are infrastructure, not UI
        this.hidden = true;
        // Identify the root node
        const rootNode = this.getRootNode();
        // Determine if this is a syndicator or subscriber
        this.#isSyndicator = rootNode === document;
        // Activate handlers on the root node
        this.#activateHandlers(rootNode);
        if (this.#isSyndicator) {
            // Act as syndicator
            this.#initializeSyndicator();
        }
        else {
            // Act as subscriber
            this.#initializeSubscriber();
        }
    }
    disconnectedCallback() {
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
        }
    }
    /**
     * Activate mount observer handlers in the specified root node.
     * Only activates once per root node, even if multiple Synthesizer instances exist.
     */
    async #activateHandlers(rootNode) {
        // Check if handlers have already been activated for this root node
        if (activatedRootNodes.has(rootNode)) {
            return;
        }
        // Mark this root node as activated
        activatedRootNodes.add(rootNode);
        const constructor = this.constructor;
        for (const handlerName of constructor.builtInHandlers) {
            try {
                await rootNode.mount({
                    do: handlerName
                });
            }
            catch (error) {
                console.error(`Synthesizer: Failed to activate handler ${handlerName}:`, error);
            }
        }
    }
    /**
     * Check if a script element should be processed based on include/exclude attributes.
     *
     * Rules:
     * - If passthrough attribute exists, return false (don't process any scripts)
     * - If include or exclude attributes exist and script has no id, return false (security)
     * - If include attribute exists, only process scripts with IDs in the include list
     * - If exclude attribute exists, don't process scripts with IDs in the exclude list
     * - Otherwise, return true (process the script)
     *
     * Made protected so subscribers can check if syndicator would allow a script.
     */
    checkIfAllowed(scriptElement) {
        // Passthrough mode - don't process any scripts
        if (this.hasAttribute('passthrough')) {
            return false;
        }
        const scriptId = scriptElement.getAttribute('id');
        // Security: If include or exclude attributes exist, script must have an ID
        if ((this.hasAttribute('include') || this.hasAttribute('exclude')) && !scriptId) {
            return false;
        }
        // Include list - only process scripts with IDs in the list
        if (this.hasAttribute('include')) {
            const includeList = this.getAttribute('include').split(' ').filter(s => s.trim());
            if (!includeList.includes(scriptId)) {
                return false;
            }
        }
        // Exclude list - don't process scripts with IDs in the list
        if (this.hasAttribute('exclude')) {
            const excludeList = this.getAttribute('exclude').split(' ').filter(s => s.trim());
            if (excludeList.includes(scriptId)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Initialize as syndicator (in document root).
     * Watches for script elements and broadcasts them to subscribers.
     */
    #initializeSyndicator() {
        // Process existing script elements
        const scripts = this.querySelectorAll('script[type="mountobserver"], script[type="emc"], script[type="emc-parser"], script[type="cede"]');
        scripts.forEach(script => {
            if (this.checkIfAllowed(script)) {
                this.#broadcastScript(script);
            }
        });
        // Watch for new script elements
        this.#mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLScriptElement) {
                        const type = node.getAttribute('type');
                        if (type === 'mountobserver' || type === 'emc' || type === 'emc-parser' || type === 'cede') {
                            if (this.checkIfAllowed(node)) {
                                this.#broadcastScript(node);
                            }
                        }
                    }
                }
            }
        });
        this.#mutationObserver.observe(this, {
            childList: true,
            subtree: false
        });
    }
    /**
     * Broadcast a script element to subscribers.
     */
    #broadcastScript(scriptElement) {
        this.dispatchEvent(new AddedScriptElementEvent(scriptElement));
    }
    /**
     * Initialize as subscriber (in shadow root).
     * Subscribes to syndicator and processes script elements.
     */
    #initializeSubscriber() {
        // Find the syndicator in document root
        const syndicator = document.querySelector(this.localName);
        if (!syndicator) {
            console.warn(`Synthesizer: No syndicator found in document for ${this.localName}`);
            return;
        }
        // Process existing scripts from syndicator
        // Only process scripts that pass the syndicator's filtering
        const scripts = syndicator.querySelectorAll('script[type="mountobserver"], script[type="emc"], script[type="emc-parser"], script[type="cede"]');
        scripts.forEach(script => {
            if (syndicator.checkIfAllowed(script)) {
                this.#processScript(script);
            }
        });
        // Subscribe to new scripts
        syndicator.addEventListener(AddedScriptElementEvent.eventName, (e) => {
            const event = e;
            this.#processScript(event.scriptElement);
        });
    }
    /**
     * Process a script element from the syndicator.
     * Waits for export property, then clones and appends.
     */
    async #processScript(scriptElement) {
        try {
            // Check if export property exists
            let exportValue = scriptElement.export;
            const scriptType = scriptElement.getAttribute('type');
            if (!exportValue && scriptType !== 'emc-parser') {
                // Wait for the export to become available via the 'resolved' event.
                // Use a polling check as a fallback in case the event already fired.
                exportValue = await new Promise((resolve) => {
                    // Check immediately in case it was set between our first check and now
                    if (scriptElement.export) {
                        resolve(scriptElement.export);
                        return;
                    }
                    const onResolved = (e) => {
                        clearInterval(poll);
                        resolve(e.export || scriptElement.export);
                    };
                    scriptElement.addEventListener('resolved', onResolved, {once: true});
                    // Poll as safety net in case event already fired
                    const poll = setInterval(() => {
                        if (scriptElement.export) {
                            scriptElement.removeEventListener('resolved', onResolved);
                            clearInterval(poll);
                            resolve(scriptElement.export);
                        }
                    }, 50);
                });
            }
            // Clone the script element
            const clonedScript = scriptElement.cloneNode(true);
            // Copy the export property if it exists
            if (exportValue !== undefined) {
                clonedScript.export = exportValue;
            }
            // Append to this element's children
            this.appendChild(clonedScript);
        }
        catch (error) {
            console.error('Synthesizer: Failed to process script element:', error);
        }
    }
}
