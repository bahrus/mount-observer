export const sym = Symbol.for('La8Cx9vHsUOd03WomqdnPw');
export function regIsh(scope: Element | ShadowRoot | Document, ctr:({new() : Object}), name: string){
    let map = (<any>scope)[sym] as Map<string, ({new() : Object}) | (() => Promise<{new() : Object}>)>;
    if(map === undefined){
        map = new Map<string, ({new() : Object})>
        (<any>scope)[sym] = map;
    }
    if(map.has(name)){
        throw 403;
    }
    map.set(name, ctr);
}