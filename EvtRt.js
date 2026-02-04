import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events';
export class EvtRt {
    constructor(mountedElement, ctx) {
        //this.#context = ctx;
        const { observer } = ctx;
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this);
        et.addEventListener(disconnectEventName, this);
        et.addEventListener(dismountEventName, this);
        this.mount(mountedElement, ctx);
    }
    mount(mountedElement, context) {
    }
    disconnect(mountedElement, mountInit) {
    }
    dismount(mountedElement, mountInit) {
    }
    handleEvent(evt) {
        if (evt instanceof MountEvent) {
            const { matchingElement, mountContext } = evt;
            this.mount(matchingElement, mountContext);
        }
        else if (evt instanceof DismountEvent) {
            const { matchingElement, mountInit } = evt;
            this.dismount(matchingElement, mountInit);
        }
        else if (evt instanceof DisconnectEvent) {
            const { matchingElement, mountInit } = evt;
            this.disconnect(matchingElement, mountInit);
        }
    }
}
