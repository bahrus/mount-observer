import {upShadowSearch} from '../upShadowSearch.js';
import {stdVal} from './stdVal.js';

Object.defineProperty(HTMLElement.prototype, 'ishm', {
    get(){
        const el = this as HTMLElement;
        if(!el.hasAttribute('itemscope')) return;
        return parse(el);
    }
});

const parsedItempropmaps = new WeakMap<HTMLScriptElement, any>();

export function parse(el: HTMLElement, obj: any = {}){
    const itemprop = el.getAttribute('itemprop');
    if(itemprop){
        obj[itemprop] = stdVal(el); //TODO full logic
    }
    const itempropmap = el.getAttribute('itempropmap');
    if(itempropmap){
        //const el = document.getElementById(itempropmap);
        const jsonEl = upShadowSearch(el, itempropmap)
        if(!jsonEl) throw 500;
        if(!parsedItempropmaps.has(jsonEl)){
            parsedItempropmaps.set(jsonEl, JSON.parse(jsonEl.innerHTML));
        }
        const parsed =/** @type {ItemPropMap} */  (parsedItempropmaps.get(jsonEl));
        for(const key in parsed){
            const attr = el.getAttribute(key);
            if(attr === null) continue;
            const rhs = parsed[key];
            switch(typeof rhs){
                case 'string':
                    obj[rhs] = attr;
                    break;
                case 'object':
                    const {instanceOf, mapsTo} = rhs;
                    switch(instanceOf){
                        case 'Number':
                        case Number:
                            obj[mapsTo] = Number(attr);
                            break;
                        case 'Object':
                        case Object:
                        case 'Boolean':
                        case Boolean:
                            obj[mapsTo] = JSON.parse(attr);
                            break;
                        

                    }
            }
        }

    }
    //el.ish = obj;
    const children = Array.from(el.children);
    const isItemScoped = el.hasAttribute('itemscope');
    let itemscopeMap: {[key: string] : any[]} | undefined;
    if(isItemScoped){
        itemscopeMap = {};
    }
    for(const child of children){ 
        if(!(child instanceof HTMLElement)) continue;
        const objToPass = child.hasAttribute('itemscope') ? {} : obj;
        parse(child, objToPass);
        const isItemScopeAndChildHasBothItempropAndItemscope = itemscopeMap && child.hasAttribute('itemprop') && child.hasAttribute('itemscope');
        if(isItemScopeAndChildHasBothItempropAndItemscope){
            const itemprops = child.getAttribute('itemprop')!.split(" ").filter(x => x);
            for(const itemprop of itemprops){
                if(!itemscopeMap![itemprop]) itemscopeMap![itemprop] = [];
                itemscopeMap![itemprop].push(objToPass);
            }
        }
    }
    // if(itemscopeMap){
    //     el.ism = itemscopeMap;
    // }
    return {
        obj,
        itemscopeMap
    };
}