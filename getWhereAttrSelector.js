export function getWhereAttrSelector(whereAttr, withoutAttrs) {
    const { hasBase, hasBranchIn, hasRootIn, isIn } = whereAttr;
    const fullListOfAttrs = isIn !== undefined ? [...isIn] : [];
    const partitionedAttrs = [];
    if (hasBase !== undefined) {
        const hasRootInGuaranteed = hasRootIn || [{
                start: '',
                context: 'Both'
            }];
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
                baseToBranchDelimiter: x ? baseToBranchDelimiter : '',
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
                let branchIdx = 0;
                for (const prefixLessMatch of prefixLessMatches) {
                    const { base, baseToBranchDelimiter, branch } = prefixLessMatch;
                    const startAndRootToBaseDelimiter = start ? `${start}${rootToBaseDelimiter}` : '';
                    //TODO:  could probably reduce the size of the code below
                    if (branch) {
                        //will always have branch?
                        const name = `${startAndRootToBaseDelimiter}${base}${baseToBranchDelimiter}${branch}`;
                        fullListOfAttrs.push(name);
                        partitionedAttrs.push({
                            root: start,
                            name,
                            base,
                            branch,
                            branchIdx,
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
                            rootCnfg,
                            branchIdx
                        });
                    }
                    branchIdx++;
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
