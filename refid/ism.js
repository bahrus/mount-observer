import { upShadowSearch } from '../upShadowSearch.js';
import { stdVal } from './stdVal.js';
Object.defineProperty(HTMLElement.prototype, 'ism', {
    get() {
        const el = this;
        if (!el.hasAttribute('itemscope'))
            return;
        return parse(el);
    }
});
const parsedItempropmaps = new WeakMap();
export function parse(el, obj = {}, itemscopeMap = {}) {
    const itemprop = el.getAttribute('itemprop');
    if (itemprop) {
        obj[itemprop] = stdVal(el); //TODO full logic
    }
    const itempropmap = el.getAttribute('itempropmap');
    if (itempropmap) {
        //const el = document.getElementById(itempropmap);
        const jsonEl = upShadowSearch(el, itempropmap);
        if (!jsonEl)
            throw 500;
        if (!parsedItempropmaps.has(jsonEl)) {
            parsedItempropmaps.set(jsonEl, JSON.parse(jsonEl.innerHTML));
        }
        const parsed = /** @type {ItemPropMap} */ (parsedItempropmaps.get(jsonEl));
        for (const key in parsed) {
            const attr = el.getAttribute(key);
            if (attr === null)
                continue;
            const rhs = parsed[key];
            switch (typeof rhs) {
                case 'string':
                    obj[rhs] = attr;
                    break;
                case 'object':
                    const { instanceOf, mapsTo } = rhs;
                    switch (instanceOf) {
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
    let itemscopeMapToPass = itemscopeMap;
    for (const child of children) {
        if (!(child instanceof HTMLElement))
            continue;
        const childHasItemScopeAttr = child.hasAttribute('itemscope');
        const objToPass = childHasItemScopeAttr ? {} : obj;
        if (childHasItemScopeAttr) {
            itemscopeMapToPass = {};
        }
        parse(child, objToPass, itemscopeMapToPass);
        const isItemScopeAndChildHasBothItempropAndItemscope = itemscopeMap && child.hasAttribute('itemprop') && child.hasAttribute('itemscope');
        if (isItemScopeAndChildHasBothItempropAndItemscope) {
            const itemprops = child.getAttribute('itemprop').split(" ").filter(x => x);
            for (const itemprop of itemprops) {
                if (!itemscopeMap[itemprop])
                    itemscopeMap[itemprop] = [];
                itemscopeMap[itemprop].push(objToPass);
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
