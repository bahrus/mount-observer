// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';
export class MountEvent extends Event {
    mountedElement;
    modules;
    mountInit;
    mountContext;
    static eventName = mountEventName;
    constructor(mountedElement, modules, mountInit, mountContext) {
        super(MountEvent.eventName);
        this.mountedElement = mountedElement;
        this.modules = modules;
        this.mountInit = mountInit;
        this.mountContext = mountContext;
    }
}
export class DismountEvent extends Event {
    mountedElement;
    reason;
    mountInit;
    static eventName = dismountEventName;
    constructor(mountedElement, reason, mountInit) {
        super(DismountEvent.eventName);
        this.mountedElement = mountedElement;
        this.reason = reason;
        this.mountInit = mountInit;
    }
}
export class DisconnectEvent extends Event {
    mountedElement;
    mountInit;
    static eventName = disconnectEventName;
    constructor(mountedElement, mountInit) {
        super(DisconnectEvent.eventName);
        this.mountedElement = mountedElement;
        this.mountInit = mountInit;
    }
}
export class LoadEvent extends Event {
    modules;
    mountInit;
    static eventName = loadEventName;
    constructor(modules, mountInit) {
        super(LoadEvent.eventName);
        this.modules = modules;
        this.mountInit = mountInit;
    }
}
export class MediaMatchEvent extends Event {
    mountInit;
    static eventName = mediamatchEventName;
    constructor(mountInit) {
        super(MediaMatchEvent.eventName);
        this.mountInit = mountInit;
    }
}
export class MediaUnmatchEvent extends Event {
    mountInit;
    static eventName = mediaunmatchEventName;
    constructor(mountInit) {
        super(MediaUnmatchEvent.eventName);
        this.mountInit = mountInit;
    }
}
