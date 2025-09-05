interface Element{
    hostish(): Promise<any>
}
Element.prototype.hostish = async function(){
    const closest = this.closest('[itemscope]') as HTMLElement;
    if(closest === null) return (<any>this.getRootNode()).host;
    const {localName} = closest;
    if(localName.includes('-')){
        await customElements.whenDefined(localName);
        return closest;
    }
    const itemScopeAttr = closest.getAttribute('itemscope');
    if(itemScopeAttr){
        const {waitForIsh} = await import('mount-observer/waitForIsh.js');
        return await waitForIsh(closest);
    }
    return (<any>this.getRootNode()).host;
}