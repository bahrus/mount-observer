import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events.js';
export class EvtRt {
    #ac;
    constructor(mountedElement, ctx) {
        const { observer, MountConfig } = ctx;
        this.#ac = new AbortController();
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this, { signal: this.#ac.signal });
        et.addEventListener(disconnectEventName, this, { signal: this.#ac.signal });
        et.addEventListener(dismountEventName, this, { signal: this.#ac.signal });
        this.mount(mountedElement, MountConfig, ctx);
    }
    abort() {
        this.#ac.abort();
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
