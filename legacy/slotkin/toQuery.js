export function toQuery(el) {
    //from the element el, create a selector that matches all the classes and parts of the element el, as 
    //well as the values of all the attributes of el.
    const classes = Array.from(el.classList).map(c => `.${c}`).join('');
    const parts = Array.from(el.part).map(p => `[part~="${p}"`).join('');
    const attributes = Array.from(el.attributes)
        .filter(attr => attr.name !== '-i')
        .map(attr => `[${attr.name}="${attr.value}"]`)
        .join('');
    const { localName } = el;
    return `${localName}${classes}${parts}${attributes}`;
}
