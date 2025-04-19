export function waitForIsh(el) {
    return new Promise((resolve, reject) => {
        const ish = el['ish'];
        if (ish) {
            resolve(ish);
        }
        else {
            // If the element is not yet defined, wait for it to be defined
            el.addEventListener('ishAttached', () => {
                const ish = el['ish'];
                if (ish) {
                    resolve(ish);
                }
                else {
                    reject(new Error('ish not found'));
                }
            }, { once: true });
        }
    });
}
