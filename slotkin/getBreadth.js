export function getBreadth(innerEl, base) {
    const priors = [];
    let ps = innerEl.previousSibling;
    while (ps !== null && !(ps.nodeType === Node.COMMENT_NODE && !ps.data.includes(` ${base} `))) {
        priors.push(ps);
        ps = ps.previousSibling;
    }
    if (ps !== null)
        priors.push(ps);
    const nexts = [];
    let ns = innerEl.nextSibling;
    while (ns !== null && !(ns.nodeType === Node.COMMENT_NODE && !ns.data.includes(` /${base} `))) {
        nexts.push(ns);
        ns = ns.nextSibling;
    }
    if (ns !== null)
        nexts.push(ns);
    return [...priors.reverse(), ...nexts];
}
