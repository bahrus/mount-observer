import {IshCtr} from '../ts-refs/mount-observer/types';
export const guid = 'La8Cx9vHsUOd03WomqdnPw'
export const sym = Symbol.for(guid);

export function regIsh(scope: Element | ShadowRoot | Document, name: string, ctr:IshCtr){
    let map = (<any>scope)[sym] as Map<string, IshCtr>;
    if(map === undefined){
        map = new Map<string, IshCtr>();
        (<any>scope)[sym] = map;
    }
    if(map.has(name)){
        throw 403;
    }
    map.set(name, ctr);
    document.dispatchEvent(new Event(guid));
}