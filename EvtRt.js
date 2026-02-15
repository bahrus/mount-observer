import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events.js';
export class EvtRt {
    constructor(mountedElement, ctx) {
        const { observer, MountConfig } = ctx;
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this);
        et.addEventListener(disconnectEventName, this);
        et.addEventListener(dismountEventName, this);
        this.mount(mountedElement, MountConfig, ctx);
    }
    mount(mountedElement, MountConfig, context) {
        console.log({ mountedElement, MountConfig, context });
    }
    disconnect(mountedElement, MountConfig) {
        console.log({ mountedElement, MountConfig });
    }
    dismount(mountedElement, MountConfig) {
        console.log({ mountedElement, MountConfig });
    }
    handleEvent(evt) {
        if (evt instanceof MountEvent) {
            const { mountedElement, mountContext, MountConfig } = evt;
            this.mount(mountedElement, MountConfig, mountContext);
        }
        else if (evt instanceof DismountEvent) {
            const { mountedElement, MountConfig } = evt;
            this.dismount(mountedElement, MountConfig);
        }
        else if (evt instanceof DisconnectEvent) {
            const { mountedElement, MountConfig } = evt;
            this.disconnect(mountedElement, MountConfig);
        }
    }
}
