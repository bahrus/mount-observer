// Media query handling for MountObserver
import type { MountConfig, MountContext, WeakDual } from './types/mount-observer/types.js';
import { MediaMatchEvent, MediaUnmatchEvent, DismountEvent } from './Events.js';

export function setupMediaQuery(
    init: MountConfig,
    rootNodeRef: WeakRef<Node>,
    mountedElements: WeakDual<Element>,
    modules: any[],
    observer: EventTarget,
    processNode: (node: Node) => void
): {
    mediaQueryList: MediaQueryList;
    mediaMatches: boolean;
    cleanup: () => void;
} {
    const { withMediaMatching } = init;
    
    // Create or use MediaQueryList
    let mediaQueryList: MediaQueryList;
    if (typeof withMediaMatching === 'string') {
        mediaQueryList = window.matchMedia(withMediaMatching);
    } else {
        mediaQueryList = withMediaMatching!;
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
            rootNode,
            mountConfig: init
        };
        
        // Get all mounted elements from the WeakDual setWeak
        const mountedElementsList: Element[] = [];
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
