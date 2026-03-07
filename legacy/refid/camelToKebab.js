const ctlRe = /(?=[A-Z])/;
export function camelToKebab(s) {
    return s.split(ctlRe).join('-').toLowerCase();
}
