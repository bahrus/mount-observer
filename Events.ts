// Event classes for MountObserver
import {
    mountEventName,
    dismountEventName,
    disconnectEventName,
    loadEventName
} from './constants.js';

export class MountEvent extends CustomEvent<{ matchingElement: Element; modules: any[] }> {
    constructor(matchingElement: Element, modules: any[]) {
        super('mount', {
            detail: { matchingElement, modules }
        });
    }
}

export class DismountEvent extends CustomEvent<{ matchingElement: Element }> {
    constructor(matchingElement: Element) {
        super('dismount', {
            detail: { matchingElement }
        });
    }
}

export class DisconnectEvent extends CustomEvent<{ matchingElement: Element }> {
    constructor(matchingElement: Element) {
        super('disconnect', {
            detail: { matchingElement }
        });
    }
}

export class LoadEvent extends CustomEvent<{ modules: any[] }> {
    constructor(modules: any[]) {
        super('load', {
            detail: { modules }
        });
    }
}
