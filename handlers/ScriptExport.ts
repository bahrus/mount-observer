import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types/mount-observer/types.js';

/**
 * Handler for exposing module exports from script elements via element.export.
 * 
 * Solves two key problems:
 * 
 * 1. ES Module Export Access:
 *    - Use nomodule attribute to prevent browser from loading the module separately
 *    - Handler imports it and exposes exports via element.export
 *    - Avoids double-loading the module in memory
 *    - Example: <script nomodule src="./config.js" id="cfg"></script>
 *    - Access: document.getElementById('cfg').export.myValue
 * 
 * 2. JSON/Data Import:
 *    - Use type attribute for JSON and other data formats
 *    - Browser ignores non-standard script types, so no double-loading issue
 *    - Handler imports with appropriate assertion and exposes via element.export
 *    - Example: <script src="./data.json" type="json" id="data"></script>
 *    - Access: document.getElementById('data').export.default
 * 
 * Supported type values:
 * - type="json" - JSON data
 * - type="application/json" - JSON with full MIME type
 * - type="application/ld+json" - JSON-LD linked data
 * - Any type containing "json" triggers JSON import assertion
 */
export class ScriptExportHandler extends EvtRt {
    // Match script elements with src attribute
    static matching = 'script[src]';
    static whereInstanceOf = HTMLScriptElement;
    
    async mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext): Promise<void> {
        this.abort(); // Clean up event listeners (one-time operation)
        
        const scriptElement = mountedElement as HTMLScriptElement;
        
        // Optimization 3: Skip if already processed (export property exists)
        if ((scriptElement as any).export !== undefined) {
            console.log('ScriptExport: Skipping already processed script element');
            return;
        }
        
        // Skip if this is a module script (browser handles these)
        const typeAttr = scriptElement.getAttribute('type');
        if (typeAttr === 'module') {
            return;
        }
        
        // Only process if:
        // 1. Has nomodule attribute (for ES modules), OR
        // 2. Has type attribute containing "json" (for JSON data)
        const hasNoModule = scriptElement.hasAttribute('nomodule');
        const isJsonType = typeAttr && typeAttr.toLowerCase().includes('json');
        
        if (!hasNoModule && !isJsonType) {
            return;
        }
        
        // Read src attribute
        const srcAttr = scriptElement.getAttribute('src');
        if (!srcAttr) {
            throw new Error('Script element must have a src attribute');
        }
        
        // Resolve the src relative to the document's base URL
        const resolvedUrl = new URL(srcAttr, document.baseURI).href;
        
        // Determine import assertion type
        const importType = isJsonType ? 'json' : null;
        
        // Perform import
        let module;
        try {
            if (importType) {
                module = await import(resolvedUrl, { with: { type: importType } } as any);
            } else {
                module = await import(resolvedUrl);
            }
        } catch (error) {
            throw new Error(`Failed to import module from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Store result on element
        (scriptElement as any).export = module;
        
        // Dispatch resolved event
        const { ResolvedEvent } = await import('../Events.js');
        scriptElement.dispatchEvent(new ResolvedEvent(module));
    }
}

// Register built-in handler
import { MountObserver } from '../MountObserver.js';

export const scriptExport = 'builtIns.scriptExport';

MountObserver.define(scriptExport, ScriptExportHandler);
