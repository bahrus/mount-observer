// Main entry point for MountObserver v2
export { MountObserver } from './MountObserver.js';
export { whereOutside } from './whereOutside.js';
export type {
    MountInit,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    DoCallback,
    DoCallbacks,
    ImportSpec,
    IMountEvent,
    IDismountEvent
} from './types.js';
export {
    mountEventName,
    dismountEventName,
    disconnectEventName,
    loadEventName,
    attrchangeEventName,
    mediamatchEventName,
    mediaunmatchEventName
} from './Events.js';
