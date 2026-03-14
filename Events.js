// Event classes for MountObserver
// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';
export const resolvedEventName = 'resolved';

export class MountEvent extends Event {
    static eventName = mountEventName;
    
    constructor(mountedElement, modules, mountConfig, mountContext) {
        super(MountEvent.eventName);
        this.mountedElement = mountedElement;
        this.modules = modules;
        this.mountConfig = mountConfig;
        this.mountContext = mountContext;
    }
}

export class DismountEvent extends Event {
    static eventName = dismountEventName;
    
    constructor(mountedElement, reason, mountConfig) {
        super(DismountEvent.eventName);
        this.mountedElement = mountedElement;
        this.reason = reason;
        this.mountConfig = mountConfig;
    }
}

export class DisconnectEvent extends Event {
    static eventName = disconnectEventName;
    
    constructor(mountedElement, mountConfig) {
        super(DisconnectEvent.eventName);
        this.mountedElement = mountedElement;
        this.mountConfig = mountConfig;
    }
}

export class LoadEvent extends Event {
    static eventName = loadEventName;
    
    constructor(modules, mountConfig) {
        super(LoadEvent.eventName);
        this.modules = modules;
        this.mountConfig = mountConfig;
    }
}

export class MediaMatchEvent extends Event {
    static eventName = mediamatchEventName;
    
    constructor(mountConfig) {
        super(MediaMatchEvent.eventName);
        this.mountConfig = mountConfig;
    }
}

export class MediaUnmatchEvent extends Event {
    static eventName = mediaunmatchEventName;
    
    constructor(mountConfig) {
        super(MediaUnmatchEvent.eventName);
        this.mountConfig = mountConfig;
    }
}

export class ResolvedEvent extends Event {
    static eventName = resolvedEventName;
    
    constructor(exportValue) {
        super(ResolvedEvent.eventName);
        this.export = exportValue;
    }
}
