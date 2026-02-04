// Event classes for MountObserver
import type { IMountEvent, IDismountEvent, IAttrChangeEvent, AttrChange, MountInit, DismountReason, MountContext } from './types.js';

// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const attrchangeEventName = 'attrchange';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';

export class MountEvent extends Event implements IMountEvent {
    static eventName: typeof mountEventName = mountEventName;
    
    constructor(
        public matchingElement: Element, 
        public modules: any[], 
        public mountInit: MountInit,
        public mountContext: MountContext
    ) {
        super(MountEvent.eventName);
    }
}

export class DismountEvent extends Event implements IDismountEvent {
    static eventName: typeof dismountEventName = dismountEventName;
    
    constructor(public matchingElement: Element, public reason: DismountReason, public mountInit: MountInit) {
        super(DismountEvent.eventName);
    }
}

export class DisconnectEvent extends Event {
    static eventName: typeof disconnectEventName = disconnectEventName;
    
    constructor(public matchingElement: Element, public mountInit: MountInit) {
        super(DisconnectEvent.eventName);
    }
}

export class LoadEvent extends Event {
    static eventName: typeof loadEventName = loadEventName;
    
    constructor(public modules: any[], public mountInit: MountInit) {
        super(LoadEvent.eventName);
    }
}

export class AttrChangeEvent extends Event implements IAttrChangeEvent {
    static eventName: typeof attrchangeEventName = attrchangeEventName;
    
    constructor(public changes: AttrChange[], public mountInit: MountInit) {
        super(AttrChangeEvent.eventName);
    }
}

export class MediaMatchEvent extends Event {
    static eventName: typeof mediamatchEventName = mediamatchEventName;
    
    constructor(public mountInit: MountInit) {
        super(MediaMatchEvent.eventName);
    }
}

export class MediaUnmatchEvent extends Event {
    static eventName: typeof mediaunmatchEventName = mediaunmatchEventName;
    
    constructor(public mountInit: MountInit) {
        super(MediaUnmatchEvent.eventName);
    }
}
