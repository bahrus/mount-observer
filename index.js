// Main entry point for MountObserver v2
export { MountObserver } from './MountObserver.js';
export { Synthesizer } from './Synthesizer.js';
export { withScopePerimeter } from './withScopePerimeter.js';
export { emitMountedElementEvents } from './emitEvents.js';
export { arr } from './arr.js';
export { EvtRt } from './EvtRt.js';
export { DefineCustomElementHandler, DefineScopedCustomElementHandler } from './handlers/DefineCustomElement.js';
export { EnhanceMountedElementHandler } from './handlers/EnhanceMountedElement.js';
export { ScriptExportHandler } from './handlers/ScriptExport.js';
export { MountObserverScriptHandler } from './handlers/MountObserverScript.js';
export { EMCScriptHandler } from './handlers/EMCScript.js';
export { HoistTemplateHandler } from './handlers/HoistTemplate.js';
export { HTMLIncludeHandler } from './handlers/HTMLInclude.js';
export { CedeScriptHandler } from './handlers/CedeScript.js';
export { upShadowSearch } from './upShadowSearch.js';
export { mountEventName, dismountEventName, disconnectEventName, loadEventName, mediamatchEventName, mediaunmatchEventName, addedScriptElementEventName } from './Events.js';
// Register built-in handlers
import './EvtRt.js';
import './handlers/DefineCustomElement.js';
import './handlers/EnhanceMountedElement.js';
import './handlers/GenIds.js';
import './handlers/ScriptExport.js';
import './handlers/MountObserverScript.js';
import './handlers/EMCScript.js';
import './handlers/HoistTemplate.js';
import './handlers/HTMLInclude.js';
import './handlers/CedeScript.js';
