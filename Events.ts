// Event classes for MountObserver
import type { IMountEvent, IDismountEvent, MountConfig, DismountReason, MountContext } from './types.js';

// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';

export class MountEvent extends Event implements IMountEvent {
    static eventName: typeof mountEventName = mountEventName;
    
    constructor(
        public mountedElement: Element, 
        public modules: any[], 
        public MountConfig: MountConfig,
        public mountContext: MountContext
    ) {
        super(MountEvent.eventName);
    }
}

export class DismountEvent extends Event implements IDismountEvent {
    static eventName: typeof dismountEventName = dismountEventName;
    
    constructor(public mountedElement: Element, public reason: DismountReason, public MountConfig: MountConfig) {
        super(DismountEvent.eventName);
    }
}

export class DisconnectEvent extends Event {
    static eventName: typeof disconnectEventName = disconnectEventName;
    
    constructor(public mountedElement: Element, public MountConfig: MountConfig) {
        super(DisconnectEvent.eventName);
    }
}

export class LoadEvent extends Event {
    static eventName: typeof loadEventName = loadEventName;
    
    constructor(public modules: any[], public MountConfig: MountConfig) {
        super(LoadEvent.eventName);
    }
}

export class MediaMatchEvent extends Event {
    static eventName: typeof mediamatchEventName = mediamatchEventName;
    
    constructor(public MountConfig: MountConfig) {
        super(MediaMatchEvent.eventName);
    }
}

export class MediaUnmatchEvent extends Event {
    static eventName: typeof mediaunmatchEventName = mediaunmatchEventName;
    
    constructor(public MountConfig: MountConfig) {
        super(MediaUnmatchEvent.eventName);
    }
}
