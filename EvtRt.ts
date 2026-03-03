import {MountContext, MountConfig} from './types/mount-observer/types.js';

import { 
    DismountEvent, MountEvent, DisconnectEvent,
    dismountEventName, disconnectEventName, mountEventName 
} from './Events.js';
import { MountObserver } from './MountObserver.js';
export class EvtRt implements EventListenerObject{

    
    #ac: AbortController;

    constructor(mountedElement: Element, ctx: MountContext ){
        const {observer, mountConfig} = ctx;
        this.#ac = new AbortController();
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this, {signal: this.#ac.signal});
        et.addEventListener(disconnectEventName, this, {signal: this.#ac.signal});
        et.addEventListener(dismountEventName, this, {signal: this.#ac.signal});
        this.mount(mountedElement, mountConfig, ctx);

    }

    abort(){
        this.#ac.abort();
    }

    mount(mountedElement: Element, mountConfig: MountConfig, context: MountContext){
        console.log({mountedElement, mountConfig, context});
    }

    disconnect(mountedElement: Element, mountConfig: MountConfig){
        console.log({mountedElement, mountConfig});
    }

    dismount(mountedElement: Element, mountConfig: MountConfig){
        console.log({mountedElement, mountConfig});
    }

    handleEvent(evt: Event): void {
        if(evt instanceof MountEvent){
            const {mountedElement, mountContext, mountConfig} = evt;
            this.mount(mountedElement, mountConfig, mountContext);
        }else if(evt instanceof DismountEvent){
            const {mountedElement, mountConfig} = evt;
            this.dismount(mountedElement, mountConfig);
        }else if(evt instanceof DisconnectEvent){
            const {mountedElement, mountConfig} = evt;
            this.disconnect(mountedElement, mountConfig);
        }
    }
}

MountObserver.define('builtIns.logToConsole', EvtRt);