import { DismountEvent } from './Events.js';
export function setupObservedRootHas(init, rootNodeRef, mountedElements, modules, observer, processNode) {
    const { whereObservedRootHas } = init;
    if (!whereObservedRootHas) {
        throw new Error('whereObservedRootHas is required');
    }
    const rootNode = rootNodeRef.deref();
    if (!rootNode) {
        throw new Error('Root node has been garbage collected');
    }
    // Get the element to query against
    const rootElement = rootNode instanceof Element
        ? rootNode
        : rootNode.documentElement || rootNode.host;
    if (!rootElement) {
        throw new Error('Could not determine root element for whereObservedRootHas');
    }
    // Track current state
    let conditionMatches = !!rootElement.querySelector(whereObservedRootHas);
    // Set up mutation observer to watch for changes
    const mutationObserver = new MutationObserver(() => {
        const previousMatches = conditionMatches;
        conditionMatches = !!rootElement.querySelector(whereObservedRootHas);
        if (conditionMatches && !previousMatches) {
            // Condition now matches - process elements
            handleConditionMatch();
        }
        else if (!conditionMatches && previousMatches) {
            // Condition no longer matches - dismount all elements
            handleConditionUnmatch();
        }
    });
    function handleConditionMatch() {
        // Process all elements in the observed node
        const rootNode = rootNodeRef.deref();
        if (rootNode) {
            processNode(rootNode);
        }
    }
    function handleConditionUnmatch() {
        // Dismount all currently mounted elements
        const rootNode = rootNodeRef.deref();
        if (!rootNode) {
            return;
        }
        const context = {
            modules,
            observer: observer,
            rootNode,
            MountConfig: init
        };
        // Get all mounted elements from the WeakDual setWeak
        const mountedElementsList = [];
        for (const ref of mountedElements.setWeak) {
            const element = ref.deref();
            if (element) {
                mountedElementsList.push(element);
            }
        }
        // Dismount each element
        for (const element of mountedElementsList) {
            // Remove from both structures
            mountedElements.weakSet.delete(element);
            for (const ref of mountedElements.setWeak) {
                if (ref.deref() === element) {
                    mountedElements.setWeak.delete(ref);
                    break;
                }
            }
            // Dispatch dismount event with reason
            observer.dispatchEvent(new DismountEvent(element, 'observed-root-has-failed', init));
        }
    }
    // Observe the root element for changes
    mutationObserver.observe(rootElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: false
    });
    return {
        conditionMatches,
        cleanup: () => {
            mutationObserver.disconnect();
        }
    };
}
