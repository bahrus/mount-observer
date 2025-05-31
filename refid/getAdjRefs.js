import { splitRefs } from './splitRefs.js';
export function getAdjRefs(el) {
    const returnArr = [el];
    const itemref = el.getAttribute('itemref');
    if (itemref === null)
        return returnArr;
    const itemrefList = splitRefs(itemref); // itemref.split(' ').map((id) => id.trim()).filter((id) => id.length > 0);
    if (itemrefList.length === 0)
        return returnArr;
    let ns = el.nextElementSibling;
    while (ns !== null && itemrefList.includes(ns.id)) {
        returnArr.push(ns);
        ns = ns.nextElementSibling;
    }
    return returnArr;
}
