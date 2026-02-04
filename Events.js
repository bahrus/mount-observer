// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const attrchangeEventName = 'attrchange';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';
export class MountEvent extends Event {
    matchingElement;
    modules;
    mountInit;
    mountContext;
    static eventName = mountEventName;
    constructor(matchingElement, modules, mountInit, mountContext) {
        super(MountEvent.eventName);
        this.matchingElement = matchingElement;
        this.modules = modules;
        this.mountInit = mountInit;
        this.mountContext = mountContext;
    }
}
export class DismountEvent extends Event {
    matchingElement;
    reason;
    mountInit;
    static eventName = dismountEventName;
    constructor(matchingElement, reason, mountInit) {
        super(DismountEvent.eventName);
        this.matchingElement = matchingElement;
        this.reason = reason;
        this.mountInit = mountInit;
    }
}
export class DisconnectEvent extends Event {
    matchingElement;
    mountInit;
    static eventName = disconnectEventName;
    constructor(matchingElement, mountInit) {
        super(DisconnectEvent.eventName);
        this.matchingElement = matchingElement;
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
export class AttrChangeEvent extends Event {
    changes;
    mountInit;
    static eventName = attrchangeEventName;
    constructor(changes, mountInit) {
        super(AttrChangeEvent.eventName);
        this.changes = changes;
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
