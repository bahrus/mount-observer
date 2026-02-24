import { DismountEvent } from './Events.js';
export function setupRootSizeObserver(init, rootNodeRef, mountedElements, modules, observer, processNode) {
    const { whereObservedRootSizeMatches } = init;
    if (!whereObservedRootSizeMatches) {
        throw new Error('whereObservedRootSizeMatches is required');
    }
    const rootNode = rootNodeRef.deref();
    if (!rootNode) {
        throw new Error('Root node has been garbage collected');
    }
    // Get the element to observe
    const rootElement = rootNode instanceof Element
        ? rootNode
        : rootNode.documentElement;
    if (!rootElement) {
        throw new Error('Could not determine root element for whereObservedRootSizeMatches');
    }
    // Parse the container query condition
    // Container queries use the same syntax as media queries: (min-width: 700px)
    const containerQuery = whereObservedRootSizeMatches;
    // Check if condition currently matches
    let conditionMatches = evaluateContainerQuery(rootElement, containerQuery);
    // Set up ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const previousMatches = conditionMatches;
            conditionMatches = evaluateContainerQuery(entry.target, containerQuery);
            if (conditionMatches && !previousMatches) {
                // Condition now matches - process elements
                handleConditionMatch();
            }
            else if (!conditionMatches && previousMatches) {
                // Condition no longer matches - dismount all elements
                handleConditionUnmatch();
            }
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
            observer.dispatchEvent(new DismountEvent(element, 'root-size-failed', init));
        }
    }
    // Start observing the root element
    resizeObserver.observe(rootElement);
    return {
        conditionMatches,
        cleanup: () => {
            resizeObserver.disconnect();
        }
    };
}
/**
 * Evaluate a container query condition against an element
 * Supports: min-width, max-width, min-height, max-height
 */
function evaluateContainerQuery(element, query) {
    // Parse container query: (min-width: 700px) or (max-height: 500px)
    const match = query.match(/\(([^:]+):\s*([^)]+)\)/);
    if (!match) {
        console.warn(`Invalid container query format: ${query}`);
        return false;
    }
    const [, property, valueStr] = match;
    const prop = property.trim();
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
        console.warn(`Invalid container query value: ${valueStr}`);
        return false;
    }
    // Get element dimensions
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Evaluate condition
    switch (prop) {
        case 'min-width':
            return width >= value;
        case 'max-width':
            return width <= value;
        case 'min-height':
            return height >= value;
        case 'max-height':
            return height <= value;
        default:
            console.warn(`Unsupported container query property: ${prop}`);
            return false;
    }
}
