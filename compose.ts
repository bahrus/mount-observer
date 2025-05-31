import { ILoadEvent, loadEventName } from './ts-refs/mount-observer/types';
import { MountObserver, inclTemplQry, wasItemReffed } from './MountObserver.js';

export const childRefsKey = Symbol.for('Wr0WPVh84k+O93miuENdMA');
export const cloneKey = Symbol.for('LD97VKZYc02CQv23DT/6fQ');
const autogenKey = Symbol.for('YpP5EP0i1UKcBBBH9tsm0w');
export async function compose(
    self: MountObserver, 
    el: HTMLTemplateElement, 
    level: number
){
    const src = el.getAttribute('src'); if(src === null) return;
    el.removeAttribute('src');
    const templID = src!.substring(1);
    const fragment = self.objNde?.deref() as DocumentFragment;
    if(fragment === undefined) return;
    const templ = await self.findByID(templID, fragment);
    if(!(templ instanceof HTMLTemplateElement)) throw 404;
    const clone = templ.content.cloneNode(true) as DocumentFragment;
    const dataLd = el.dataset.ld;
    const wasReffed = (<any>templ)[wasItemReffed];
    if(wasReffed || dataLd){
        const firstElement = clone.firstElementChild!;
        if(wasReffed){
            let ns = firstElement.nextElementSibling;
            const ids = [];
            let count = (<any>window)[autogenKey];
            if(count === undefined){
                count = 0;
            }else{
                count++;
            }
            while(ns !== null){
                const id = ns.id = `moc-${count}`;
                ids.push(id);
                ns = ns.nextElementSibling;
            }
        }
        if(dataLd){
            const parsed = JSON.parse(dataLd);
            let type = parsed['@type'];
            const itemscopeAttr = firstElement.getAttribute('itemscope');
            if(type && !itemscopeAttr){
                firstElement.setAttribute('itemscope', type);
            }else{
                type = itemscopeAttr;
            }

        }
        
    }
    const slots = el.content.querySelectorAll(`[slot]`);

    for(const slot of slots){
        const name = slot.getAttribute('slot')!;
        const slotQry = `slot[name="${name}"]`;
        const targets = Array.from(clone.querySelectorAll(slotQry));
        const innerTempls = clone.querySelectorAll(inclTemplQry) as NodeListOf<HTMLTemplateElement>;
        for(const innerTempl of innerTempls){
            const innerSlots = innerTempl.content.querySelectorAll(slotQry);
            for(const innerSlot of innerSlots){
                targets.push(innerSlot);
            }
        }
        for(const target of targets){
            const slotClone = slot.cloneNode(true) as Element;
            target.after(slotClone);
            target.remove();
        }
    }
    await self.composeFragment(clone, level + 1);
    const shadowRootModeOnLoad = el.getAttribute('shadowRootModeOnLoad') as null | ShadowRootMode;
    if(shadowRootModeOnLoad === null && level === 0){
        
        const slotMap = el.getAttribute('slotmap');
        let map = slotMap === null ? undefined : JSON.parse(slotMap);
        const slots = clone.querySelectorAll('[slot]');
        for(const slot of slots){
            if(map !== undefined){
                const slotName = slot.slot;
                for(const key in map){
                    if(slot.matches(key)){
                        const targetAttSymbols = map[key] as string;
                        for(const sym of targetAttSymbols){
                            switch(sym){
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
    if(level === 0){
        const refs: Array<WeakRef<Element>> = [];
        for(const child of clone.children){
            refs.push(new WeakRef(child));
        }
        (<any>el)[childRefsKey] = refs;
        
    }
    //if template has itemscope attribute, assume want to do some data binding before instantiating into
    //DOM fragment.
    let cloneStashed = false;
    if(el.hasAttribute('itemscope')){
        (<any>el)[cloneKey] = clone;
        cloneStashed = true;
    }else{
        if(shadowRootModeOnLoad !== null){
            const parent = el.parentElement;
            if(parent === null) throw 404;
            if(parent.shadowRoot === null) parent.attachShadow({mode: shadowRootModeOnLoad});
            parent.shadowRoot?.append(clone);
        }else{
            el.after(clone);
        }
    }
    //moving the code down here broke be-inclusive Example2.html (but maybe it caused something else to work, so will need to revisit)
    //check to make sure the progresive loading of css-charts works as before.
    // if(level === 0){
    //     el.dispatchEvent(new LoadEvent(clone));
    // }
    
    if(!cloneStashed){
        if(level !== 0 || (slots.length === 0 && el.attributes.length === 0)) el.remove();
    }

}

export class LoadEvent extends Event implements ILoadEvent{
    static eventName: loadEventName = 'load';
    constructor(public clone: DocumentFragment){
        super(LoadEvent.eventName);
    }
}

interface HTMLElementEventMap{
    'load': LoadEvent,
}