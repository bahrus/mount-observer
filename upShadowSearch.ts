export function upShadowSearch(ref: Element, id: string){
    let rn = ref.getRootNode() as (Document | DocumentFragment | ShadowRoot) & { host?: Element };
    while(rn){
        let test = rn.getElementById(id);
        if(test) return test;
        if(rn.host){
            test = rn.host[id];
            if(test instanceof HTMLElement) return test;
            rn = rn.host.getRootNode() as (DocumentFragment | ShadowRoot) & { host?: Element };
        }else if(rn === document){
            return null;
        }
        return null;
    }
}

