// Event classes for MountObserver
import { mountEventName, dismountEventName, disconnectEventName, loadEventName } from './constants.js';
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
