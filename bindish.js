export const itemscopeQry = '[itemscope*="-"]';
export async function bindish(fragment, options) {
    const scopes = Array.from(fragment.querySelectorAll(`${itemscopeQry}`));
    await bindishIt(scopes, options);
}
export async function bindishIt(scopes, options) {
    for (const scope of scopes) {
        const itemscope = scope.getAttribute('itemscope');
        if (itemscope && itemscope.includes('-') && !(scope.ish instanceof HTMLElement)) {
            const { Newish } = await import('./Newish.js');
            new Newish(scope, itemscope, options);
        }
    }
}
