
export function matches(lhs: Element, rhs: Element){
    //lhs matches rhs if all the css classes of lhs are found in the classList of rhs,
    //and all the parts of lhs are found in the part of rhs,
    //and all the other attributes of lhs are found in the attributes of rhs.
    if(lhs.classList.length !== 0 && !rhs.classList.contains(...lhs.classList)) return false;
    if(lhs.part.length !== 0 && !rhs.part.contains(...lhs.part)) return false;
    for(const attr of lhs.attributes){
        if(attr.name === 'class' || attr.name === 'part') continue; //already checked
        if(!rhs.hasAttribute(attr.name)) return false;
        if(rhs.getAttribute(attr.name) !== attr.value) return false;
    }
}