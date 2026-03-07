interface Element{
    hostish(): Promise<any>
}
Element.prototype.hostish = async function(checkSelf = true){
    const from = checkSelf ? this : this.hasAttribute('itemscope') ? this.parentElement : this;
    const closest = from?.closest('[itemscope]') as HTMLElement;
    if(closest === null || closest === undefined) return (<any>this.getRootNode()).host;
    const {localName} = closest;
    const itemScopeAttr = closest.getAttribute('itemscope');
    if(itemScopeAttr){
        const {waitForIsh} = await import('mount-observer/waitForIsh.js');
        return await waitForIsh(closest);
    }
    if(localName.includes('-')){
        await customElements.whenDefined(localName);
        return closest;
    }

    return (<any>this.getRootNode()).host;
}