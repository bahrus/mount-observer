import { Assigner } from './ts-refs/mount-observer/types.js';

export const itemscopeQry = '[itemscope*="-"]';
export async function bindish(fragment: DocumentFragment, assigner?: Assigner){
    const scopes = Array.from(fragment.querySelectorAll(`${itemscopeQry}`));
    await bindishIt(scopes, assigner);
}

export async function bindishIt(scopes: Array<Element>, assigner?: Assigner){
    for(const scope of scopes){
        const itemscope = scope.getAttribute('itemscope');
        if(itemscope && itemscope.includes('-') && !((<any>scope).ish instanceof HTMLElement)){
            const {Newish} = await import('./Newish.js');
            new Newish(scope, itemscope, assigner);
        }
    }
}