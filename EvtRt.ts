import {MountContext, MountInit} from './types.js';

import { 
    DismountEvent, MountEvent, DisconnectEvent,
    dismountEventName, disconnectEventName, mountEventName 
} from './Events.js';
export class EvtRt implements EventListenerObject{
    constructor(mountedElement: Element, ctx: MountContext ){
        const {observer, mountInit} = ctx;
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this);
        et.addEventListener(disconnectEventName, this);
        et.addEventListener(dismountEventName, this);
        this.mount(mountedElement, mountInit, ctx);

    }

    mount(mountedElement: Element, mountInit: MountInit, context: MountContext){
        console.log({mountedElement, context});
    }

    disconnect(mountedElement: Element, mountInit: MountInit){
        console.log({mountedElement, mountInit});
    }

    dismount(mountedElement: Element, mountInit: MountInit){
        console.log({mountedElement, mountInit});
    }

    handleEvent(evt: Event): void {
        if(evt instanceof MountEvent){
            const {mountedElement, mountContext, mountInit} = evt;
            this.mount(mountedElement, mountInit, mountContext);
        }else if(evt instanceof DismountEvent){
            const {mountedElement, mountInit} = evt;
            this.dismount(mountedElement, mountInit);
        }else if(evt instanceof DisconnectEvent){
            const {mountedElement, mountInit} = evt;
            this.disconnect(mountedElement, mountInit);
        }
    }
}