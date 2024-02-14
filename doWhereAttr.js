import { AttrChangeEvent } from "./MountObserver.js";
export function doWhereAttr(whereAttr, attributeName, target, oldValue, mo) {
    const { hasRootIn, hasBase, hasBranchIn } = whereAttr;
    const name = attributeName;
    let restOfName = name;
    let root;
    let branch;
    let idx = 0;
    const hasBaseIsString = typeof hasBase === 'string';
    const baseSelector = hasBaseIsString ? hasBase : hasBase[1];
    const rootToBaseDelimiter = hasBaseIsString ? '-' : hasBase[0];
    if (hasRootIn !== undefined) {
        for (const rootTest in hasRootIn) {
            if (restOfName.startsWith(rootTest)) {
                root = rootTest;
                restOfName = restOfName.substring(root.length + rootToBaseDelimiter.length);
                break;
            }
        }
    }
    if (!restOfName.startsWith(baseSelector))
        return;
    restOfName = restOfName.substring(hasBase.length);
    if (hasBranchIn) {
        for (const branchTest in hasBranchIn) {
            if (restOfName.startsWith(branchTest)) {
                branch = branchTest;
                break;
            }
        }
    }
    const newValue = target.getAttribute(attributeName);
    const attrChangeInfo = {
        name,
        root,
        base: baseSelector,
        branch,
        oldValue,
        newValue,
        idx
    };
    mo.dispatchEvent(new AttrChangeEvent(target, attrChangeInfo));
}
