import { inclTemplQry } from './MountObserver.js';
export const childRefs = Symbol.for('Wr0WPVh84k+O93miuENdMA');
export const cloneKey = Symbol.for('LD97VKZYc02CQv23DT/6fQ');
export async function compose(self, el, level) {
    const src = el.getAttribute('src');
    el.removeAttribute('src');
    const templID = src.substring(1);
    const fragment = self.objNde?.deref();
    if (fragment === undefined)
        return;
    const templ = self.findByID(templID, fragment);
    if (!(templ instanceof HTMLTemplateElement))
        throw 404;
    const clone = templ.content.cloneNode(true);
    const slots = el.content.querySelectorAll(`[slot]`);
    for (const slot of slots) {
        const name = slot.getAttribute('slot');
        const slotQry = `slot[name="${name}"]`;
        const targets = Array.from(clone.querySelectorAll(slotQry));
        const innerTempls = clone.querySelectorAll(inclTemplQry);
        for (const innerTempl of innerTempls) {
            const innerSlots = innerTempl.content.querySelectorAll(slotQry);
            for (const innerSlot of innerSlots) {
                targets.push(innerSlot);
            }
        }
        for (const target of targets) {
            const slotClone = slot.cloneNode(true);
            target.after(slotClone);
            target.remove();
        }
    }
    await self.composeFragment(clone, level + 1);
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
    if (level === 0) {
        const refs = [];
        for (const child of clone.children) {
            refs.push(new WeakRef(child));
        }
        el[childRefs] = refs;
    }
    //if template has itemscope attribute, assume want to do some data binding before instantiating into
    //DOM fragment.
    let cloneStashed = false;
    if (el.hasAttribute('itemscope')) {
        el[cloneKey] = clone;
        cloneStashed = true;
    }
    else {
        if (shadowRootModeOnLoad !== null) {
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
    if (!cloneStashed) {
        if (level !== 0 || (slots.length === 0 && el.attributes.length === 0))
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
