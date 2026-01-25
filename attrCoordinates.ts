import { WhereAttr, BranchValue } from './types.js';

/**
 * Represents a mapping from attribute name to coordinate
 */
export interface AttrCoordinateMap {
    [attrName: string]: string;
}

/**
 * Builds a map of attribute names to their coordinates based on whereAttr config
 */
export function buildAttrCoordinateMap(whereAttr: WhereAttr, isCustomElement: boolean): AttrCoordinateMap {
    const map: AttrCoordinateMap = {};
    const rootPrefixes = isCustomElement 
        ? (whereAttr.hasCERootIn || [])
        : (whereAttr.hasBuiltInRootIn || []);

    // Parse base attribute for custom delimiter
    const { delimiter: baseDelimiter, name: baseName } = parseDelimiter(whereAttr.hasBase);

    // Build attribute names for each prefix
    for (const prefix of rootPrefixes) {
        const baseAttrName = buildAttributeName(prefix, baseName, baseDelimiter);

        // If no branches specified, just the base attribute
        if (!whereAttr.hasBranchIn || whereAttr.hasBranchIn.length === 0) {
            map[baseAttrName] = '0';
            continue;
        }

        // Process each branch
        for (let i = 0; i < whereAttr.hasBranchIn.length; i++) {
            const branch = whereAttr.hasBranchIn[i];
            
            if (branch === '') {
                // Empty string means base attribute alone is valid
                map[baseAttrName] = '0';
                continue;
            }

            if (typeof branch === 'object') {
                // Process branch object
                processBranch(branch, baseAttrName, String(i), map);
            }
        }
    }

    return map;
}

/**
 * Recursively processes a branch object to build attribute-coordinate mappings
 */
function processBranch(
    branch: { [key: string]: BranchValue[] },
    parentAttrName: string,
    parentCoordinate: string,
    map: AttrCoordinateMap
): void {
    for (const [key, subBranches] of Object.entries(branch)) {
        const { delimiter, name } = parseDelimiter(key);
        const attrName = parentAttrName + delimiter + name;

        // Process sub-branches
        if (!subBranches || subBranches.length === 0) {
            map[attrName] = parentCoordinate;
            continue;
        }

        for (let i = 0; i < subBranches.length; i++) {
            const subBranch = subBranches[i];
            const coordinate = `${parentCoordinate}.${i}`;

            if (subBranch === '') {
                // Empty string means this level alone is valid
                map[attrName] = parentCoordinate;
                continue;
            }

            if (typeof subBranch === 'string') {
                // Simple string sub-branch
                const { delimiter: subDelimiter, name: subName } = parseDelimiter(subBranch);
                const subAttrName = attrName + subDelimiter + subName;
                map[subAttrName] = coordinate;
                continue;
            }

            if (typeof subBranch === 'object') {
                // Nested object - recursively process
                processBranch(subBranch, attrName, coordinate, map);
            }
        }
    }
}

/**
 * Parses a key to extract custom delimiter and name
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
