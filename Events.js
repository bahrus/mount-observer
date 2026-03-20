// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const mediamatchEventName = 'mediamatch';
export const mediaunmatchEventName = 'mediaunmatch';
export const resolvedEventName = 'resolved';
export class MountEvent extends Event {
    mountedElement;
    modules;
    mountConfig;
    mountContext;
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
    mountedElement;
    reason;
    mountConfig;
    static eventName = dismountEventName;
    constructor(mountedElement, reason, mountConfig) {
        super(DismountEvent.eventName);
        this.mountedElement = mountedElement;
        this.reason = reason;
        this.mountConfig = mountConfig;
    }
}
export class DisconnectEvent extends Event {
    mountedElement;
    mountConfig;
    static eventName = disconnectEventName;
    constructor(mountedElement, mountConfig) {
        super(DisconnectEvent.eventName);
        this.mountedElement = mountedElement;
        this.mountConfig = mountConfig;
    }
}
export class LoadEvent extends Event {
    modules;
    mountConfig;
    static eventName = loadEventName;
    constructor(modules, mountConfig) {
        super(LoadEvent.eventName);
        this.modules = modules;
        this.mountConfig = mountConfig;
    }
}
export class MediaMatchEvent extends Event {
    mountConfig;
    static eventName = mediamatchEventName;
    constructor(mountConfig) {
        super(MediaMatchEvent.eventName);
        this.mountConfig = mountConfig;
    }
}
export class MediaUnmatchEvent extends Event {
    mountConfig;
    static eventName = mediaunmatchEventName;
    constructor(mountConfig) {
        super(MediaUnmatchEvent.eventName);
        this.mountConfig = mountConfig;
    }
}
export class ResolvedEvent extends Event {
    static eventName = resolvedEventName;
    export;
    constructor(exportValue) {
        super(ResolvedEvent.eventName);
        this.export = exportValue;
    }
}
export const addedScriptElementEventName = 'addedscriptelement';
export class AddedScriptElementEvent extends Event {
    scriptElement;
    static eventName = addedScriptElementEventName;
    constructor(scriptElement) {
        super(AddedScriptElementEvent.eventName, { bubbles: false, composed: false });
        this.scriptElement = scriptElement;
    }
}
