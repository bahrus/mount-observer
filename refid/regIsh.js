export const guid = 'La8Cx9vHsUOd03WomqdnPw';
export const sym = Symbol.for(guid);
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
    document.dispatchEvent(new Event(guid));
}
