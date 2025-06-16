import { toQuery } from './toQuery.js';
import { splitRefs } from '../refid/splitRefs.js';
export function affine(fragment, el) {
    const qry = toQuery(el);
}
export function prep(el) {
    const elFragment = new DocumentFragment();
    const clone = el.cloneNode(true);
    for (const child of clone.childNodes) {
        elFragment.appendChild(child);
    }
    const insertAttrs = el.getAttribute('-i');
    let map = null;
    if (insertAttrs !== null) {
        const attrs = splitRefs(insertAttrs);
        map = {};
        for (const attr of attrs) {
            map[attr] = el.getAttribute(attr);
        }
    }
    return {
        elFragment, map
    };
}
