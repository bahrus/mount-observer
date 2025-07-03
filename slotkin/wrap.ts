export const wrapped = Symbol.for('50tzQZt95ECXUtHF7a40og');

export function wrap(
    templ: HTMLTemplateElement, 
    base: string,
    force: boolean = false,
){
    const wasWrapped = (<any>templ)[wrapped];
    if (!wasWrapped) {
        (<any>templ)[wrapped] = base;
        if (force || templ.content.childElementCount > 1) {
            const start = document.createComment(base);
            templ.content.prepend(start);
            const end = document.createComment(`/${base}`);
            templ.content.appendChild(end);
        }
    }
}