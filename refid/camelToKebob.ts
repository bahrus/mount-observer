const ctlRe = /(?=[A-Z])/;
export function camelToKebob(s: string) {
    return s.split(ctlRe).join('-').toLowerCase();
}