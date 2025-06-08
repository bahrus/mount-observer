import {toQuery} from './toQuery.js';
import {splitRefs} from '../refid/splitRefs.js';
import {MountObserver} from '../MountObserver.js';

type OnMountObserver = [string, MountObserver];
const previousObservers = new WeakMap<DocumentFragment | Element, Array<OnMountObserver>>();

export function beKindred(
    fragment: DocumentFragment | Element, 
    el: Element,
){
    const qry = toQuery(el);
    const previousObserversOfFragement = previousObservers.get(fragment);
    if(previousObserversOfFragement !== undefined){
        const staleObservers = previousObserversOfFragement.filter(x => el.matches(x[0]));
        const nonStaleObservers = previousObserversOfFragement.filter(x => !el.matches(x[0]));
        if(staleObservers !== undefined && staleObservers.length > 0){
            for(const staleObserver of staleObservers){
                staleObserver[1].disconnect(fragment);
            }
        }
        previousObservers.set(fragment, nonStaleObservers);
    }

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
    if(previousObservers.has(fragment)){
        previousObservers.get(fragment)!.push([qry, mo]);
    }else{
        previousObservers.set(fragment, [[qry, mo]]);
    }
    return mo;

}