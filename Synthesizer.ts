import './ElementMountExtension.js';
import { waitForEvent } from 'assign-gingerly/waitForEvent.js';
import { AddedScriptElementEvent } from './Events.js';

/**
 * Abstract base class for syndicating mount observer and EMC script elements across shadow roots.
 * 
 * Synthesizer instances act as either:
 * - Syndicator (in document root): Broadcasts script elements to subscribers
 * - Subscriber (in shadow roots): Receives and clones script elements from syndicator
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
export abstract class Synthesizer extends HTMLElement {
    #mutationObserver: MutationObserver | undefined;
    #isSyndicator: boolean = false;

    /**
     * List of built-in handlers to activate.
     */
    protected static builtInHandlers = [
        'builtIns.mountObserverScript',
        'builtIns.scriptExport',
        'builtIns.HTMLInclude',
        'builtIns.hoistTemplate',
        'builtIns.emcScript'
    ];

    connectedCallback(): void {
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
        } else {
            // Act as subscriber
            this.#initializeSubscriber();
        }
    }

    disconnectedCallback(): void {
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
        }
    }

    /**
     * Activate mount observer handlers in the specified root node.
     */
    async #activateHandlers(rootNode: Node): Promise<void> {
        const constructor = this.constructor as typeof Synthesizer;
        
        for (const handlerName of constructor.builtInHandlers) {
            try {
                await (rootNode as any).mount({
                    do: handlerName
                });
            } catch (error) {
                console.error(`Synthesizer: Failed to activate handler ${handlerName}:`, error);
            }
        }
    }

    /**
     * Initialize as syndicator (in document root).
     * Watches for script elements and broadcasts them to subscribers.
     */
    #initializeSyndicator(): void {
        // Process existing script elements
        const scripts = this.querySelectorAll('script[type="mountobserver"], script[type="emc"]');
        scripts.forEach(script => {
            this.#broadcastScript(script as HTMLScriptElement);
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
    #broadcastScript(scriptElement: HTMLScriptElement): void {
        this.dispatchEvent(new AddedScriptElementEvent(scriptElement));
    }

    /**
     * Initialize as subscriber (in shadow root).
     * Subscribes to syndicator and processes script elements.
     */
    #initializeSubscriber(): void {
        // Find the syndicator in document root
        const syndicator = document.querySelector(this.localName) as Synthesizer | null;
        
        if (!syndicator) {
            console.warn(`Synthesizer: No syndicator found in document for ${this.localName}`);
            return;
        }
        
        // Process existing scripts from syndicator
        const scripts = syndicator.querySelectorAll('script[type="mountobserver"], script[type="emc"]');
        scripts.forEach(script => {
            this.#processScript(script as HTMLScriptElement);
        });
        
        // Subscribe to new scripts
        syndicator.addEventListener(AddedScriptElementEvent.eventName, (e) => {
            const event = e as AddedScriptElementEvent;
            this.#processScript(event.scriptElement);
        });
    }

    /**
     * Process a script element from the syndicator.
     * Waits for export property, then clones and appends.
     */
    async #processScript(scriptElement: HTMLScriptElement): Promise<void> {
        try {
            // Check if export property exists
            let exportValue = (scriptElement as any).export;
            
            if (!exportValue) {
                // Wait for resolved event with timeout
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout waiting for resolved event')), 5000)
                );
                
                const eventPromise = waitForEvent(scriptElement, 'resolved');
                
                const event = await Promise.race([eventPromise, timeoutPromise]);
                exportValue = (event as any).export;
            }
            
            // Clone the script element
            const clonedScript = scriptElement.cloneNode(true) as HTMLScriptElement;
            
            // Copy the export property
            (clonedScript as any).export = exportValue;
            
            // Append to this element's children
            this.appendChild(clonedScript);
        } catch (error) {
            console.error('Synthesizer: Failed to process script element:', error);
        }
    }
}
