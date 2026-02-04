import {MountContext, MountInit} from './types';

import { 
    DismountEvent, MountEvent, DisconnectEvent,
    dismountEventName, disconnectEventName, mountEventName 
} from './Events';
export class EvtRt implements EventListenerObject{
    constructor(mountedElement: Element, ctx: MountContext ){
        //this.#context = ctx;
        const {observer} = ctx;
        const et = observer.getNotifier(mountedElement);
        et.addEventListener(mountEventName, this);
        et.addEventListener(disconnectEventName, this);
        et.addEventListener(dismountEventName, this);
        this.mount(mountedElement, ctx);

    }

    mount(mountedElement: Element, context: MountContext){
        
    }

    disconnect(mountedElement: Element, mountInit: MountInit){
        
    }

    dismount(mountedElement: Element, mountInit: MountInit){

    }

    handleEvent(evt: Event): void {
        if(evt instanceof MountEvent){
            const {matchingElement, mountContext} = evt;
            this.mount(matchingElement, mountContext);
        }else if(evt instanceof DismountEvent){
            const {matchingElement, mountInit} = evt;
            this.dismount(matchingElement, mountInit);
        }else if(evt instanceof DisconnectEvent){
            const {matchingElement, mountInit} = evt;
            this.disconnect(matchingElement, mountInit);
        }
    }
}