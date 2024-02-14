import {WhereAttr} from './types';
export function getWhereAttrSelector(whereAttr: WhereAttr, withoutAttrs: string){
    const {hasBase, hasBranchIn, hasRootIn} = whereAttr;
        const fullListOfAttrs: Array<string> = [];
        //TODO:  share this block with doWhereAttr?
        const hasBaseIsString = typeof hasBase === 'string';
        const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
        const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
        //end TODO
        let prefixLessMatches = [baseSelector];
        if(hasBranchIn !== undefined){
            let baseToBranchDelimiter = '-';
            let branches: Array<string> | undefined;
            if(hasBranchIn.length === 2 && Array.isArray(hasBranchIn[1])){
                baseToBranchDelimiter = hasBranchIn[0];
                branches = hasBranchIn[1];
            }else{
                branches = hasBranchIn as Array<string>;
            }
            prefixLessMatches = branches.map(x => `${baseSelector}${baseToBranchDelimiter}x`);
        }

        
        const stems = hasRootIn || [''];
        for(const stem of stems){
            const prefix = typeof stem === 'string' ? stem : stem.path;
            for(const prefixLessMatch of prefixLessMatches){
                fullListOfAttrs.push(prefix.length === 0 ? prefixLessMatch : `${prefix}${rootToBaseDelimiter}${prefixLessMatch}`);
            }
            
        }
        const listOfSelectors = fullListOfAttrs.map(s => `${withoutAttrs}[${s}]`);
        const calculatedSelector = listOfSelectors.join(',');
        return {
            fullListOfAttrs,
            calculatedSelector
        };
        
}