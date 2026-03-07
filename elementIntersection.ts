// Element intersection observation for MountObserver
import type { MountConfig, WeakDual } from './types/mount-observer/types.js';
import { DismountEvent } from './Events.js';

export function setupElementIntersection(
    init: MountConfig,
    rootNodeRef: WeakRef<Node>,
    mountedElements: WeakDual<Element>,
    modules: any[],
    observer: EventTarget,
    matchesSelector: (element: Element) => boolean,
    handleMatch: (element: Element) => void
): {
    intersectionObserver: IntersectionObserver;
    observeElement: (element: Element) => void;
    cleanup: () => void;
} {
    const { whereElementIntersectsWith } = init;
    
    if (!whereElementIntersectsWith) {
        throw new Error('whereElementIntersectsWith is required');
    }
    
    // Track which elements are currently intersecting
    const intersectingElements = new WeakSet<Element>();
    
    // Create IntersectionObserver with the provided options
    const intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const element = entry.target as Element;
            
            if (entry.isIntersecting) {
                // Element is now intersecting
                intersectingElements.add(element);
                
                // Check if element matches all other conditions and mount if so
                if (matchesSelector(element)) {
                    handleMatch(element);
                }
            } else {
                // Element is no longer intersecting
                intersectingElements.delete(element);
                
                // Dismount if it was mounted
                if (mountedElements.weakSet.has(element)) {
                    dismountElement(element);
                }
            }
        }
    }, whereElementIntersectsWith);
    
    function dismountElement(element: Element): void {
        // Remove from mounted elements
        mountedElements.weakSet.delete(element);
        for (const ref of mountedElements.setWeak) {
            if (ref.deref() === element) {
                mountedElements.setWeak.delete(ref);
                break;
            }
        }
        
        // Dispatch dismount event
        observer.dispatchEvent(new DismountEvent(element, 'intersection-failed', init));
    }
    
    function observeElement(element: Element): void {
        intersectionObserver.observe(element);
    }
    
    return {
        intersectionObserver,
        observeElement,
        cleanup: () => {
            intersectionObserver.disconnect();
        }
    };
}

/**
 * Check if an element is currently intersecting
 * This is called from #matchesSelector to determine if intersection condition is met
 */
export function isElementIntersecting(
    element: Element,
    intersectionObserver: IntersectionObserver | undefined
): boolean {
    // If no intersection observer is set up, consider all elements as intersecting
    if (!intersectionObserver) {
        return true;
    }
    
    // When intersection observer is active, we can't synchronously determine intersection state
    // The element will be observed and the callback will handle mounting when it intersects
    // Return false here to prevent immediate mounting
    return false;
}
