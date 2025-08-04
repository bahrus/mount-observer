const ctlRe = /(?=[A-Z])/;
export function camelToKebob(s) {
    return s.split(ctlRe).join('-').toLowerCase();
}
