import { ILoadEvent, loadEventName } from './types';
import { MountObserver, inclTemplQry } from './MountObserver.js';

export async function birtualizeMatch(self: MountObserver, el: HTMLTemplateElement, level: number){
        
    const href = el.getAttribute('href');
    el.removeAttribute('href');
    const templID = href!.substring(1);
    const fragment = self.objNde?.deref() as DocumentFragment;
    if(fragment === undefined) return;
    const templ = self.findByID(templID, fragment);
    if(!(templ instanceof HTMLTemplateElement)) throw 404;
    const clone = templ.content.cloneNode(true) as DocumentFragment;
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
    await self.birtualizeFragment(clone, level + 1);
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
    
    if(shadowRootModeOnLoad !== null){
        const parent = el.parentElement;
        if(parent === null) throw 404;
        if(parent.shadowRoot === null) parent.attachShadow({mode: shadowRootModeOnLoad});
        parent.shadowRoot?.append(clone);
    }else{
        el.after(clone);
    }
    
    if(level !== 0 || slots.length === 0) el.remove();

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