import { WhereAttr } from './types.js';

/**
 * Checks if an element matches the whereAttr configuration
 */
export function matchesWhereAttr(element: Element, whereAttr: WhereAttr): boolean {
    const isCustomElement = element.tagName.toLowerCase().includes('-');
    const rootPrefixes = isCustomElement 
        ? (whereAttr.hasCERootIn || [])
        : (whereAttr.hasBuiltInRootIn || []);

    // Parse base attribute for custom delimiter
    const { delimiter: baseDelimiter, name: baseName } = parseDelimiter(whereAttr.hasBase);

    // Try each valid prefix to see if element matches
    for (const prefix of rootPrefixes) {
        const baseAttrName = buildAttributeName(prefix, baseName, baseDelimiter);
        const hasBaseAttr = element.hasAttribute(baseAttrName);

        // If no branches specified, just having the base attribute is enough
        if (!whereAttr.hasBranchIn || whereAttr.hasBranchIn.length === 0) {
            if (hasBaseAttr) {
                return true;
            }
            continue;
        }

        // Check if any branch combination matches
        const branchMatches = whereAttr.hasBranchIn.some(branch => {
            if (branch === '') {
                // Empty string means base attribute alone is valid (no branch attributes)
                if (hasBaseAttr && !hasAnyBranchAttributes(element, prefix, baseName, baseDelimiter, whereAttr.hasBranchIn!)) {
                    return true;
                }
                return false;
            }

            if (typeof branch === 'object') {
                // Check if any key in the branch object matches
                // Note: base attribute is optional when branch attributes are present
                return Object.entries(branch).some(([key, subBranches]) => {
                    return checkBranch(element, prefix, baseName, baseDelimiter, key, subBranches);
                });
            }

            return false;
        });

        if (branchMatches) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if element has any branch attributes defined in hasBranchIn
 */
function hasAnyBranchAttributes(
    element: Element,
    prefix: string,
    baseName: string,
    baseDelimiter: string,
    hasBranchIn: any[]
): boolean {
    const baseAttrName = buildAttributeName(prefix, baseName, baseDelimiter);
    
    // Check all branch definitions to see if element has any of those attributes
    for (const branch of hasBranchIn) {
        if (branch === '') continue;
        
        if (typeof branch === 'object') {
            for (const [key] of Object.entries(branch)) {
                const { delimiter: branchDelimiter, name: branchName } = parseDelimiter(key);
                const branchAttrName = baseAttrName + branchDelimiter + branchName;
                if (element.hasAttribute(branchAttrName)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * Recursively checks if a branch path exists on the element.
 * Returns true if ANY valid path in the branch tree exists on the element.
 */
function checkBranch(
    element: Element,
    prefix: string,
    baseName: string,
    baseDelimiter: string,
    branchKey: string,
    subBranches: any[]
): boolean {
    const { delimiter: branchDelimiter, name: branchName } = parseDelimiter(branchKey);
    const baseAttrName = buildAttributeName(prefix, baseName, baseDelimiter);
    const branchAttrName = baseAttrName + branchDelimiter + branchName;

    const hasBranchAttr = element.hasAttribute(branchAttrName);

    // If no sub-branches specified, just check if this branch attribute exists
    if (!subBranches || subBranches.length === 0) {
        return hasBranchAttr;
    }

    // Check sub-branches - they form an OR condition
    const subBranchMatches = subBranches.some(subBranch => {
        if (subBranch === '') {
            // Empty string means this branch level alone is valid
            return hasBranchAttr;
        }

        if (typeof subBranch === 'string') {
            // Simple string sub-branch - check if the full path exists
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = branchAttrName + subDelimiter + subName;
            return element.hasAttribute(subAttrName);
        }

        if (typeof subBranch === 'object') {
            // Nested object sub-branch - recursively check deeper paths
            return Object.entries(subBranch).some(([key, nestedBranches]) => {
                return checkNestedBranch(element, branchAttrName, key, nestedBranches as any[]);
            });
        }

        return false;
    });

    return subBranchMatches;
}

/**
 * Checks nested branches recursively.
 * Returns true if ANY valid path in the nested branch tree exists on the element.
 */
function checkNestedBranch(
    element: Element,
    parentAttrName: string,
    branchKey: string,
    subBranches: any[]
): boolean {
    const { delimiter, name } = parseDelimiter(branchKey);
    const attrName = parentAttrName + delimiter + name;

    const hasAttr = element.hasAttribute(attrName);

    // If no sub-branches specified, just check if this attribute exists
    if (!subBranches || subBranches.length === 0) {
        return hasAttr;
    }

    // Check sub-branches - they form an OR condition
    return subBranches.some(subBranch => {
        if (subBranch === '') {
            // Empty string means this level alone is valid
            return hasAttr;
        }

        if (typeof subBranch === 'string') {
            // Simple string sub-branch - check if the full path exists
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = attrName + subDelimiter + subName;
            return element.hasAttribute(subAttrName);
        }

        if (typeof subBranch === 'object') {
            // Nested object - recursively check deeper paths
            return Object.entries(subBranch).some(([key, nestedBranches]) => {
                return checkNestedBranch(element, attrName, key, nestedBranches as any[]);
            });
        }

        return false;
    });
}

/**
 * Parses a key to extract custom delimiter and name
 * Format: [delimiter]name
 * Example: "[_]my-custom" returns { delimiter: "_", name: "my-custom" }
 */
function parseDelimiter(key: string): { delimiter: string; name: string } {
    const match = key.match(/^\[(.+?)\](.+)$/);
    if (match) {
        return {
            delimiter: match[1],
            name: match[2]
        };
    }
    return {
        delimiter: '-',
        name: key
    };
}

/**
 * Builds the full attribute name from prefix, base name, and delimiter
 */
function buildAttributeName(prefix: string, baseName: string, delimiter: string): string {
    if (prefix === '') {
        return baseName;
    }
    return prefix + delimiter + baseName;
}
