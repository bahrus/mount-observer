export function getWhereAttrSelector(whereAttr, withoutAttrs) {
    const { hasBase, hasBranchIn, hasRootIn } = whereAttr;
    const hasRootInGuaranteed = hasRootIn || [{
            start: '',
            context: 'Both'
        }];
    const fullListOfAttrs = [];
    const partitionedAttrs = [];
    let prefixLessMatches = [];
    const hasBaseIsString = typeof hasBase === 'string';
    const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
    const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
    if (hasBranchIn !== undefined) {
        let baseToBranchDelimiter = '-';
        let branches;
        if (hasBranchIn.length === 2 && Array.isArray(hasBranchIn[1])) {
            baseToBranchDelimiter = hasBranchIn[0];
            branches = hasBranchIn[1];
        }
        else {
            branches = hasBranchIn;
        }
        prefixLessMatches = branches.map(x => ({
            rootToBaseDelimiter,
            base: baseSelector,
            baseToBranchDelimiter,
            branch: x
        }));
    }
    else {
        prefixLessMatches.push({
            rootToBaseDelimiter,
            base: baseSelector,
        });
    }
    for (const rootCnfg of hasRootInGuaranteed) {
        const { start } = rootCnfg;
        for (const match of prefixLessMatches) {
            const { base, baseToBranchDelimiter, branch, rootToBaseDelimiter } = match;
            for (const prefixLessMatch of prefixLessMatches) {
                const { base, baseToBranchDelimiter, branch } = prefixLessMatch;
                const startAndRootToBaseDelimiter = start ? `${start}${rootToBaseDelimiter}` : '';
                if (branch) {
                    const name = `${startAndRootToBaseDelimiter}${base}${baseToBranchDelimiter}${branch}`;
                    fullListOfAttrs.push(name);
                    partitionedAttrs.push({
                        root: start,
                        name,
                        base,
                        branch,
                        rootCnfg
                    });
                }
                else {
                    const name = `${startAndRootToBaseDelimiter}${base}`;
                    fullListOfAttrs.push(name);
                    partitionedAttrs.push({
                        root: start,
                        name,
                        base,
                        rootCnfg
                    });
                }
            }
        }
    }
    const listOfSelectors = fullListOfAttrs.map(s => `${withoutAttrs}[${s}]`);
    const calculatedSelector = listOfSelectors.join(',');
    return {
        fullListOfAttrs,
        calculatedSelector,
        partitionedAttrs,
    };
}
