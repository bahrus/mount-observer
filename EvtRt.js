import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events';
export class EvtRt {
    constructor(mountedElement, ctx) {
        const { observer, mountInit } = ctx;
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this);
        et.addEventListener(disconnectEventName, this);
        et.addEventListener(dismountEventName, this);
        this.mount(mountedElement, mountInit, ctx);
    }
    mount(mountedElement, mountInit, context) {
        console.log({ mountedElement, context });
    }
    disconnect(mountedElement, mountInit) {
        console.log({ mountedElement, mountInit });
    }
    dismount(mountedElement, mountInit) {
        console.log({ mountedElement, mountInit });
    }
    handleEvent(evt) {
        if (evt instanceof MountEvent) {
            const { matchingElement, mountContext, mountInit } = evt;
            this.mount(matchingElement, mountInit, mountContext);
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
