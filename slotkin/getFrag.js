export function getFrag(templ, base) {
    let openComment = templ.nextSibling;
    if (openComment === null || openComment.nodeType !== Node.COMMENT_NODE || openComment.data.includes(` ${base} `))
        return null;
    const returnArr = [openComment];
    let ns = openComment.nextSibling;
    while (ns !== null && !(ns.nodeType === Node.COMMENT_NODE && !ns.data.includes(` /${base} `))) {
        returnArr.push(ns);
        ns = ns.nextSibling;
    }
    if (ns === null)
        return null;
    returnArr.push(ns);
    return returnArr;
}
