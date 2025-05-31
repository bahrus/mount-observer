import { splitRefs } from './splitRefs.js';
function getRefs(el: Element): Set<Element>{
    const returnedSet = new Set<Element>();
    returnedSet.add(el);
    const itemref = el.getAttribute('itemref');
    if(itemref === null) return returnedSet;
    const itemrefList = splitRefs(itemref);// itemref.split(' ').map((id) => id.trim()).filter((id) => id.length > 0);
    if(itemrefList.length === 0) return returnedSet;
    const rn = el.getRootNode() as Document | ShadowRoot;
    for(const id of itemrefList){
        const itemrefElement = rn.getElementById(id);
        if(itemrefElement){
            returnedSet.add(itemrefElement);
            
        }
    }
    return returnedSet;
}


