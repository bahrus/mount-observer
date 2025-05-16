import { Assigner, BindishOptions } from './ts-refs/mount-observer/types.js';

export const itemscopeQry = '[itemscope]:not([itemscope=""])';
export async function bindish(fragment: DocumentFragment, options?: BindishOptions){
    const scopes = Array.from(fragment.querySelectorAll(`${itemscopeQry}`));
    await bindishIt(scopes, options);
}

export async function bindishIt(scopes: Array<Element>, options?: BindishOptions){
    for(const scope of scopes){
        const itemscope = scope.getAttribute('itemscope');
        if(itemscope && !((<any>scope).ish instanceof HTMLElement)){
            const {Newish} = await import('./Newish.js');
            new Newish(scope, itemscope, options);
        }
    }
}