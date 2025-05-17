import { sym } from './regIsh.js';
export function getIsh(scope, name) {
    let test = scope;
    while (true) {
        const map = test[sym];
        if (map !== undefined) {
            if (map.has(name)) {
                return map.get(name);
            }
        }
        if (test === document)
            throw 404;
        if (test instanceof ShadowRoot) {
            test = test.host;
            continue;
        }
        let newTest = test.parentElement;
        if (newTest) {
            test = newTest;
            continue;
        }
        test = test.getRootNode();
        if (test === test)
            throw 404;
    }
}
