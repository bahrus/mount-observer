import { EvtRt } from '../EvtRt.js';
import { MountConfig, MountContext } from '../types/mount-observer/types.js';

/**
 * Handler for loading ES modules from script[nomodule] elements.
 * Automatically imports the module specified in the src attribute and stores it on element.export.
 * Supports import assertions via the with-type attribute.
 */
export class ScriptNoModuleHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    static matching = 'script[nomodule][src]';
    static whereInstanceOf = HTMLScriptElement;
    
    async mount(mountedElement: Element, MountConfig: MountConfig, context: MountContext): Promise<void> {
        this.abort(); // Clean up event listeners (one-time operation)
        
        const scriptElement = mountedElement as HTMLScriptElement;
        
        // Read src attribute
        const srcAttr = scriptElement.getAttribute('src');
        if (!srcAttr) {
            throw new Error('Script element must have a src attribute');
        }
        
        // Resolve the src relative to the document's base URL
        // This ensures the import path is correct regardless of where the handler code is located
        const resolvedUrl = new URL(srcAttr, document.baseURI).href;
        
        // Check for with-type attribute
        const withTypeAttr = scriptElement.getAttribute('with-type');
        
        // Perform import
        let module;
        try {
            if (withTypeAttr) {
                module = await import(resolvedUrl, { with: { type: withTypeAttr } } as any);
            } else {
                module = await import(resolvedUrl);
            }
        } catch (error) {
            throw new Error(`Failed to import module from '${srcAttr}': ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Store result on element
        (scriptElement as any).export = module;
    }
}

// Register built-in handler
import { MountObserver } from '../MountObserver.js';

MountObserver.define('builtIns.scriptNoModule', ScriptNoModuleHandler);
