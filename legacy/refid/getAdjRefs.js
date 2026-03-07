import { splitRefs } from './splitRefs.js';
export function getAdjRefs(node) {
    const returnArr = [node];
    if (node.nodeType === node.COMMENT_NODE) {
        const openText = node.data.split(' ')[0];
        const closedText = `/${openText}`;
        let ns = node.nextSibling;
        while (ns) {
            returnArr.push(ns);
            if (node.nodeType === node.COMMENT_NODE && node.data === closedText) {
                return returnArr;
            }
            ns = ns.nextSibling;
        }
    }
    else {
        const el = node;
        const itemref = el.getAttribute('itemref');
        if (itemref === null)
            return returnArr;
        const itemrefList = splitRefs(itemref); // itemref.split(' ').map((id) => id.trim()).filter((id) => id.length > 0);
        if (itemrefList.length === 0)
            return returnArr;
        let ns = el.nextSibling;
        while (ns !== null) {
            if (ns instanceof Element) {
                if (ns.id && itemrefList.includes(ns.id)) {
                    returnArr.push(ns);
                }
            }
            else {
                return returnArr;
            }
            ns = ns.nextSibling;
        }
    }
    return returnArr;
}
