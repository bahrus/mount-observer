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

    // Check if element has the base attribute with any valid prefix
    let hasBaseAttr = false;
    let matchedPrefix = '';

    for (const prefix of rootPrefixes) {
        const attrName = buildAttributeName(prefix, baseName, baseDelimiter);
        if (element.hasAttribute(attrName)) {
            hasBaseAttr = true;
            matchedPrefix = prefix;
            break;
        }
    }

    if (!hasBaseAttr) {
        return false;
    }

    // If no branches specified, just having the base attribute is enough
    if (!whereAttr.hasBranchIn || whereAttr.hasBranchIn.length === 0) {
        return true;
    }

    // Check if any branch combination matches
    return whereAttr.hasBranchIn.some(branch => {
        if (branch === '') {
            // Empty string means base attribute alone is valid (no branch attributes)
            // Check that element doesn't have any branch attributes
            return !hasAnyBranchAttributes(element, matchedPrefix, baseName, baseDelimiter, whereAttr.hasBranchIn!);
        }

        if (typeof branch === 'object') {
            // Check if any key in the branch object matches
            return Object.entries(branch).some(([key, subBranches]) => {
                return checkBranch(element, matchedPrefix, baseName, baseDelimiter, key, subBranches);
            });
        }

        return false;
    });
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
 * Recursively checks if a branch path exists on the element
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
    const attrName = buildAttributeName(prefix, baseName, baseDelimiter) + branchDelimiter + branchName;

    // Check if this branch attribute exists
    if (!element.hasAttribute(attrName)) {
        return false;
    }

    // If no sub-branches, this branch matches
    if (!subBranches || subBranches.length === 0) {
        return true;
    }

    // Check sub-branches
    return subBranches.some(subBranch => {
        if (subBranch === '') {
            // Empty string means this level is optional
            return true;
        }

        if (typeof subBranch === 'string') {
            // Simple string sub-branch
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = attrName + subDelimiter + subName;
            return element.hasAttribute(subAttrName);
        }

        if (typeof subBranch === 'object') {
            // Nested object sub-branch
            return Object.entries(subBranch).some(([key, nestedBranches]) => {
                return checkNestedBranch(element, attrName, key, nestedBranches as any[]);
            });
        }

        return false;
    });
}

/**
 * Checks nested branches recursively
 */
function checkNestedBranch(
    element: Element,
    parentAttrName: string,
    branchKey: string,
    subBranches: any[]
): boolean {
    const { delimiter, name } = parseDelimiter(branchKey);
    const attrName = parentAttrName + delimiter + name;

    if (!element.hasAttribute(attrName)) {
        return false;
    }

    if (!subBranches || subBranches.length === 0) {
        return true;
    }

    return subBranches.some(subBranch => {
        if (subBranch === '') {
            return true;
        }

        if (typeof subBranch === 'string') {
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = attrName + subDelimiter + subName;
            return element.hasAttribute(subAttrName);
        }

        if (typeof subBranch === 'object') {
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
