import { AttrChangeEvent, MountObserver } from "./MountObserver.js";
import { AttrChangeInfo, WhereAttr } from "./types";

export function doWhereAttr(
    whereAttr: WhereAttr, 
    attributeName: string,
    target: Element,
    oldValue: string | null,
    mo: MountObserver
){
    const {hasRootIn, hasBase, hasBranchIn} = whereAttr;
    const name = attributeName;
    let restOfName = name;
    let root: string | undefined;
    let branch: string | undefined;
    let idx = 0;
    const hasBaseIsString = typeof hasBase === 'string';
    const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
    const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
    if(hasRootIn !== undefined){
        for(const rootTest in hasRootIn){
            if(restOfName.startsWith(rootTest)){
                root = rootTest;
                restOfName = restOfName.substring(root.length + rootToBaseDelimiter.length);
                break;
            }
        }
    }
    
    if(!restOfName.startsWith(baseSelector)) return;
    restOfName = restOfName.substring(hasBase.length);
    if(hasBranchIn){
        for(const branchTest in hasBranchIn){
            if(restOfName.startsWith(branchTest)){
                branch = branchTest;
                break;
            }
        }
    }
    const newValue = target.getAttribute(attributeName);
    const attrChangeInfo: AttrChangeInfo = {
        name,
        root,
        base: baseSelector,
        branch,
        oldValue,
        newValue,
        idx
    }
    mo.dispatchEvent(new AttrChangeEvent(target, attrChangeInfo));
}