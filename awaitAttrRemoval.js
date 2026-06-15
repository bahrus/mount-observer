/**
 * Returns a Promise that resolves when the specified attribute is removed from the element.
 * If the attribute is already absent, resolves immediately.
 *
 * Uses a minimal MutationObserver filtered to the single attribute.
 * The observer disconnects as soon as the attribute is removed.
 *
 * @param el - The element to observe
 * @param attr - The attribute name to wait for removal of
 */
export function awaitAttrRemoval(el, attr) {
    if (!el.hasAttribute(attr))
        return Promise.resolve();
    return new Promise(resolve => {
        const mo = new MutationObserver(() => {
            if (!el.hasAttribute(attr)) {
                mo.disconnect();
                resolve();
            }
        });
        mo.observe(el, { attributes: true, attributeFilter: [attr] });
    });
}
