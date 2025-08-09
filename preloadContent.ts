import {TemplateWithRemoteContent} from './ts-refs/mount-observer/types.js';
import {upShadowSearch} from './upShadowSearch.js';
const remoteTemplElSym = Symbol.for('du3y+tfsAUGFHMG/iHZiMQ');

Object.defineProperty(HTMLTemplateElement.prototype, 'remoteContent', {
    get(){
        const templ = this as HTMLTemplateElement;
        const src = templ.getAttribute('src');
        if(src === null){
            const head = document.head;
            if((<any>window)[remoteTemplElSym] === undefined ){
                (<any>window)[remoteTemplElSym] = 0;
            }
            const id = (<any>window)[remoteTemplElSym]++;
            const sourceTempl = document.createElement('template');
            sourceTempl.id = '' + id;
            sourceTempl.content.appendChild(templ.content);
            head.append(sourceTempl);
            templ.innerHTML = '';
            templ.setAttribute('src', `#${id}`);
            templ.setAttribute('rel', 'preload');
            (<any>templ)[remoteTemplElSym] = new WeakRef(sourceTempl);
            return sourceTempl.content;
        }
        {
            const test = (<any>templ)[remoteTemplElSym]?.deref();
            if(test !== undefined) return test;
            if(templ.getAttribute('rel') !== 'preload') throw 'NI';
            const isIntraDoc = src[0] === '#';
            if(!isIntraDoc) throw 'NI';
            const id = src.substring(1);
            const remoteTempl = upShadowSearch(templ, id);
            if(!(remoteTempl instanceof HTMLTemplateElement)) throw 404; //not found
            (<any>templ)[remoteTemplElSym] = new WeakRef(remoteTempl);
            //templ.dispatchEvent(new Event('load'));
        }

    }
})

export function preloadContent(
    templ: HTMLTemplateElement,
) {
    const content = (<any>templ).remoteContent;
    
}