export const guid = 'La8Cx9vHsUOd03WomqdnPw';
export const sym = Symbol.for(guid);
import { arr } from './secretKeys.js';
export function regIsh(scope, name, ctr) {
    let map = scope[sym];
    if (map === undefined) {
        map = new Map();
        scope[sym] = map;
    }
    if (map.has(name)) {
        throw 403;
    }
    map.set(name, ctr);
    ctr.prototype[Symbol.iterator] = function () {
        var index = -1;
        var data = this[arr];
        return {
            next: function () {
                return {
                    value: data === undefined ? undefined : data[++index],
                    done: data === undefined || !(index in data)
                };
            }
        };
    };
    // ctr.prototype['#arr='] = function(newArr?: any[]){
    //     if(newArr === undefined){
    //         return this[arr];
    //     }
    //     this[arr] = newArr;
    // }
    document.dispatchEvent(new Event(guid));
}
