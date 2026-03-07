// Network connection monitoring for MountObserver
import type { MountConfig, MountContext, WeakDual, ConnectionCondition } from './types/mount-observer/types.js';
import { DismountEvent } from './Events.js';

// Extend Navigator type to include connection properties
interface NetworkInformation extends EventTarget {
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
    saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
}

export function setupConnectionMonitor(
    init: MountConfig,
    rootNodeRef: WeakRef<Node>,
    mountedElements: WeakDual<Element>,
    modules: any[],
    observer: EventTarget,
    processNode: (node: Node) => void
): {
    conditionMatches: boolean;
    cleanup: () => void;
} {
    const { whereConnectionHas } = init;
    
    if (!whereConnectionHas) {
        throw new Error('whereConnectionHas is required');
    }
    
    // Get connection object with vendor prefixes
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    // If Network Information API is not supported, warn and pass the condition
    if (!connection) {
        console.warn('Network Information API is not supported in this browser. whereConnectionHas condition will be ignored.');
        return {
            conditionMatches: true,
            cleanup: () => {}
        };
    }
    
    // Check initial condition
    let conditionMatches = evaluateConnectionCondition(connection, whereConnectionHas);
    
    // Set up change listener
    const changeHandler = () => {
        const previousMatches = conditionMatches;
        conditionMatches = evaluateConnectionCondition(connection, whereConnectionHas);
        
        if (conditionMatches && !previousMatches) {
            // Connection now matches - process elements
            handleConditionMatch();
        } else if (!conditionMatches && previousMatches) {
            // Connection no longer matches - dismount all elements
            handleConditionUnmatch();
        }
    };
    
    function handleConditionMatch(): void {
        // Process all elements in the observed node
        const rootNode = rootNodeRef.deref();
        if (rootNode) {
            processNode(rootNode);
        }
    }
    
    function handleConditionUnmatch(): void {
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
            observer.dispatchEvent(new DismountEvent(element, 'connection-failed', init));
        }
    }
    
    // Listen for connection changes
    connection.addEventListener('change', changeHandler);
    
    return {
        conditionMatches,
        cleanup: () => {
            connection.removeEventListener('change', changeHandler);
        }
    };
}

/**
 * Evaluate if the current connection meets the specified conditions
 */
function evaluateConnectionCondition(
    connection: NetworkInformation,
    condition: ConnectionCondition
): boolean {
    // Check effectiveType (e.g., 'slow-2g', '2g', '3g', '4g')
    if (condition.effectiveTypeIn && condition.effectiveTypeIn.length > 0) {
        const effectiveType = connection.effectiveType;
        if (!effectiveType || !condition.effectiveTypeIn.includes(effectiveType)) {
            return false;
        }
    }
    
    // Check downlink (bandwidth in Mbps)
    if (condition.downlinkMin !== undefined) {
        const downlink = connection.downlink;
        if (downlink === undefined || downlink < condition.downlinkMin) {
            return false;
        }
    }
    
    if (condition.downlinkMax !== undefined) {
        const downlink = connection.downlink;
        if (downlink === undefined || downlink > condition.downlinkMax) {
            return false;
        }
    }
    
    // Check RTT (round-trip time in ms)
    if (condition.rttMax !== undefined) {
        const rtt = connection.rtt;
        if (rtt === undefined || rtt > condition.rttMax) {
            return false;
        }
    }
    
    // All conditions passed
    return true;
}
