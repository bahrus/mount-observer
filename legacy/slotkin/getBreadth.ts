export function getBreadth(
    innerEl: Element, 
    base: string,
){
    const priors: Array<Node> = [];
    let ps = innerEl.previousSibling as Comment | null;
    while(ps !== null && !(ps.nodeType === Node.COMMENT_NODE && (ps as Comment).data.includes( ` ${base} `))){
        priors.push(ps);
        ps = ps.previousSibling as Comment | null;
    }
    if(ps !== null) priors.push(ps);
    const nexts: Array<Node> = [];
    let ns = innerEl.nextSibling as Comment | null; 
    while(ns !== null && !(ns.nodeType === Node.COMMENT_NODE && (ns as Comment).data.includes( ` /${base} `))){
        nexts.push(ns);
        ns = ns.nextSibling as Comment | null;
    }
    if(ns !== null) nexts.push(ns);
    return [...priors.reverse(), ...nexts];
        
}