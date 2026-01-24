export const itemscopeQry = '[itemscope]:not([itemscope=""])';
export async function bindish(fragment, target, options) {
    const scopes = Array.from(fragment.querySelectorAll(`${itemscopeQry}`));
    await bindishIt(scopes, target, options);
}
export async function bindishIt(scopes, target, options) {
    for (const scope of scopes) {
        const itemscope = scope.getAttribute('itemscope');
        if (itemscope && !(scope.ish instanceof HTMLElement)) {
            const { Newish } = await import('./Newish.js');
            const newIsh = new Newish(scope, target, itemscope, options);
            await newIsh.do();
        }
    }
}
