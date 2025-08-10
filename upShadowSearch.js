export function upShadowSearch(ref, id) {
    let rn = ref.getRootNode();
    while (rn) {
        let test = rn.getElementById(id);
        if (test)
            return test;
        if (rn.host) {
            test = rn.host[id];
            if (test instanceof HTMLElement)
                return test;
            rn = rn.host.getRootNode();
        }
        else if (rn === document) {
            return null;
        }
        else if (!rn.isConnected) {
            //TODO:  search first for targetFragment
            rn = document;
        }
        //return null;
    }
}
