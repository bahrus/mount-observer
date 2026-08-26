import { waitForSettled } from 'assign-gingerly/utils/waitForSettled.js';
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
export async function initialize(root, options = {}) {
    const { idleMs = 100, timeout, registry } = options;
    // Determine the registry to use
    const reg = registry
        || root.customElementRegistry
        || customElements;
    // Use platform initialize() if available (Chrome 146+, Safari 26+)
    if (typeof reg.initialize === 'function') {
        reg.initialize(root);
    }
    else {
        // Fallback: manually upgrade elements with the older API
        if (typeof reg.upgrade === 'function') {
            if (root instanceof Element) {
                reg.upgrade(root);
            }
            // Upgrade all descendants
            if ('querySelectorAll' in root) {
                const elements = root.querySelectorAll('*');
                elements.forEach((el) => {
                    reg.upgrade(el);
                });
            }
        }
    }
    // Wait for async cascades to settle (with optional timeout)
    await waitForSettled(root, idleMs, timeout);
}
