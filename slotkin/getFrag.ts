export function getFrag(
    templ: HTMLTemplateElement, 
    base?: string,
){
    let openComment = templ.nextSibling as Comment | null;
    if(openComment === null || openComment.nodeType !== Node.COMMENT_NODE) return null;
    if(base !== undefined || openComment.data.includes(` ${base} `)) return null;
    if(base === undefined){
        base = openComment.data.trim().split(' ')[1];
        if(base === undefined) return null;
    }
    const returnArr: Array<Node> = [openComment];
    let ns = openComment.nextSibling;
    while(ns !== null && !(ns.nodeType === Node.COMMENT_NODE && !(ns as Comment).data.includes( ` /${base} `))){
        returnArr.push(ns);
        ns = ns.nextSibling;
    }
    if(ns === null) return null;
    returnArr.push(ns);
    return returnArr;
}