import './hostish.js';

export function getContext<T extends Object>(el: Element, ctr: {new(): T}){
    let hostish = (<any>el).hostish(false);
    while(hostish && !(hostish instanceof ctr)){
        if('hostish' in hostish){
            hostish = hostish.hostish();
        }else{
            return null;
        }
        
    }
    return hostish;
}