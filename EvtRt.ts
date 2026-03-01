import {MountContext, MountConfig} from './types/mount-observer/types.js';

import { 
    DismountEvent, MountEvent, DisconnectEvent,
    dismountEventName, disconnectEventName, mountEventName 
} from './Events.js';
import { MountObserver } from './MountObserver.js';
export class EvtRt implements EventListenerObject{

    
    #ac: AbortController;

    constructor(mountedElement: Element, ctx: MountContext ){
        const {observer, MountConfig} = ctx;
        this.#ac = new AbortController();
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this, {signal: this.#ac.signal});
        et.addEventListener(disconnectEventName, this, {signal: this.#ac.signal});
        et.addEventListener(dismountEventName, this, {signal: this.#ac.signal});
        this.mount(mountedElement, MountConfig, ctx);

    }

    abort(){
        this.#ac.abort();
    }

    mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext){
        console.log({mountedElement, MountConfig, context});
    }

    disconnect(mountedElement: Element, MountConfig: MountConfig){
        console.log({mountedElement, MountConfig});
    }

    dismount(mountedElement: Element, MountConfig: MountConfig){
        console.log({mountedElement, MountConfig});
    }

    handleEvent(evt: Event): void {
        if(evt instanceof MountEvent){
            const {mountedElement, mountContext, MountConfig} = evt;
            this.mount(mountedElement, MountConfig, mountContext);
        }else if(evt instanceof DismountEvent){
            const {mountedElement, MountConfig} = evt;
            this.dismount(mountedElement, MountConfig);
        }else if(evt instanceof DisconnectEvent){
            const {mountedElement, MountConfig} = evt;
            this.disconnect(mountedElement, MountConfig);
        }
    }
}

MountObserver.define('builtIns.logToConsole', EvtRt);