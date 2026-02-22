// Main entry point for MountObserver v2
export { MountObserver } from './MountObserver.js';
export { withScopePerimeter } from './withScopePerimeter.js';
export { emitMountedElementEvents } from './emitEvents.js';
export { arr } from './arr.js';
export { EvtRt } from './EvtRt.js';
export { DefineCustomElementHandler } from './DefineCustomElementHandler.js';
export { EnhanceMountedElementHandler } from './EnhanceMountedElementHandler.js';
export { mountEventName, dismountEventName, disconnectEventName, loadEventName, mediamatchEventName, mediaunmatchEventName } from './Events.js';
// Register built-in handlers
import { MountObserver } from './MountObserver.js';
import { EvtRt } from './EvtRt.js';
import { DefineCustomElementHandler, DefineScopedCustomElementHandler } from './DefineCustomElementHandler.js';
import { EnhanceMountedElementHandler } from './EnhanceMountedElementHandler.js';
MountObserver.define('builtIns.logToConsole', EvtRt);
MountObserver.define('builtIns.defineCustomElement', DefineCustomElementHandler);
MountObserver.define('buildIns.defineScopedCustomElement', DefineScopedCustomElementHandler);
MountObserver.define('builtIns.enhanceMountedElement', EnhanceMountedElementHandler);
