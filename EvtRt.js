import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events.js';
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
        console.log({ mountedElement, mountInit, context });
    }
    disconnect(mountedElement, mountInit) {
        console.log({ mountedElement, mountInit });
    }
    dismount(mountedElement, mountInit) {
        console.log({ mountedElement, mountInit });
    }
    handleEvent(evt) {
        if (evt instanceof MountEvent) {
            const { mountedElement, mountContext, mountInit } = evt;
            this.mount(mountedElement, mountInit, mountContext);
        }
        else if (evt instanceof DismountEvent) {
            const { mountedElement, mountInit } = evt;
            this.dismount(mountedElement, mountInit);
        }
        else if (evt instanceof DisconnectEvent) {
            const { mountedElement, mountInit } = evt;
            this.disconnect(mountedElement, mountInit);
        }
    }
}
