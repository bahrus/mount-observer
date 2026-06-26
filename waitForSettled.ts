/**
 * Waits for a DOM subtree to "settle" — i.e., for mutations to stop cascading.
 * 
 * Observes the root node for any DOM mutations (childList, attributes, characterData)
 * and debounces: each mutation resets the idle timer. When no mutations have occurred
 * for `idleMs` milliseconds, the promise resolves.
 * 
 * If `timeout` is specified and mutations never quiesce within that window, the
 * promise rejects.
 * 
 * @param root - The node to observe (typically a DocumentFragment or Element)
 * @param idleMs - Debounce window in milliseconds. Default: 100
 * @param timeout - Maximum wait time in milliseconds. If exceeded, rejects. Default: none (infinite)
 */
export function waitForSettled(
    root: Node,
    idleMs: number = 100,
    timeout?: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout>;
        let maxTimer: ReturnType<typeof setTimeout> | undefined;

        const mo = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                mo.disconnect();
                if (maxTimer) clearTimeout(maxTimer);
                resolve();
            }, idleMs);
        });

        mo.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        // Initial timer — resolves if no mutations happen at all
        timer = setTimeout(() => {
            mo.disconnect();
            if (maxTimer) clearTimeout(maxTimer);
            resolve();
        }, idleMs);

        // Maximum timeout — rejects if mutations never quiesce
        if (timeout !== undefined) {
            maxTimer = setTimeout(() => {
                mo.disconnect();
                clearTimeout(timer);
                reject(new Error(
                    `waitForSettled: mutations did not quiesce within ${timeout}ms`
                ));
            }, timeout);
        }
    });
}
