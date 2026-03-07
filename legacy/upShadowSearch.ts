export function upShadowSearch(ref: Element, id: string){
    let rn = ref.getRootNode() as any;
    while(rn){
        let test = rn.getElementById(id);
        if(test) return test as Element;
        if(rn.host){
            test = (<any>rn.host)[id];
            if(test instanceof HTMLElement) return test;
            rn = rn.host.getRootNode() as (DocumentFragment | ShadowRoot) & { host?: Element };
        }else if(rn === document){
            return null;
        }else if(!rn.isConnected){
            if(rn.targetFragment){
                rn = rn.targetFragment;
            }else{
                rn = document;
            }
            

        }
    }
}

