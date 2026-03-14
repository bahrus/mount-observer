// Event classes for MountObserver
import type { IMountEvent, IDismountEvent, MountConfig, DismountReason, MountContext } from './types/mount-observer/types.js';

// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';
export const resolvedEventName = 'resolved';

export class MountEvent extends Event implements IMountEvent {
    static eventName: typeof mountEventName = mountEventName;
    
    constructor(
        public mountedElement: Element, 
        public modules: any[], 
        public mountConfig: MountConfig,
        public mountContext: MountContext
    ) {
        super(MountEvent.eventName);
    }
}

export class DismountEvent extends Event implements IDismountEvent {
    static eventName: typeof dismountEventName = dismountEventName;
    
    constructor(public mountedElement: Element, public reason: DismountReason, public mountConfig: MountConfig) {
        super(DismountEvent.eventName);
    }
}

export class DisconnectEvent extends Event {
    static eventName: typeof disconnectEventName = disconnectEventName;
    
    constructor(public mountedElement: Element, public mountConfig: MountConfig) {
        super(DisconnectEvent.eventName);
    }
}

export class LoadEvent extends Event {
    static eventName: typeof loadEventName = loadEventName;
    
    constructor(public modules: any[], public mountConfig: MountConfig) {
        super(LoadEvent.eventName);
    }
}

export class MediaMatchEvent extends Event {
    static eventName: typeof mediamatchEventName = mediamatchEventName;
    
    constructor(public mountConfig: MountConfig) {
        super(MediaMatchEvent.eventName);
    }
}

export class MediaUnmatchEvent extends Event {
    static eventName: typeof mediaunmatchEventName = mediaunmatchEventName;
    
    constructor(public mountConfig: MountConfig) {
        super(MediaUnmatchEvent.eventName);
    }
}

export class ResolvedEvent extends Event {
    static eventName: typeof resolvedEventName = resolvedEventName;
    
    export: any;
    
    constructor(exportValue: any) {
        super(ResolvedEvent.eventName);
        this.export = exportValue;
    }
}
