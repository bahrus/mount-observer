import {IshCtr} from '../ts-refs/mount-observer/types';
export const guid = 'La8Cx9vHsUOd03WomqdnPw'
export const sym = Symbol.for(guid);
import {arr} from './secretKeys.js';

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
    ctr.prototype[Symbol.iterator] = function() {
        var index = -1;
        var data  = this[arr];

        return {
            next: function() {
                return { 
                    value: data === undefined ? undefined : data[++index], 
                    done: data ===  undefined || !(index in data) 
                }
            }
        };
    };

    document.dispatchEvent(new Event(guid));
}