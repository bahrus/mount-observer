import {toQuery} from './toQuery.js';
import {splitRefs} from '../refid/splitRefs.js';
import {MountObserver} from '../MountObserver.js';

export function beKindred(
    fragment: DocumentFragment | Element, 
    el: Element,
    //beVigilant: boolean = false
){
    const qry = toQuery(el);
    
    const elFragment = new DocumentFragment();
    const clone = el.cloneNode(true);
    for(const child of clone.childNodes){
        elFragment.appendChild(child);
    }
    const insertAttrs = el.getAttribute('-i');
    let map: {[key: string]: string} | null = null;
    if(insertAttrs !== null){
        const attrs = splitRefs(insertAttrs);
        map = {};
        for(const attr of attrs){
            map[attr] = el.getAttribute(attr)!;
        }
    }

    const mo = new MountObserver({
        on: qry,
        do: {
            mount: (matchingElement) => {
                const fragmentClone = elFragment.cloneNode(true) as DocumentFragment;
                matchingElement.replaceChildren(fragmentClone);
                if(map !== null){
                    for(const key in map){
                        const value = map[key]!;
                        matchingElement.setAttribute(key, value);
                    }
                }
            }
        }
    });
    mo.observe(fragment);
    return mo;
    // const matches = Array.from(fragment.querySelectorAll(qry));
    // for(const match of matches){
    //     const fragmentClone = elFragment.cloneNode(true) as DocumentFragment;
    //     match.replaceChildren(fragmentClone);
    //     if(map !== null){
    //         for(const key in map){
    //             const value = map[key]!;
    //             match.setAttribute(key, value);
    //         }
    //     }
    // }
}