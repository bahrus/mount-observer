import { toQuery } from './toQuery.js';
import { MountObserver } from '../MountObserver.js';
import { prep, clone } from './affine.js';
const previousObservers = new WeakMap();
export function beKindred(fragment, el) {
    if (!fragment.isConnected)
        throw 'too soon, use affine';
    const qry = toQuery(el);
    const previousObserversOfFragment = previousObservers.get(fragment);
    if (previousObserversOfFragment !== undefined) {
        const staleObservers = previousObserversOfFragment.filter(x => el.matches(x[0]));
        const nonStaleObservers = previousObserversOfFragment.filter(x => !el.matches(x[0]));
        if (staleObservers !== undefined && staleObservers.length > 0) {
            for (const staleObserver of staleObservers) {
                staleObserver[1].disconnect(fragment);
            }
        }
        previousObservers.set(fragment, nonStaleObservers);
    }
    const { elFragment, map } = prep(el);
    const mo = new MountObserver({
        on: qry,
        do: {
            mount: (matchingElement) => {
                clone(matchingElement, elFragment, map);
                // const fragmentClone = elFragment.cloneNode(true) as DocumentFragment;
                // matchingElement.replaceChildren(fragmentClone);
                // if(map !== null){
                //     for(const key in map){
                //         const value = map[key]!;
                //         matchingElement.setAttribute(key, value);
                //     }
                // }
            }
        }
    });
    mo.observe(fragment);
    if (previousObservers.has(fragment)) {
        previousObservers.get(fragment).push([qry, mo]);
    }
    else {
        previousObservers.set(fragment, [[qry, mo]]);
    }
    return mo;
}
