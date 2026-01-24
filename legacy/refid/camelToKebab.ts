const ctlRe = /(?=[A-Z])/;
export function camelToKebab(s: string) {
    return s.split(ctlRe).join('-').toLowerCase();
}