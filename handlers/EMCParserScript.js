import { EvtRt } from '../EvtRt.js';
import { getParserRegistry } from 'assign-gingerly/parserRegistry.js';
/**
 * Handler for EMC Parser Script Elements.
 * Processes script[type="emc-parser"] elements to load and register parser modules
 * in the containing synthesizer element's scoped parser registry.
 *
 * Usage:
 * <script type="emc-parser" src="./my-parser.js" parser-name="myParser"></script>
 *
 * The parser module should export a parser function as the default export:
 * export default function myParser(v: string | null): any { ... }
 */
export class EMCParserScriptHandler extends EvtRt {
    // Static properties define default MountConfig constraints
    static matching = 'script[type="emc-parser"]';
    static whereInstanceOf = HTMLScriptElement;
    async mount(mountedElement, mountConfig, context) {
        this.abort(); // Clean up event listeners (one-time operation)
        const scriptElement = mountedElement;
        // Read required attributes
        const src = scriptElement.getAttribute('src');
        const parserName = scriptElement.getAttribute('parser-name');
        // Validate required attributes
        if (!src) {
            const errorMsg = 'EMCParserScript: missing src attribute';
            console.error(errorMsg, scriptElement);
            scriptElement.setAttribute('data-parser-error', 'missing src attribute');
            return;
        }
        if (!parserName) {
            const errorMsg = 'EMCParserScript: missing parser-name attribute';
            console.error(errorMsg, scriptElement);
            scriptElement.setAttribute('data-parser-error', 'missing parser-name attribute');
            return;
        }
        // Find containing synthesizer element
        const synthesizerElement = this.findContainingSynthesizer(scriptElement);
        if (!synthesizerElement) {
            const errorMsg = 'EMCParserScript: no containing synthesizer element found';
            console.error(errorMsg, scriptElement);
            scriptElement.setAttribute('data-parser-error', 'no containing synthesizer element');
            return;
        }
        try {
            // Dynamic import the parser module
            const module = await import(src);
            // Get parser function from default export
            const parser = module.default;
            // Validate parser is a function
            if (typeof parser !== 'function') {
                throw new Error(`Parser module "${src}" must export a function as default export. ` +
                    `Received: ${typeof parser}`);
            }
            // Get scoped registry and register parser
            const registry = getParserRegistry(synthesizerElement);
            registry.register(parserName, parser);
            // Dispatch parser-registered event
            scriptElement.dispatchEvent(new CustomEvent('parser-registered', {
                detail: { parserName },
                bubbles: true
            }));
            console.log(`Registered parser "${parserName}" from ${src}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Failed to load parser "${parserName}" from "${src}":`, errorMessage);
            scriptElement.setAttribute('data-parser-error', errorMessage);
        }
    }
    /**
     * Find the nearest ancestor synthesizer element.
     * Traverses up through shadow root boundaries.
     * Looks for elements with data-synthesizer attribute, be-hive tag, or __isSynthesizer property.
     */
    findContainingSynthesizer(element) {
        let current = element;
        while (current) {
            if (current instanceof Element) {
                // Check for synthesizer marker or known synthesizer tag names
                if (current.hasAttribute('data-synthesizer') ||
                    current.localName === 'be-hive' ||
                    current.__isSynthesizer === true) {
                    return current;
                }
            }
            // Try parent element
            if (current.parentElement) {
                current = current.parentElement;
            }
            // Try shadow root host
            else if (current instanceof ShadowRoot) {
                current = current.host;
            }
            // Try parent node (for document fragments)
            else if (current.parentNode) {
                current = current.parentNode;
            }
            else {
                break;
            }
        }
        return undefined;
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
export const emcParser = 'builtIns.emcParserScript';
MountObserver.define(emcParser, EMCParserScriptHandler);
