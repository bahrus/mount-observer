// Event name constants
export const loadEventName = 'load';
export const mountEventName = 'mount';
export const dismountEventName = 'dismount';
export const disconnectEventName = 'disconnect';
export const attrchangeEventName = 'attrchange';
export class MountEvent extends Event {
    matchingElement;
    modules;
    static eventName = mountEventName;
    constructor(matchingElement, modules) {
        super(MountEvent.eventName);
        this.matchingElement = matchingElement;
        this.modules = modules;
    }
}
export class DismountEvent extends Event {
    matchingElement;
    static eventName = dismountEventName;
    constructor(matchingElement) {
        super(DismountEvent.eventName);
        this.matchingElement = matchingElement;
    }
}
export class DisconnectEvent extends Event {
    matchingElement;
    static eventName = disconnectEventName;
    constructor(matchingElement) {
        super(DisconnectEvent.eventName);
        this.matchingElement = matchingElement;
    }
}
export class LoadEvent extends Event {
    modules;
    static eventName = loadEventName;
    constructor(modules) {
        super(LoadEvent.eventName);
        this.modules = modules;
    }
}
export class AttrChangeEvent extends Event {
    changes;
    static eventName = attrchangeEventName;
    constructor(changes) {
        super(AttrChangeEvent.eventName);
        this.changes = changes;
    }
}
