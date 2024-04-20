import {AttrParts, WhereAttr} from './types';
export function getWhereAttrSelector(whereAttr: WhereAttr, withoutAttrs: string){
    const {hasBase, hasBranchIn, hasRootIn} = whereAttr;
    if(hasRootIn === undefined) throw 400;
    const fullListOfAttrs: Array<string> = [];
    const partitionedAttrs: Array<AttrParts> = [];
    let prefixLessMatches: Array<{
        rootToBaseDelimiter: string,
        base: string,
        branch?: string,
        leaf?: string //todo,
        baseToBranchDelimiter?: string,
    }> = [];
    const hasBaseIsString = typeof hasBase === 'string';
    const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
    const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
    if(hasBranchIn !== undefined){
        let baseToBranchDelimiter = '-';
        let branches: Array<string> | undefined;
        if(hasBranchIn.length === 2 && Array.isArray(hasBranchIn[1])){
            baseToBranchDelimiter = hasBranchIn[0];
            branches = hasBranchIn[1];
        }else{
            branches = hasBranchIn as Array<string>;
        }
        prefixLessMatches = branches.map(x => ({
            rootToBaseDelimiter,
            base: baseSelector,
            baseToBranchDelimiter,
            branch: x
        }));
    }else{
        prefixLessMatches.push({
            rootToBaseDelimiter,
            base: baseSelector,
        })
    }
    for(const rootCnfg of hasRootIn){
        const {start} = rootCnfg;
        for(const match of prefixLessMatches){
            const {base, baseToBranchDelimiter, branch, rootToBaseDelimiter} = match;
            for(const prefixLessMatch of prefixLessMatches){
                const {base, baseToBranchDelimiter, branch} = prefixLessMatch;
                if(branch){
                    const name = `${start}${rootToBaseDelimiter}${base}${baseToBranchDelimiter}${branch}`
                    fullListOfAttrs.push(name);
                    partitionedAttrs.push({
                        root: start,
                        name,
                        base,
                        branch,
                        rootCnfg
                    });
                }else{
                    const name = `${start}${rootToBaseDelimiter}${base}`;
                    fullListOfAttrs.push(name);
                    partitionedAttrs.push({
                        root: start,
                        name,
                        base,
                        rootCnfg
                    })
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