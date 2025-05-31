export function doCleanup(htmlSrc, clone, options = {
    removeInner: '[itemprop]:not([itemscope])',
    removeOuter: '[itemprop][itemscope]'
}) {
    const removeInner = htmlSrc.getAttribute('remove-inner') || options.removeInner;
    if (removeInner) {
        const removeInnerEls = clone.querySelectorAll(removeInner);
        for (const removeInnerEl of removeInnerEls) {
            if ('href' in removeInnerEl) {
                removeInnerEl.href = '';
            }
            else if ('value' in removeInnerEl) {
                removeInnerEl.value = '';
            }
            else if ('datetime' in removeInnerEl) {
                removeInnerEl.datetime = '';
            }
            else {
                //any other exceptions?                       
                removeInnerEl.textContent = '';
            }
        }
    }
    const removeOuter = htmlSrc.getAttribute('remove-outer') || options.removeOuter;
    if (removeOuter) {
        const removeOuterEls = clone.querySelectorAll(removeOuter);
        for (const removeOuterEl of removeOuterEls) {
            removeOuterEl.remove();
        }
    }
}
