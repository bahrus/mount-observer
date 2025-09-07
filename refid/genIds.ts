import {nudge} from './nudge.js';
import {getCount} from './getCount.js';

const attrMap = {
    '@': 'name',
    '|': 'itemprop',
};

const scopeMatches = '[itemscope],fieldset';

export function inScope(scopeFragment: DocumentFragment | Element, el: Element){
    const closest = el.closest(scopeMatches);//TODO account for itemref?
    if(closest === null) return true;
    if(scopeFragment === closest) return true;
    if(scopeFragment.contains(closest)) return false;
    return true;
}

export function genIds(enhancedElement: Element){
    // const {parentElement} = enhancedElement;
    // if(parentElement === null) throw 404;
    const scopeFragment = (enhancedElement.closest(scopeMatches) || enhancedElement.getRootNode()) as DocumentFragment | Element;

    //first find all elements with attribute #
    const hashIds = Array.from(scopeFragment.querySelectorAll('[\\#]')).filter(x => inScope(scopeFragment, x));
    const uniqueCheck = new Set();
    for(const hi of hashIds){
        if(!(hi instanceof HTMLElement)) continue;
        const idName = hi.getAttribute('itemscope') || hi.localName;
        if(uniqueCheck.has(idName)) throw 500;
        uniqueCheck.add(idName);
        let sideEffects = '';
        const hashValue = hi.getAttribute('#');
        if(hashValue){
            sideEffects = `${hashValue} `;
        }
        hi.dataset.id = `{{${sideEffects}${idName}}}`;
        hi.removeAttribute('#');
    }

    //now find all elements with attribute @
    const names = Array.from(scopeFragment.querySelectorAll('[name]:not([name=""])[\\@]')).filter(x => inScope(scopeFragment, x));
    for(const nameEl of names){
        if(!(nameEl instanceof HTMLElement)) continue;
        const val = nameEl.getAttribute('name');
        if(uniqueCheck.has(val)) throw 500;
        uniqueCheck.add(val);
        let sideEffects = '';
        const nameValue = nameEl.getAttribute('@');
        if(nameValue){
            sideEffects = `${nameValue} `;
        }
        nameEl.dataset.id = `{{${sideEffects}${val}}}`;
        nameEl.removeAttribute('@');
    }

    //now find all elements with attribute |
    const itemprops = Array.from(scopeFragment.querySelectorAll('[itemprop]:not([itemprop=""])[\\|]')).filter(x => inScope(scopeFragment, x));
    for(const itempropEl of itemprops){
        if(!(itempropEl instanceof HTMLElement)) continue;
        const val = itempropEl.getAttribute('itemprop');
        if(uniqueCheck.has(val)) throw 500;
        uniqueCheck.add(val);
        let sideEffects = '';
        const nameValue = itempropEl.getAttribute('|');
        if(nameValue){
            sideEffects = `${nameValue} `;
        }
        itempropEl.dataset.id = `{{${sideEffects}${val}}}`;
        itempropEl.removeAttribute('|');
    }

    const dataIds = Array.from(scopeFragment.querySelectorAll('[data-id^="{{"][data-id$="}}"]')).filter(x => inScope(scopeFragment, x));
    const ids: Array<string> = [];
    for(const di of dataIds){
        if(!(di instanceof HTMLElement)) continue;
        const unparsedID = di.dataset.id;
        const inner = unparsedID?.substring(2, unparsedID.length - 2);
        if(!inner) continue;
        const split = inner.split(' ');
        const id = split.length === 2 ? split[1] : split[0];
        if(ids.includes(id)) throw 500;
        ids.push(id);
    }
    if(ids.length === 0) return;
    const allChildren = Array.from(scopeFragment.querySelectorAll('*')).filter(x => inScope(scopeFragment, x));
    if(scopeFragment instanceof Element) allChildren.push(scopeFragment);

    const idLookup: {[key: string]: string}  = {};
    const base = 'gid';
    for(const child of allChildren){
        const attrs = child.attributes;
        for(const attr of attrs){
            const {name, value} = attr;
            if(!name.startsWith('data-')) continue;
            if(name === 'data-id'){
                if(!value.startsWith('{{') || !value.endsWith('}}')) continue;
                const inner = value.substring(2, value.length - 2);
                const split = inner.split(' ');
                const id = split.length === 2 ? split[1] : split[0];
                if(!(id in idLookup)){
                    idLookup[id] = `${base}-${getCount(base)}`;
                }
                if(split.length === 2){
                    const sideEffects = split[0];
                    for(const char of sideEffects){
                        switch(char){
                            case '@':
                            case '|':
                                child.setAttribute(attrMap[char], id);
                                break;
                            case '%':
                                child.part.add(id);
                                break;
                            case '.':
                                child.classList.add(id);
                                break;

                        }
                    }
                }
                child.id = idLookup[id];
                child.setAttribute('data-id', id);
            }else{
                let newValue = value;
                for(const id of ids){
                    const token = `{{${id}}}`;
                    if(!newValue.includes(token)) continue;
                    if(!(id in idLookup)){
                        idLookup[id] = `${base}-${getCount(base)}`;
                    }
                    newValue = newValue.replaceAll(token, idLookup[id]);
                    
                }
                if(newValue === value) continue;
                child.setAttribute(name.substring(5), newValue);
                child.removeAttribute(name);
            }
            
        }
        for(const attr of attrs){
            const {name, value} = attr;
            if(!name.startsWith('defer-')) continue;
            const nameWithoutDefer = name.substring(6);
            const attrWithoutDefer = child.getAttributeNode(nameWithoutDefer);
            if(attrWithoutDefer === null) continue;
            const valueWithoutDefer = attrWithoutDefer.value;
            
            let newValue = valueWithoutDefer;
            let changeMade = false;
            for(const id of ids){
                const token = `{{${id}}}`;
                if(!newValue.includes(token)) continue;
                if(!(id in idLookup)){
                    idLookup[id] = `${base}-${getCount(base)}`;
                }
                newValue = newValue.replaceAll(token, idLookup[id]);
                changeMade = true;
                
            }
            //child.setAttribute(nameWithoutDefer, newValue);
            if(changeMade) attrWithoutDefer.value = newValue;
            nudge(child, name);
        }
    }
    if(scopeFragment instanceof Element && 'disabled' in scopeFragment){
        nudge(scopeFragment);
    }
}