// Main entry point for MountObserver v2
export { MountObserver } from './MountObserver.js';
export { whereOutside } from './whereOutside.js';
export { emitMountedElementEvents } from './emitEvents.js';
export { checkAttrChanges } from './attrChanges.js';
export { arr } from './arr.js';
export { EvtRt } from './EvtRt.js';
export { DefineCustomElementHandler } from './DefineCustomElementHandler.js';
export { mountEventName, dismountEventName, disconnectEventName, loadEventName, attrchangeEventName, mediamatchEventName, mediaunmatchEventName } from './Events.js';
// Register built-in handlers
import { MountObserver } from './MountObserver.js';
import { EvtRt } from './EvtRt.js';
import { DefineCustomElementHandler } from './DefineCustomElementHandler.js';
MountObserver.define('builtIns.logToConsole', EvtRt);
MountObserver.define('builtIns.defineCustomElement', DefineCustomElementHandler);
