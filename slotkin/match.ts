import {toQuery} from './toQuery.js';
export function match(fragment: DocumentFragment, el: Element){
    const qry = toQuery(el);
    return Array.from(fragment.querySelectorAll(qry));
}