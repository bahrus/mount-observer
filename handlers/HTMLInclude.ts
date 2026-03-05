import { EvtRt } from '../EvtRt.js';
import type { MountContext, MountConfig } from '../types/mount-observer/types';
import { upShadowSearch } from '../upShadowSearch.js';

/**
 * Cache for element lookups by ID.
 * Maps root nodes to a map of ID -> WeakRef<Element> for performance.
 */
const idCache = new WeakMap<Node, Map<string, WeakRef<Element>>>();

/**
 * Tracks IDs currently being processed to detect circular references.
 */
const processingStack = new Set<string>();

/**
 * Handler that enables HTML fragment reuse via template[src="#id"] syntax.
 * 
 * This handler allows declarative reuse of HTML fragments by cloning content from
 * any element with an ID. It's similar to JavaScript constants for HTML.
 * 
 * Features:
 * - Clones content from templates (including hoisted templates with remoteContent)
 * - Clones any element with an ID
 * - Caches lookups for performance (useful for repeated references like periodic tables)
 * - Detects circular references
 * - Searches across shadow DOM boundaries
 * 
 * @example
 * ```html
 * <div id="reusable">
 *   <p>This content can be reused</p>
 * </div>
 * 
 * <template src="#reusable"></template>
 * <!-- Results in: <div id="reusable"><p>This content can be reused</p></div> -->
 * ```
 */
export class HTMLIncludeHandler extends EvtRt {
    static matching = 'template[src^="#"]';
    static whereInstanceOf = HTMLTemplateElement;
    
    mount(mountedElement: Element, mountConfig: MountConfig, context: MountContext): void {
        try {
            const template = mountedElement as HTMLTemplateElement;
            const src = template.getAttribute('src');
            
            if (!src || !src.startsWith('#')) {
                console.warn('HTMLInclude: Invalid src attribute, must start with #');
                return;
            }
            
            const id = src.substring(1);
            
            // Check for circular references
            if (processingStack.has(id)) {
                const error = `Circular reference detected: #${id}`;
                template.setAttribute('data-include-error', error);
                console.error(`HTMLInclude: ${error}`);
                return;
            }
            
            // Mark as processing
            processingStack.add(id);
            
            try {
                // Try cache first
                const rootNode = template.getRootNode() as Node;
                let sourceElement = this.getCachedElement(rootNode, id);
                
                if (!sourceElement) {
                    // Search up through shadow roots
                    sourceElement = upShadowSearch(template, id);
                    
                    if (!sourceElement) {
                        const error = `Element with id="${id}" not found`;
                        template.setAttribute('data-include-error', error);
                        console.warn(`HTMLInclude: ${error}`);
                        return;
                    }
                    
                    // Cache the result
                    this.cacheElement(rootNode, id, sourceElement);
                }
                
                // Clone the content
                const clone = this.cloneContent(sourceElement);
                
                if (!clone) {
                    const error = `Unable to clone content from #${id}`;
                    template.setAttribute('data-include-error', error);
                    console.warn(`HTMLInclude: ${error}`);
                    return;
                }
                
                // Remove ID from cloned element to avoid duplicate IDs in the DOM
                if (clone instanceof Element && clone.hasAttribute('id')) {
                    clone.removeAttribute('id');
                }
                
                // Insert clone and remove template
                template.parentNode?.insertBefore(clone, template);
                template.remove();
            }
            finally {
                // Always remove from processing stack
                processingStack.delete(id);
            }
        } catch (error) {
            console.error('HTMLInclude: Unexpected error:', error);
        }
    }
    
    /**
     * Gets a cached element reference if available and still valid.
     */
    getCachedElement(rootNode: Node, id: string): Element | null {
        const rootCache = idCache.get(rootNode);
        if (!rootCache) return null;
        
        const weakRef = rootCache.get(id);
        if (!weakRef) return null;
        
        const element = weakRef.deref();
        if (!element) {
            // Element was garbage collected, remove from cache
            rootCache.delete(id);
            return null;
        }
        
        return element;
    }
    
    /**
     * Caches an element reference for future lookups.
     */
    cacheElement(rootNode: Node, id: string, element: Element): void {
        let rootCache = idCache.get(rootNode);
        if (!rootCache) {
            rootCache = new Map();
            idCache.set(rootNode, rootCache);
        }
        rootCache.set(id, new WeakRef(element));
    }
    
    /**
     * Clones content from the source element.
     * Priority: remoteContent (hoisted templates) > content (templates) > element itself
     */
    cloneContent(sourceElement: Element): Node | null {
        // Check for remoteContent property (hoisted templates)
        if ('remoteContent' in sourceElement) {
            try {
                const remoteContent = (sourceElement as any).remoteContent as DocumentFragment;
                return remoteContent.cloneNode(true);
            } catch (e) {
                console.warn('HTMLInclude: Failed to access remoteContent', e);
            }
        }
        
        // Check for content property (regular templates)
        if (sourceElement instanceof HTMLTemplateElement && sourceElement.content) {
            return sourceElement.content.cloneNode(true);
        }
        
        // Clone the element itself
        return sourceElement.cloneNode(true);
    }
}

// Register the handler
import { MountObserver } from '../MountObserver.js';

MountObserver.define('builtIns.HTMLInclude', HTMLIncludeHandler);
