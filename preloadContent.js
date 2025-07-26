const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');
export async function preloadContent(templ, target) {
    const templWithRemoteContent = templ;
    if (templWithRemoteContent.remoteContent)
        return templWithRemoteContent.remoteContent;
    const src = templ.getAttribute('src');
    if (!src)
        throw 300; //no src attribute
    const isIntraDoc = src[0] === '#';
    if (!('remoteContent' in templWithRemoteContent)) {
        //define a property on the template instance
        Object.defineProperty(templWithRemoteContent, 'remoteContent', {
            get() {
                if (isIntraDoc) {
                    const ref = this[remoteTemplElSym]?.deref();
                    if (ref)
                        return ref.content;
                }
                else {
                    throw 'NI'; //not implemented
                }
            },
            enumerable: true,
            configurable: true,
        });
    }
    else {
        return;
    }
    if (isIntraDoc) {
        const id = src.substring(1);
        const { upShadowSearch } = await import('./upShadowSearch.js');
        const remoteTempl = upShadowSearch(templ, id) || upShadowSearch((target || document), id);
        if (!(remoteTempl instanceof HTMLTemplateElement))
            throw 404; //not found
        templWithRemoteContent[remoteTemplElSym] = new WeakRef(remoteTempl);
        templWithRemoteContent.dispatchEvent(new Event('load'));
    }
    else {
        debugger;
        throw 'NI'; //not implemented
    }
}
