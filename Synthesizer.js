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
        mos, scriptExport, include, hoist, emc
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
     * Initialize as syndicator (in document root).
     * Watches for script elements and broadcasts them to subscribers.
     */
    #initializeSyndicator() {
        // Process existing script elements
        const scripts = this.querySelectorAll('script[type="mountobserver"], script[type="emc"]');
        scripts.forEach(script => {
            this.#broadcastScript(script);
        });
        // Watch for new script elements
        this.#mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLScriptElement) {
                        const type = node.getAttribute('type');
                        if (type === 'mountobserver' || type === 'emc') {
                            this.#broadcastScript(node);
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
        const scripts = syndicator.querySelectorAll('script[type="mountobserver"], script[type="emc"]');
        scripts.forEach(script => {
            this.#processScript(script);
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
            if (!exportValue) {
                // Wait for resolved event with timeout
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for resolved event')), 5000));
                const eventPromise = waitForEvent(scriptElement, 'resolved');
                const event = await Promise.race([eventPromise, timeoutPromise]);
                exportValue = event.export;
            }
            // Clone the script element
            const clonedScript = scriptElement.cloneNode(true);
            // Copy the export property
            clonedScript.export = exportValue;
            // Append to this element's children
            this.appendChild(clonedScript);
        }
        catch (error) {
            console.error('Synthesizer: Failed to process script element:', error);
        }
    }
}
