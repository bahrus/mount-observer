import { DismountEvent, MountEvent, DisconnectEvent, dismountEventName, disconnectEventName, mountEventName } from './Events.js';
import { MountObserver } from './MountObserver.js';
export class EvtRt {
    #ac;
    constructor(mountedElement, ctx) {
        const { observer, mountConfig } = ctx;
        this.#ac = new AbortController();
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this, { signal: this.#ac.signal });
        et.addEventListener(disconnectEventName, this, { signal: this.#ac.signal });
        et.addEventListener(dismountEventName, this, { signal: this.#ac.signal });
        this.mount(mountedElement, mountConfig, ctx);
    }
    abort() {
        this.#ac.abort();
    }
    mount(mountedElement, mountConfig, context) {
        console.log({ mountedElement, mountConfig, context });
    }
    disconnect(mountedElement, mountConfig) {
        console.log({ mountedElement, mountConfig });
    }
    dismount(mountedElement, mountConfig) {
        console.log({ mountedElement, mountConfig });
    }
    handleEvent(evt) {
        if (evt instanceof MountEvent) {
            const { mountedElement, mountContext, mountConfig } = evt;
            this.mount(mountedElement, mountConfig, mountContext);
        }
        else if (evt instanceof DismountEvent) {
            const { mountedElement, mountConfig } = evt;
            this.dismount(mountedElement, mountConfig);
        }
        else if (evt instanceof DisconnectEvent) {
            const { mountedElement, mountConfig } = evt;
            this.disconnect(mountedElement, mountConfig);
        }
    }
}
MountObserver.define('builtIns.logToConsole', EvtRt);
