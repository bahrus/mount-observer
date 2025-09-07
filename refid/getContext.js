import './hostish.js';
export function getContext(el, ctr) {
    let hostish = el.hostish(false);
    while (hostish && !(hostish instanceof ctr)) {
        if ('hostish' in hostish) {
            hostish = hostish.hostish();
        }
        else {
            return null;
        }
    }
    return hostish;
}
