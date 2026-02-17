/**
 * Finds the highest scoped container that has the same customElementRegistry as the given element.
 * This is useful for scoped custom element registries where we want to observe within the correct scope.
 *
 * @param element - The element to find the root registry container for
 * @returns The root node or highest parent element with the same customElementRegistry
 */
export function getRootRegistryContainer(element) {
    const rn = element.getRootNode();
    const { customElementRegistry } = element;
    // If root node has the same registry, return it
    if (rn.customElementRegistry === customElementRegistry) {
        return rn;
    }
    // Walk up the parent chain to find the highest element with the same registry
    let parent = element.parentElement;
    while (parent) {
        const prevParent = parent;
        parent = parent.parentElement;
        // If parent has a different registry, return the previous parent
        if (parent && parent.customElementRegistry !== customElementRegistry) {
            return prevParent;
        }
    }
    // If we reached the top without finding a different registry, return the element itself
    return element;
}
