import { EvtRt } from '../EvtRt.js';
/**
 * Handler for automatically generating IDs when elements with -id attribute are mounted.
 * This handler integrates with the id-generation package to provide automatic ID generation
 * for elements within scoped containers (fieldset, [itemscope], or root).
 *
 * Usage:
 * ```javascript
 * document.mount({
 *     do: 'builtIns.generateIds'
 * });
 * ```
 *
 * The handler will automatically:
 * 1. Watch for elements with the -id attribute
 * 2. Call genIds from id-generation package
 * 3. Generate IDs for elements with data-id, #, @, or | attributes
 * 4. Replace #{{name}} references with generated IDs
 * 5. Remove -id and defer-* attributes after processing
 */
export class GenerateIdsHandler extends EvtRt {
    // Static properties to define matching criteria
    static matching = '[-id]';
    static whereInstanceOf = Element;
    async mount(mountedElement, mountConfig, context) {
        this.abort();
        // Dynamically import processScope from id-generation
        const { genIds } = await import('id-generation/genIds.js');
        // Get the root node for fallback container
        const rootNode = context.rootNode || document;
        // Process the scope starting from this trigger element
        genIds(mountedElement, rootNode);
    }
}
// Register built-in handler
import { MountObserver } from '../MountObserver.js';
export const genIds = 'builtIns.generateIds';
MountObserver.define(genIds, GenerateIdsHandler);
