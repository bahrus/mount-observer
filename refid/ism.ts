import {upShadowSearch} from '../upShadowSearch.js';
import {stdVal} from './stdVal.js';

Object.defineProperty(HTMLElement.prototype, 'ism', {
    get(){
        const el = this as HTMLElement;
        if(!el.hasAttribute('itemscope')) return;
        return parse(el);
    }
});

type ScopedLists = {[key: string] : any[]}

const parsedItempropMaps = new WeakMap<HTMLScriptElement, any>();

export function parse(el: HTMLElement, scope: any = {}, scopedLists: ScopedLists = {}){
    const itemprop = el.getAttribute('itemprop');
    if(itemprop){
        scope[itemprop] = stdVal(el); //TODO full logic
    }
    const itempropmap = el.getAttribute('itempropmap');
    if(itempropmap){
        //const el = document.getElementById(itempropmap);
        const jsonEl = upShadowSearch(el, itempropmap)
        if(!jsonEl) throw 500;
        if(!parsedItempropMaps.has(jsonEl)){
            parsedItempropMaps.set(jsonEl, JSON.parse(jsonEl.innerHTML));
        }
        const parsed =/** @type {ItemPropMap} */  (parsedItempropMaps.get(jsonEl));
        for(const key in parsed){
            const attr = el.getAttribute(key);
            if(attr === null) continue;
            const rhs = parsed[key];
            switch(typeof rhs){
                case 'string':
                    scope[rhs] = attr;
                    break;
                case 'object':
                    const {instanceOf, mapsTo} = rhs;
                    switch(instanceOf){
                        case 'Number':
                        case Number:
                            scope[mapsTo] = Number(attr);
                            break;
                        case 'Object':
                        case Object:
                        case 'Boolean':
                        case Boolean:
                            scope[mapsTo] = JSON.parse(attr);
                            break;
                        

                    }
            }
        }

    }
    const children = Array.from(el.children);
    let itemscopeMapToPass = scopedLists;
    for(const child of children){ 
        if(!(child instanceof HTMLElement)) continue;
        const childHasItemScopeAttr = child.hasAttribute('itemscope')
        const objToPass = childHasItemScopeAttr ? {} : scope;
        if(childHasItemScopeAttr) {
            itemscopeMapToPass = {};
        }
        parse(child, objToPass, itemscopeMapToPass);
        const isItemScopeAndChildHasBothItempropAndItemscope = scopedLists && child.hasAttribute('itemprop') && child.hasAttribute('itemscope');
        if(isItemScopeAndChildHasBothItempropAndItemscope){
            const itemprops = child.getAttribute('itemprop')!.split(" ").filter(x => x);
            for(const itemprop of itemprops){
                if(!scopedLists![itemprop]) scopedLists![itemprop] = [];
                scopedLists![itemprop].push(objToPass);
            }
        }
    }
    return {
        scope,
        scopedLists
    };
}