import {sym} from './regIsh.js';
export function getIsh(scope: Element | ShadowRoot | Document, name: string){
    let test = scope as any;
    
    while(true){
        const map = test[sym] as Map<string, ({new() : Object})>;
        if(map !== undefined){
            if(map.has(name)){
                return map.get(name);
            }
        }
        if(test === document) return 404;
        if(test instanceof ShadowRoot){
            test = test.host;
            continue;
        }
        let newTest = test.parentElement;
        if(newTest){
            test = newTest;
            continue;
        }
        newTest = test.getRootNode();
    }
}