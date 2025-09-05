"use strict";
Element.prototype.hostish = async function () {
    const closest = this.closest('[itemscope]');
    if (closest === null)
        return this.getRootNode().host;
    const { localName } = closest;
    if (localName.includes('-')) {
        await customElements.whenDefined(localName);
        return closest;
    }
    const itemScopeAttr = closest.getAttribute('itemscope');
    if (itemScopeAttr) {
        const { waitForIsh } = await import('mount-observer/waitForIsh.js');
        return await waitForIsh(closest);
    }
    return this.getRootNode().host;
};
