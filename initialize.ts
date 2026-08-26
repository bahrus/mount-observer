import { waitForSettled } from 'assign-gingerly/utils/waitForSettled.js';

/**
 * Options for the `initialize` function.
 */
export interface InitializeOptions {
    /** Debounce window for mutation quiescence (ms). Default: 100 */
    idleMs?: number;
    /** Maximum time to wait before rejecting (ms). Default: none (infinite) */
    timeout?: number;
    /** Custom element registry to use. Defaults to root's registry or global customElements. */
    registry?: CustomElementRegistry;
}

/**
 * Initializes a DOM subtree by upgrading custom elements and waiting for all
 * async cascading effects to settle.
 * 
 * This is designed for "offscreen assembly" — preparing a DocumentFragment
 * (or any detached subtree) so that all custom elements are upgraded, Synthesizer
 * elements activate their handlers, mount observers fire, and async work completes
 * before the fragment is inserted into the live DOM.
 * 
 * Uses `CustomElementRegistry.initialize()` when available (Chrome 146+, Safari 26+),
 * falling back to manual `upgrade()` calls for older browsers.
 * 
 * @param root - The node to initialize (typically a DocumentFragment, Element, or ShadowRoot)
 * @param options - Configuration for idle detection and timeout
 * @throws If timeout is specified and mutations don't quiesce within the timeout window
 * 
 * @example
 * ```typescript
 * import { initialize } from 'mount-observer/initialize.js';
 * 
 * const fragment = template.content.cloneNode(true) as DocumentFragment;
 * 
 * try {
 *     await initialize(fragment, { idleMs: 150, timeout: 5000 });
 *     container.appendChild(fragment); // Safe — all async work is done
 * } catch (e) {
 *     console.error('Fragment did not settle:', e);
 * }
 * ```
 */
export async function initialize(
    root: Node,
    options: InitializeOptions = {}
): Promise<void> {
    const { idleMs = 100, timeout, registry } = options;

    // Determine the registry to use
    const reg: any = registry
        || (root as any).customElementRegistry
        || customElements;

    // Use platform initialize() if available (Chrome 146+, Safari 26+)
    if (typeof reg.initialize === 'function') {
        reg.initialize(root);
    } else {
        // Fallback: manually upgrade elements with the older API
        if (typeof reg.upgrade === 'function') {
            if (root instanceof Element) {
                reg.upgrade(root);
            }
            // Upgrade all descendants
            if ('querySelectorAll' in root) {
                const elements = (root as Element | DocumentFragment).querySelectorAll('*');
                elements.forEach((el: Element) => {
                    reg.upgrade(el);
                });
            }
        }
    }

    // Wait for async cascades to settle (with optional timeout)
    await waitForSettled(root, idleMs, timeout);
}
