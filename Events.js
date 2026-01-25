export class MountEvent extends CustomEvent {
    constructor(matchingElement, modules) {
        super('mount', {
            detail: { matchingElement, modules }
        });
    }
}
export class DismountEvent extends CustomEvent {
    constructor(matchingElement) {
        super('dismount', {
            detail: { matchingElement }
        });
    }
}
export class DisconnectEvent extends CustomEvent {
    constructor(matchingElement) {
        super('disconnect', {
            detail: { matchingElement }
        });
    }
}
export class LoadEvent extends CustomEvent {
    constructor(modules) {
        super('load', {
            detail: { modules }
        });
    }
}
