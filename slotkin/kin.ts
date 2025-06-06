import {toQuery} from './toQuery.js';
export function kin(fragment: DocumentFragment, el: Element){
    const qry = toQuery(el);
    const matches = Array.from(fragment.querySelectorAll(qry));
    const elFragment = new DocumentFragment();
    const clone = el.cloneNode(true);
    for(const child of clone.childNodes){
        elFragment.appendChild(child);
    }
    for(const match of matches){
        const fragmentClone = elFragment.cloneNode(true) as DocumentFragment;
        match.replaceWith(fragmentClone);
    }
}