export function getFrag(
    templ: HTMLTemplateElement, 
    base: string,
){
    let openComment = templ.nextSibling as Comment | null;
    if(openComment === null || openComment.nodeType !== Node.COMMENT_NODE || openComment.data.includes(` ${base} `)) return null;
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