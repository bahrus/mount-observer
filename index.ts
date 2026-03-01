// Main entry point for MountObserver v2
export { MountObserver } from './MountObserver.js';
export { withScopePerimeter } from './withScopePerimeter.js';
export { emitMountedElementEvents } from './emitEvents.js';
export { arr } from './arr.js';
export { EvtRt } from './EvtRt.js';
export { DefineCustomElementHandler, DefineScopedCustomElementHandler } from './handlers/DefineCustomElement.js';
export { EnhanceMountedElementHandler } from './handlers/EnhanceMountedElement.js';
export type {
    MountConfig,
    MountObserverOptions,
    IMountObserver,
    MountContext,
    DoCallback,
    ImportSpec,
    IMountEvent,
    IDismountEvent
} from './types/mount-observer/types.js';
export {
    mountEventName,
    dismountEventName,
    disconnectEventName,
    loadEventName,
    mediamatchEventName,
    mediaunmatchEventName
} from './Events.js';

// Register built-in handlers
import { MountObserver } from './MountObserver.js';
import { EvtRt } from './EvtRt.js';
import './handlers/DefineCustomElement.js';
import './handlers/EnhanceMountedElement.js';

MountObserver.define('builtIns.logToConsole', EvtRt);
