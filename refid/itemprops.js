"use strict";
function getScopedChildren(element, lookup) {
    if (lookup === undefined)
        lookup = {};
    for (const child of element.children) {
        const itemprop = child.getAttribute('itemprop');
        if (itemprop !== null) {
            const lookupItemProp = lookup[itemprop];
            if (lookupItemProp) {
                if (!Array.isArray(lookupItemProp)) {
                    lookup[itemprop] = [lookupItemProp];
                }
                lookup[itemprop].push(child);
            }
            else {
                lookup[itemprop] = child;
            }
        }
        if (!child.hasAttribute('itemscope')) {
            getScopedChildren(child, lookup);
        }
    }
}
Object.defineProperty(Element.prototype, 'itemprops', {
    get() {
        if (!this.hasAttribute('itemscope'))
            return undefined;
        return getScopedChildren(this);
    }
});
