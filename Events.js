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
    MountConfig;
    mountContext;
    static eventName = mountEventName;
    constructor(mountedElement, modules, MountConfig, mountContext) {
        super(MountEvent.eventName);
        this.mountedElement = mountedElement;
        this.modules = modules;
        this.MountConfig = MountConfig;
        this.mountContext = mountContext;
    }
}
export class DismountEvent extends Event {
    mountedElement;
    reason;
    MountConfig;
    static eventName = dismountEventName;
    constructor(mountedElement, reason, MountConfig) {
        super(DismountEvent.eventName);
        this.mountedElement = mountedElement;
        this.reason = reason;
        this.MountConfig = MountConfig;
    }
}
export class DisconnectEvent extends Event {
    mountedElement;
    MountConfig;
    static eventName = disconnectEventName;
    constructor(mountedElement, MountConfig) {
        super(DisconnectEvent.eventName);
        this.mountedElement = mountedElement;
        this.MountConfig = MountConfig;
    }
}
export class LoadEvent extends Event {
    modules;
    MountConfig;
    static eventName = loadEventName;
    constructor(modules, MountConfig) {
        super(LoadEvent.eventName);
        this.modules = modules;
        this.MountConfig = MountConfig;
    }
}
export class MediaMatchEvent extends Event {
    MountConfig;
    static eventName = mediamatchEventName;
    constructor(MountConfig) {
        super(MediaMatchEvent.eventName);
        this.MountConfig = MountConfig;
    }
}
export class MediaUnmatchEvent extends Event {
    MountConfig;
    static eventName = mediaunmatchEventName;
    constructor(MountConfig) {
        super(MediaUnmatchEvent.eventName);
        this.MountConfig = MountConfig;
    }
}
