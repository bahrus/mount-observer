import { EvtRt } from '../EvtRt.js';
/**
 * Handler for loading ES modules from script elements with src attribute.
 * Automatically imports the module and stores it on element.export.
 *
 * Supports import assertions via the type attribute:
 * - type="json" or type="application/json" for JSON imports
 * - type="application/ld+json" for JSON-LD imports
 * - Any type containing "json" will use JSON import assertion
 *
 * For backward compatibility, also supports:
 * - script[nomodule][src] elements
 * - with-type attribute (deprecated, use type instead)
 */
export class ScriptNoModuleHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    // Match script elements with src that are either:
    // 1. nomodule (backward compat)
    // 2. Have a type attribute containing "json"
    static matching = 'script[src]';
    static whereInstanceOf = HTMLScriptElement;
    async mount(mountedElement, MountConfig, context) {
        this.abort(); // Clean up event listeners (one-time operation)
        const scriptElement = mountedElement;
        // Skip if this is a module script (type="module")
        const typeAttr = scriptElement.getAttribute('type');
        if (typeAttr === 'module') {
            return;
        }
        // Only process if:
        // 1. Has nomodule attribute (backward compat), OR
        // 2. Has type attribute containing "json"
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
        // This ensures the import path is correct regardless of where the handler code is located
        const resolvedUrl = new URL(srcAttr, document.baseURI).href;
        // Determine import assertion type
        // Priority: type attribute > with-type attribute (deprecated)
        let importType = null;
        if (isJsonType) {
            importType = 'json';
        }
        else {
            // Check deprecated with-type attribute for backward compatibility
            const withTypeAttr = scriptElement.getAttribute('with-type');
            if (withTypeAttr) {
                importType = withTypeAttr;
            }
        }
        // Perform import
        let module;
        try {
            if (importType) {
                module = await import(resolvedUrl, { with: { type: importType } });
            }
            else {
                module = await import(resolvedUrl);
            }
        }
        catch (error) {
            throw new Error(`Failed to import module from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
        }
        // Store result on element
        scriptElement.export = module;
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.scriptNoModule', ScriptNoModuleHandler);
