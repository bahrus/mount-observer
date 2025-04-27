export function waitForIsh(el: Element) : Promise<EventTarget> {
    return new Promise((resolve, reject) => {
        const ish = (<any>el)['ish']; // [TODO] should we make this something that can
        // be passed in, more generic function -- waitForProperty?
        if (ish instanceof EventTarget) {
            resolve(ish);
        } else {
            // If the element is not yet defined, wait for it to be defined
            el.addEventListener('ishAttached', () => {
                const ish = (<any>el)['ish'] as EventTarget;
                if (ish) {
                    resolve(ish);
                } else {
                    reject(new Error('ish not found'));
                }
            }, { once: true });
            
        }
    });
}