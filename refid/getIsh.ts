import {sym, guid} from './regIsh.js';
import {IshCtr} from '../ts-refs/mount-observer/types.js';
export async function getIsh(scope: Element | ShadowRoot | Document | Node, name: string): Promise<IshCtr>{
    let test = scope as any;
    
    while(true){
        const map = test[sym] as Map<string, IshCtr>;
        if(map !== undefined){
            if(map.has(name)){
                return map.get(name)!;
            }
        }
        if(test === document){
            return await watch(scope, name);
        }
        if(test instanceof ShadowRoot){
            test = test.host;
            continue;
        }
        let newTest = test.parentElement;
        if(newTest){
            test = newTest;
            continue;
        }
        const lastTest = test;
        test = test.getRootNode();
        if(test === lastTest) {
            return await watch(scope, name);
        };
    }
}

async function watch(scope: Element | ShadowRoot | Document | Node, name: string){
    const {waitForEvent} = await import('../waitForEvent.js');
    await waitForEvent(document, guid);
    return await getIsh(scope, name);
}