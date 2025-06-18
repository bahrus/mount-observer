import { wasItemReffed } from './MountObserver.js';
//import {prep} from './slotkin/affine.js';
//goal:  deprecate this key, in favor of comments
export const childRefsKey = Symbol.for('Wr0WPVh84k+O93miuENdMA');
export const cloneKey = Symbol.for('LD97VKZYc02CQv23DT/6fQ');
const autogenKey = Symbol.for('YpP5EP0i1UKcBBBH9tsm0w');
const wrapped = Symbol.for('50tzQZt95ECXUtHF7a40og');
export async function compose(self, el, level, refName, refType) {
    const src = el.getAttribute('src');
    if (src === null)
        return;
    el.removeAttribute('src');
    //const templID = src!.substring(1);
    //const refType = src![0];
    const fragment = self.objNde?.deref();
    if (fragment === undefined)
        return;
    const templ = await self.findByID(refName, fragment, refType);
    if (!(templ instanceof HTMLTemplateElement))
        throw 404;
    if (refType === '#') {
        const wasWrapped = templ[wrapped];
        if (!wasWrapped) {
            templ[wrapped] = true;
            if (templ.content.childElementCount > 1) {
                const start = document.createComment(refName);
                templ.content.prepend(start);
                const end = document.createComment(`/${refName}`);
                templ.content.appendChild(end);
            }
        }
    }
    const clone = templ.content.cloneNode(true);
    const dataLd = el.dataset.ld;
    const wasReffed = templ[wasItemReffed];
    if (wasReffed || dataLd) {
        const firstElement = clone.firstElementChild;
        if (wasReffed) {
            let ns = firstElement.nextElementSibling;
            const ids = [];
            let count = window[autogenKey];
            if (count === undefined) {
                count = 0;
            }
            else {
                count++;
            }
            window[autogenKey] = count;
            while (ns !== null) {
                const id = ns.id = `mount-observer-${count}`;
                ids.push(id);
                ns = ns.nextElementSibling;
            }
            firstElement.setAttribute('itemref', ids.join(' '));
        }
        if (dataLd) {
            const parsed = JSON.parse(dataLd);
            let type = parsed['@type'];
            const itemscopeAttr = firstElement.getAttribute('itemscope');
            if (type && !itemscopeAttr) {
                firstElement.setAttribute('itemscope', type);
            }
            firstElement['ish'] = parsed;
            delete el.dataset.ld;
        }
    }
    if (el.content.childElementCount > 0) {
        const { affine } = await import('./slotkin/affine.js');
        const children = Array.from(el.content.children);
        for (const child of children) {
            //TODO support clean up
            const mo = affine(clone, child);
        }
    }
    // //TODO switch to css matches
    // const slots = el.content.querySelectorAll(`[slot]`);
    // for(const slot of slots){
    //     const name = slot.getAttribute('slot')!;
    //     const slotQry = `slot[name="${name}"]`;
    //     const targets = Array.from(clone.querySelectorAll(slotQry));
    //     const innerTempls = clone.querySelectorAll(inclTemplQry) as NodeListOf<HTMLTemplateElement>;
    //     for(const innerTempl of innerTempls){
    //         const innerSlots = innerTempl.content.querySelectorAll(slotQry);
    //         for(const innerSlot of innerSlots){
    //             targets.push(innerSlot);
    //         }
    //     }
    //     for(const target of targets){
    //         const slotClone = slot.cloneNode(true) as Element;
    //         target.after(slotClone);
    //         target.remove();
    //     }
    // }
    await self.composeFragment(clone, level + 1);
    if (false) {
        const shadowRootModeOnLoad = el.getAttribute('shadowRootModeOnLoad');
        if (shadowRootModeOnLoad === null && level === 0) {
            const slotMap = el.getAttribute('slotmap');
            let map = slotMap === null ? undefined : JSON.parse(slotMap);
            const slots = clone.querySelectorAll('[slot]');
            for (const slot of slots) {
                if (map !== undefined) {
                    const slotName = slot.slot;
                    for (const key in map) {
                        if (slot.matches(key)) {
                            const targetAttSymbols = map[key];
                            for (const sym of targetAttSymbols) {
                                switch (sym) {
                                    case '|':
                                        slot.setAttribute('itemprop', slotName);
                                        break;
                                    case '$':
                                        slot.setAttribute('itemscope', '');
                                        slot.setAttribute('itemprop', slotName);
                                        break;
                                    case '@':
                                        slot.setAttribute('name', slotName);
                                        break;
                                    case '.':
                                        slot.classList.add(slotName);
                                        break;
                                    case '%':
                                        slot.part.add(slotName);
                                        break;
                                }
                            }
                        }
                    }
                }
                slot.removeAttribute('slot');
            }
            el.dispatchEvent(new LoadEvent(clone));
        }
    }
    if (level === 0) {
        const refs = [];
        for (const child of clone.children) {
            refs.push(new WeakRef(child));
        }
        el[childRefsKey] = refs;
    }
    //if template has itemscope attribute, assume want to do some data binding before instantiating into
    //DOM fragment.
    let cloneStashed = false;
    if (el.hasAttribute('itemscope')) {
        el[cloneKey] = clone;
        cloneStashed = true;
    }
    else {
        if (false /*shadowRootModeOnLoad !== null */) {
            const parent = el.parentElement;
            if (parent === null)
                throw 404;
            if (parent.shadowRoot === null)
                parent.attachShadow({ mode: shadowRootModeOnLoad });
            parent.shadowRoot?.append(clone);
        }
        else {
            el.after(clone);
        }
    }
    //moving the code down here broke be-inclusive Example2.html (but maybe it caused something else to work, so will need to revisit)
    //check to make sure the progresive loading of css-charts works as before.
    // if(level === 0){
    //     el.dispatchEvent(new LoadEvent(clone));
    // }
    if (!cloneStashed) {
        if (level !== 0 || el.attributes.length === 0)
            el.remove();
    }
}
export class LoadEvent extends Event {
    clone;
    static eventName = 'load';
    constructor(clone) {
        super(LoadEvent.eventName);
        this.clone = clone;
    }
}
