// Event classes for MountObserver
import {
    mountEventName,
    dismountEventName,
    disconnectEventName,
    loadEventName
} from './constants.js';
import type { IMountEvent, IDismountEvent } from './types.js';

export class MountEvent extends Event implements IMountEvent {
    static eventName: typeof mountEventName = mountEventName;
    
    constructor(public matchingElement: Element, public modules: any[]) {
        super(MountEvent.eventName);
    }
}

export class DismountEvent extends Event implements IDismountEvent {
    static eventName: typeof dismountEventName = dismountEventName;
    
    constructor(public matchingElement: Element) {
        super(DismountEvent.eventName);
    }
}

export class DisconnectEvent extends Event {
    static eventName: typeof disconnectEventName = disconnectEventName;
    
    constructor(public matchingElement: Element) {
        super(DisconnectEvent.eventName);
    }
}

export class LoadEvent extends Event {
    static eventName: typeof loadEventName = loadEventName;
    
    constructor(public modules: any[]) {
        super(LoadEvent.eventName);
    }
}
