"use strict";
Element.prototype.hostish = async function (checkSelf = true) {
    const from = checkSelf ? this : this.hasAttribute('itemscope') ? this.parentElement : this;
    const closest = from?.closest('[itemscope]');
    if (closest === null || closest === undefined)
        return this.getRootNode().host;
    const { localName } = closest;
    const itemScopeAttr = closest.getAttribute('itemscope');
    if (itemScopeAttr) {
        const { waitForIsh } = await import('mount-observer/waitForIsh.js');
        return await waitForIsh(closest);
    }
    if (localName.includes('-')) {
        await customElements.whenDefined(localName);
        return closest;
    }
    return this.getRootNode().host;
};
