const selectorCache = new WeakMap();
/**
 * Checks if an element matches the whereAttr configuration using CSS selector matching
 */
export function matchesWhereAttr(element, whereAttr) {
    // Get or build the CSS selectors for this whereAttr config
    let selectors = selectorCache.get(whereAttr);
    if (!selectors) {
        selectors = {
            builtIn: buildWhereAttrSelector(false, whereAttr),
            custom: buildWhereAttrSelector(true, whereAttr)
        };
        selectorCache.set(whereAttr, selectors);
    }
    // Determine which selector to use based on element type
    const isCustomElement = element.tagName.toLowerCase().includes('-');
    const selector = isCustomElement ? selectors.custom : selectors.builtIn;
    // Use native CSS matching - optimized in Chrome/Blink
    return element.matches(selector);
}
/**
 * Builds a CSS selector string from the whereAttr configuration
 * @param isCustomElement - Whether to build selector for custom elements (true) or built-in elements (false)
 */
function buildWhereAttrSelector(isCustomElement, whereAttr) {
    const rootPrefixes = isCustomElement
        ? (whereAttr.hasCERootIn || [])
        : (whereAttr.hasBuiltInRootIn || []);
    // Parse base attribute for custom delimiter
    const { delimiter: baseDelimiter, name: baseName } = parseDelimiter(whereAttr.hasBase);
    const selectors = [];
    // Build selectors for each valid prefix
    for (const prefix of rootPrefixes) {
        const baseAttrName = buildAttributeName(prefix, baseName, baseDelimiter);
        const escapedBaseAttr = escapeAttributeName(baseAttrName);
        // If no branches specified, just having the base attribute is enough
        if (!whereAttr.hasBranchIn || whereAttr.hasBranchIn.length === 0) {
            selectors.push(`[${escapedBaseAttr}]`);
            continue;
        }
        // Build selectors for each branch combination
        for (const branch of whereAttr.hasBranchIn) {
            if (branch === '') {
                // Empty string means base attribute alone is valid (no branch attributes)
                // This requires base attr AND none of the branch attrs
                // For CSS, we can only check for base attr presence
                // The "no branch attrs" check needs to be done separately
                selectors.push(`[${escapedBaseAttr}]`);
                continue;
            }
            if (typeof branch === 'object') {
                // Build selectors for each branch path
                for (const [key, subBranches] of Object.entries(branch)) {
                    const branchSelectors = buildBranchSelectors(baseAttrName, key, subBranches);
                    selectors.push(...branchSelectors);
                }
            }
        }
    }
    // Join all selectors with comma (OR logic)
    return selectors.join(',');
}
/**
 * Builds CSS selectors for a branch and its sub-branches
 */
function buildBranchSelectors(baseAttrName, branchKey, subBranches) {
    const { delimiter: branchDelimiter, name: branchName } = parseDelimiter(branchKey);
    const branchAttrName = baseAttrName + branchDelimiter + branchName;
    const escapedBranchAttr = escapeAttributeName(branchAttrName);
    const selectors = [];
    // If no sub-branches specified, just the branch attribute itself
    if (!subBranches || subBranches.length === 0) {
        selectors.push(`[${escapedBranchAttr}]`);
        return selectors;
    }
    // Build selectors for each sub-branch - they form an OR condition
    for (const subBranch of subBranches) {
        if (subBranch === '') {
            // Empty string means this branch level alone is valid
            selectors.push(`[${escapedBranchAttr}]`);
            continue;
        }
        if (typeof subBranch === 'string') {
            // Simple string sub-branch - build the full path
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = branchAttrName + subDelimiter + subName;
            const escapedSubAttr = escapeAttributeName(subAttrName);
            selectors.push(`[${escapedSubAttr}]`);
            continue;
        }
        if (typeof subBranch === 'object') {
            // Nested object sub-branch - recursively build deeper paths
            for (const [key, nestedBranches] of Object.entries(subBranch)) {
                const nestedSelectors = buildNestedBranchSelectors(branchAttrName, key, nestedBranches);
                selectors.push(...nestedSelectors);
            }
        }
    }
    return selectors;
}
/**
 * Builds CSS selectors for nested branches recursively
 */
function buildNestedBranchSelectors(parentAttrName, branchKey, subBranches) {
    const { delimiter, name } = parseDelimiter(branchKey);
    const attrName = parentAttrName + delimiter + name;
    const escapedAttr = escapeAttributeName(attrName);
    const selectors = [];
    // If no sub-branches specified, just this attribute
    if (!subBranches || subBranches.length === 0) {
        selectors.push(`[${escapedAttr}]`);
        return selectors;
    }
    // Build selectors for each sub-branch - they form an OR condition
    for (const subBranch of subBranches) {
        if (subBranch === '') {
            // Empty string means this level alone is valid
            selectors.push(`[${escapedAttr}]`);
            continue;
        }
        if (typeof subBranch === 'string') {
            // Simple string sub-branch - build the full path
            const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
            const subAttrName = attrName + subDelimiter + subName;
            const escapedSubAttr = escapeAttributeName(subAttrName);
            selectors.push(`[${escapedSubAttr}]`);
            continue;
        }
        if (typeof subBranch === 'object') {
            // Nested object - recursively build deeper paths
            for (const [key, nestedBranches] of Object.entries(subBranch)) {
                const nestedSelectors = buildNestedBranchSelectors(attrName, key, nestedBranches);
                selectors.push(...nestedSelectors);
            }
        }
    }
    return selectors;
}
/**
 * Escapes special characters in attribute names for CSS selectors
 * Uses CSS.escape() API which handles all special characters including :
 */
function escapeAttributeName(attrName) {
    // CSS.escape() is available in all modern browsers
    // It properly escapes special characters like : . [ ] etc.
    return CSS.escape(attrName);
}
/**
 * Parses a key to extract custom delimiter and name
 * Format: [delimiter]name
 * Example: "[_]my-custom" returns { delimiter: "_", name: "my-custom" }
 */
function parseDelimiter(key) {
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
function buildAttributeName(prefix, baseName, delimiter) {
    if (prefix === '') {
        return baseName;
    }
    return prefix + delimiter + baseName;
}
