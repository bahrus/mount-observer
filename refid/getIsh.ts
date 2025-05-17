import {sym} from './regIsh.js';
import {IshCtr} from '../ts-refs/mount-observer/types.js';
export function getIsh(scope: Element | ShadowRoot | Document | Node, name: string){
    let test = scope as any;
    
    while(true){
        const map = test[sym] as Map<string, IshCtr>;
        if(map !== undefined){
            if(map.has(name)){
                return map.get(name);
            }
        }
        if(test === document) throw 404;
        if(test instanceof ShadowRoot){
            test = test.host;
            continue;
        }
        let newTest = test.parentElement;
        if(newTest){
            test = newTest;
            continue;
        }
        test = test.getRootNode();
        if(test === test) throw 404;
    }
}