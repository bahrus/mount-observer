export function ObsAttr(element: Element, attr: string): EventTarget{
    const eventTarget = new EventTarget();
    const obs = new MutationObserver((mutations) => {
        eventTarget.dispatchEvent(new Event('obsAttr'));
        // for(const mutation of mutations){
        //     if(mutation.type === 'attributes' && mutation.attributeName === attr){
        //         obs.disconnect();
        //         eventTarget.dispatchEvent(new Event('obsAttr'));
        //         break;
        //     }
        // }
    });
    obs.observe(element, {
        attributes: true,
        attributeFilter: [attr],
    });
    return eventTarget;
}