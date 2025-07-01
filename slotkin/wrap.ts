const wrapped = Symbol.for('50tzQZt95ECXUtHF7a40og');

export function wrap(
    templ: HTMLTemplateElement, 
    base: string,
){
    const wasWrapped = (<any>templ)[wrapped];
    if (!wasWrapped) {
        (<any>templ)[wrapped] = true;
        if (templ.content.childElementCount > 1) {
            const start = document.createComment(base);
            templ.content.prepend(start);
            const end = document.createComment(`/${base}`);
            templ.content.appendChild(end);
        }
    }
}