import type { AttrChange, MountInit } from './types.d.ts';

/**
 * Checks for attribute changes on a mounted element.
 * This module is dynamically loaded only when whereAttr is configured.
 */
export function checkAttrChanges(
    element: Element,
    mountInit: MountInit,
    buildAttrCoordinateMapFn: (whereAttr: any, isCustomElement: boolean) => any,
    elementAttrStates: WeakMap<Element, Map<string, string | null>>,
    elementOnceAttrs: WeakMap<Element, Set<string>>
): AttrChange[] {
    if (!mountInit.whereAttr || !buildAttrCoordinateMapFn) {
        return [];
    }
    
    const isCustomElement = element.tagName.toLowerCase().includes('-');
    const attrCoordMap = buildAttrCoordinateMapFn(mountInit.whereAttr, isCustomElement);
    
    // Get or create the attribute state for this element
    let attrState = elementAttrStates.get(element);
    if (!attrState) {
        attrState = new Map<string, string | null>();
        elementAttrStates.set(element, attrState);
    }
    
    const changes: AttrChange[] = [];
    const currentAttrs = new Set<string>();
    
    // Check all possible attributes from the coordinate map
    for (const attrName of Object.keys(attrCoordMap)) {
        const coordinate = attrCoordMap[attrName];
        const currentValue = element.getAttribute(attrName);
        const previousValue = attrState.get(attrName);
        
        if (currentValue !== null) {
            currentAttrs.add(attrName);
        }
        
        // Check if this attribute has "once: true" in its map entry
        const mapEntry = mountInit.map?.[coordinate] || null;
        const isOnce = mapEntry?.once === true;
        
        // If "once" is true, check if we've already seen this attribute
        if (isOnce) {
            let onceAttrs = elementOnceAttrs.get(element);
            if (!onceAttrs) {
                onceAttrs = new Set<string>();
                elementOnceAttrs.set(element, onceAttrs);
            }
            
            // If we've already seen this attribute, skip it
            if (onceAttrs.has(attrName)) {
                continue;
            }
            
            // Mark this attribute as seen if it currently has a value
            if (currentValue !== null) {
                onceAttrs.add(attrName);
            }
        }
        
        // Include if: currently has value OR previously had value but now removed
        if (currentValue !== null || (previousValue !== undefined && currentValue === null)) {
            // Check if value changed
            if (currentValue !== previousValue) {
                const attrNode = currentValue !== null ? element.getAttributeNode(attrName) : null;
                
                changes.push({
                    value: currentValue,
                    attrNode,
                    mapEntry,
                    attrName,
                    coordinate,
                    element
                });
                
                // Update state
                if (currentValue !== null) {
                    attrState.set(attrName, currentValue);
                } else {
                    attrState.delete(attrName);
                }
            }
        }
    }
    
    return changes;
}
