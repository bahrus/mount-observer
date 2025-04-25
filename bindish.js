export const itemscopeQry = '[itemscope*="-"]';
export async function bindish(fragment, assigner) {
    const scopes = Array.from(fragment.querySelectorAll(`${itemscopeQry}`));
    await bindishIt(scopes, assigner);
}
export async function bindishIt(scopes, assigner) {
    for (const scope of scopes) {
        const itemscope = scope.getAttribute('itemscope');
        if (itemscope && itemscope.includes('-') && !(scope.ish instanceof HTMLElement)) {
            const { Newish } = await import('./Newish.js');
            new Newish(scope, itemscope, assigner);
        }
    }
}
