import { upShadowSearch } from './upShadowSearch.js';
const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');
Object.defineProperty(HTMLTemplateElement.prototype, 'remoteContent', {
    get() {
        const templ = this;
        const src = templ.getAttribute('src');
        if (src === null) {
            const head = document.head;
            if (window[remoteTemplElSym] === undefined) {
                window[remoteTemplElSym] = 0;
            }
            const id = templ.id || `mount-observer-${window[remoteTemplElSym]++}`;
            const sourceTempl = document.createElement('template');
            sourceTempl.id = '' + id;
            sourceTempl.content.appendChild(templ.content);
            head.append(sourceTempl);
            templ.innerHTML = '';
            templ.setAttribute('src', `#${id}`);
            templ.setAttribute('rel', 'preload');
            templ[remoteTemplElSym] = new WeakRef(sourceTempl);
            return sourceTempl.content;
        }
        {
            const test = templ[remoteTemplElSym]?.deref();
            if (test !== undefined)
                return test.content;
            if (templ.getAttribute('rel') !== 'preload')
                throw 'NI';
            const isIntraDoc = src[0] === '#';
            if (!isIntraDoc)
                throw 'NI';
            const id = src.substring(1);
            const remoteTempl = upShadowSearch(templ, id);
            if (!(remoteTempl instanceof HTMLTemplateElement))
                throw 404; //not found
            templ[remoteTemplElSym] = new WeakRef(remoteTempl);
            return remoteTempl.content;
            //templ.dispatchEvent(new Event('load'));
        }
    }
});
export function preloadContent(templ) {
    const content = templ.remoteContent;
}
