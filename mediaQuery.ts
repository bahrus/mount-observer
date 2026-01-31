// Media query handling for MountObserver
import type { MountInit, MountContext } from './types.js';
import { MediaMatchEvent, MediaUnmatchEvent, DismountEvent } from './Events.js';

export function setupMediaQuery(
    init: MountInit,
    rootNodeRef: WeakRef<Node>,
    mountedElements: WeakSet<Element>,
    modules: any[],
    observer: EventTarget,
    processNode: (node: Node) => void
): {
    mediaQueryList: MediaQueryList;
    mediaMatches: boolean;
    cleanup: () => void;
} {
    const { whereMediaMatches } = init;
    
    // Create or use MediaQueryList
    let mediaQueryList: MediaQueryList;
    if (typeof whereMediaMatches === 'string') {
        mediaQueryList = window.matchMedia(whereMediaMatches);
    } else {
        mediaQueryList = whereMediaMatches!;
    }
    
    // Track current state
    let mediaMatches = mediaQueryList.matches;
    
    // Set up change listener
    const mediaChangeHandler = (e: MediaQueryListEvent) => {
        const previousMatches = mediaMatches;
        mediaMatches = e.matches;
        
        if (e.matches && !previousMatches) {
            // Media query now matches - wake up and process elements
            handleMediaMatch();
        } else if (!e.matches && previousMatches) {
            // Media query no longer matches - dismount all elements
            handleMediaUnmatch();
        }
    };
    
    function handleMediaMatch(): void {
        // Dispatch mediamatch event if requested
        if (init.getPlayByPlay) {
            observer.dispatchEvent(new MediaMatchEvent(init));
        }
        
        // Process all elements in the observed node
        const rootNode = rootNodeRef.deref();
        if (rootNode) {
            processNode(rootNode);
        }
    }
    
    function handleMediaUnmatch(): void {
        // Dispatch mediaunmatch event if requested
        if (init.getPlayByPlay) {
            observer.dispatchEvent(new MediaUnmatchEvent(init));
        }
        
        // Dismount all currently mounted elements
        const rootNode = rootNodeRef.deref();
        if (!rootNode) {
            return;
        }
        
        const context: MountContext = {
            modules,
            observer: observer as any,
            observeInfo: {
                rootNode
            }
        };
        
        // Get all mounted elements (we need to iterate through the DOM to find them)
        const mountedElementsList: Element[] = [];
        const collectMountedElements = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (mountedElements.has(element)) {
                    mountedElementsList.push(element);
                }
            }
            node.childNodes.forEach(child => collectMountedElements(child));
        };
        collectMountedElements(rootNode);
        
        // Dismount each element
        for (const element of mountedElementsList) {
            mountedElements.delete(element);
            
            // Call dismount callback
            if (init.do && typeof init.do !== 'function' && init.do.dismount) {
                init.do.dismount(element, context);
            }
            
            // Dispatch dismount event with reason
            observer.dispatchEvent(new DismountEvent(element, 'media-query-failed', init));
        }
    }
    
    mediaQueryList.addEventListener('change', mediaChangeHandler);
    
    return {
        mediaQueryList,
        mediaMatches,
        cleanup: () => {
            mediaQueryList.removeEventListener('change', mediaChangeHandler);
        }
    };
}
