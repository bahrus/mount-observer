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
 * Splits a space-separated string of attribute names into an array.
 */
function splitRefs(refs: string): string[] {
    return refs
        .split(' ')
        .map(s => s.trim())
        .filter(s => !!s);
}

/**
 * Creates a CSS selector from an element's attributes, classes, and tag name.
 * Excludes the -i attribute and any attributes listed in -i from the selector.
 */
function toQuery(el: Element): string {
    // Get the list of attributes to exclude from the selector
    const insertAttrs = el.getAttribute('-i');
    const excludeAttrs = new Set(['-i']); // Always exclude -i itself
    
    if (insertAttrs !== null) {
        const attrs = splitRefs(insertAttrs);
        attrs.forEach(attr => excludeAttrs.add(attr));
    }
    
    const classes = Array.from(el.classList).map(c => `.${c}`).join('');
    const parts = Array.from(el.part).map(p => `[part~="${p}"]`).join('');
    const attributes = Array.from(el.attributes)
        .filter(attr => !excludeAttrs.has(attr.name))
        .map(attr => `[${attr.name}="${attr.value}"]`)
        .join('');
    const {localName} = el;
    return `${localName}${classes}${parts}${attributes}`;
}

/**
 * Prepares an element for insertion by extracting its children and insertion attributes.
 * Returns a DocumentFragment with the children and a map of attributes to insert.
 */
function prepareForInsertion(el: Element): { fragment: DocumentFragment, attributeMap: {[key: string]: string} | null } {
    const fragment = new DocumentFragment();
    const clone = el.cloneNode(true) as Element;
    
    // Move all children to the fragment
    while (clone.firstChild) {
        fragment.appendChild(clone.firstChild);
    }
    
    // Check for -i attribute which specifies which attributes to insert
    const insertAttrs = el.getAttribute('-i');
    let attributeMap: {[key: string]: string} | null = null;
    
    if (insertAttrs !== null) {
        const attrs = splitRefs(insertAttrs);
        attributeMap = {};
        for (const attr of attrs) {
            const value = el.getAttribute(attr);
            if (value !== null) {
                attributeMap[attr] = value;
            }
        }
    }
    
    return { fragment, attributeMap };
}

/**
 * Applies insertion to a matched element by replacing its children and updating attributes.
 */
function applyInsertion(
    targetElement: Element,
    sourceFragment: DocumentFragment,
    attributeMap: {[key: string]: string} | null
): void {
    // Clone the fragment so it can be reused
    const fragmentClone = sourceFragment.cloneNode(true) as DocumentFragment;
    
    // Replace all children of the target element
    targetElement.replaceChildren(fragmentClone);
    
    // Update attributes if specified
    if (attributeMap !== null) {
        for (const key in attributeMap) {
            const value = attributeMap[key];
            targetElement.setAttribute(key, value);
        }
    }
}

/**
 * Handler that enables HTML fragment reuse via template[src="#id"] syntax.
 * 
 * This handler allows declarative reuse of HTML fragments by cloning content from
 * any element with an ID. It's similar to JavaScript constants for HTML.
 * 
 * Features:
 * - Clones content from templates (including hoisted templates with remoteContent)
 * - Clones any element with an ID
 * - Supports matching insertions: template children can match and modify cloned content
 * - Caches lookups for performance (useful for repeated references like periodic tables)
 * - Detects circular references
 * - Searches across shadow DOM boundaries
 * 
 * Matching Insertions:
 * When a template has children, they are used to match elements in the cloned content
 * and replace their children/attributes. This enables partial updates and "nulling out" content.
 * 
 * The -i attribute specifies which attributes to insert/update on matched elements.
 * 
 * @example Basic usage
 * ```html
 * <div id="reusable">
 *   <p>This content can be reused</p>
 * </div>
 * 
 * <template src="#reusable"></template>
 * <!-- Results in: <div><p>This content can be reused</p></div> -->
 * ```
 * 
 * @example Matching insertions
 * ```html
 * <div itemscope id="love">
 *   <data value="false" itemprop="todayIsFriday">It's Thursday</data>
 * </div>
 * 
 * <template src="#love">
 *   <data value="true" itemprop="todayIsFriday" -i="value"></data>
 * </template>
 * <!-- Results in:
 * <div itemscope>
 *   <data value="true" itemprop="todayIsFriday">It's Thursday</data>
 * </div>
 * The matched element's value attribute is updated, but children are replaced
 * -->
 * ```
 */
export class HTMLIncludeHandler extends EvtRt {
    static matching = 'template[src^="#"]';
    static whereInstanceOf = HTMLTemplateElement;
    
    async mount(mountedElement: Element): Promise<void> {
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
                    const { clone, isLiveElement } = this.cloneContent(sourceElement);

                    if (!clone) {
                        const error = `Unable to clone content from #${id}`;
                        template.setAttribute('data-include-error', error);
                        console.warn(`HTMLInclude: ${error}`);
                        return;
                    }
                    
                    // Optimization 4: Copy MOSE exports if cloning live element from different root
                    if (isLiveElement) {
                        await this.copyMoseExports(sourceElement, clone, rootNode);
                    }

                    // Check if the template has children - if so, process matching insertions
                    const templateChildren = Array.from(template.content.children);

                    if (templateChildren.length > 0) {
                        // Process matching insertions for each child in the template
                        this.processMatchingInsertions(clone, templateChildren);
                    }

                    // Remove ID from cloned element to avoid duplicate IDs in the DOM
                    if (clone instanceof Element && clone.hasAttribute('id')) {
                        clone.removeAttribute('id');
                    }

                    // Check for shadowRootModeOnLoad attribute
                    const shadowRootMode = template.getAttribute('shadowrootmodeonload');

                    if (shadowRootMode) {
                        // Shadow DOM mode - attach to parent's shadow root
                        const parent = template.parentElement;

                        if (!parent) {
                            console.warn('HTMLInclude: Cannot attach shadow root - template has no parent element');
                            return;
                        }

                        // Validate shadow root mode
                        if (shadowRootMode !== 'open' && shadowRootMode !== 'closed') {
                            console.warn(`HTMLInclude: Invalid shadowRootModeOnLoad value "${shadowRootMode}", must be "open" or "closed"`);
                            return;
                        }

                        // Get or create shadow root
                        let shadowRoot = parent.shadowRoot;
                        if (!shadowRoot) {
                            try {
                                shadowRoot = parent.attachShadow({ mode: shadowRootMode as ShadowRootMode });
                            } catch (error) {
                                console.error('HTMLInclude: Failed to attach shadow root:', error);
                                return;
                            }
                        }

                        // Append clone to shadow root
                        shadowRoot.appendChild(clone);
                        template.remove();
                    } else {
                        // Normal mode - insert before template
                        template.parentNode?.insertBefore(clone, template);
                        template.remove();
                    }
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
     * Processes matching insertions by finding elements in the cloned content that match
     * the selectors from template children and applying insertions to them.
     */
    processMatchingInsertions(clonedContent: Node, templateChildren: Element[]): void {
        // For each child in the template, find matching elements in the cloned content
        for (const templateChild of templateChildren) {
            // Generate a selector from the template child
            const selector = toQuery(templateChild);
            
            // Prepare the insertion content and attribute map
            const { fragment, attributeMap } = prepareForInsertion(templateChild);
            
            // Find all matching elements in the cloned content
            let matchingElements: Element[] = [];
            
            if (clonedContent instanceof Element) {
                // Check if the cloned element itself matches
                if (clonedContent.matches(selector)) {
                    matchingElements.push(clonedContent);
                }
                // Find matching descendants
                const descendants = Array.from(clonedContent.querySelectorAll(selector));
                matchingElements = [...matchingElements, ...descendants];
            } else if (clonedContent instanceof DocumentFragment) {
                // Search within the fragment
                matchingElements = Array.from(clonedContent.querySelectorAll(selector));
            }
            
            // Apply insertion to each matching element
            for (const matchingElement of matchingElements) {
                applyInsertion(matchingElement, fragment, attributeMap);
            }
        }
    }
    
    /**
     * Clones content from the source element.
     * Priority: remoteContent (hoisted templates) > content (templates) > element itself
     * Returns an object with the cloned node and whether it was cloned from a live element
     */
    cloneContent(sourceElement: Element): { clone: Node | null, isLiveElement: boolean } {
        // Check for remoteContent property (hoisted templates)
        if ('remoteContent' in sourceElement) {
            try {
                const remoteContent = (sourceElement as any).remoteContent as DocumentFragment;
                return { clone: remoteContent.cloneNode(true), isLiveElement: false };
            } catch (e) {
                console.warn('HTMLInclude: Failed to access remoteContent', e);
            }
        }
        
        // Check for content property (regular templates)
        if (sourceElement instanceof HTMLTemplateElement && sourceElement.content) {
            return { clone: sourceElement.content.cloneNode(true), isLiveElement: false };
        }
        
        // Clone the element itself (live DOM element)
        return { clone: sourceElement.cloneNode(true), isLiveElement: true };
    }
    
    /**
     * Copies MOSE script exports from source to cloned scripts.
     * This optimization avoids re-parsing JSON when cloning MOSE scripts across shadow boundaries.
     */
    async copyMoseExports(sourceElement: Element, clone: Node, templateRootNode: Node): Promise<void> {
        const sourceRootNode = sourceElement.getRootNode();
        
        // Only process if source and template are in different root nodes
        if (sourceRootNode === templateRootNode) {
            return;
        }
        
        // Find all MOSE scripts in the source element
        const sourceScripts = sourceElement.querySelectorAll('script[type="mountobserver"]');
        
        if (sourceScripts.length === 0) {
            return;
        }
        
        // Find all MOSE scripts in the clone
        let cloneScripts: NodeListOf<Element>;
        if (clone instanceof Element) {
            cloneScripts = clone.querySelectorAll('script[type="mountobserver"]');
        } else if (clone instanceof DocumentFragment) {
            cloneScripts = clone.querySelectorAll('script[type="mountobserver"]');
        } else {
            return;
        }
        
        // Copy exports from source scripts to cloned scripts (matching by ID)
        for (let i = 0; i < sourceScripts.length; i++) {
            const sourceScript = sourceScripts[i] as HTMLScriptElement;
            const sourceId = sourceScript.getAttribute('id');
            
            if (!sourceId) continue;
            
            // Find matching clone script by ID
            const cloneScript = Array.from(cloneScripts).find(
                s => s.getAttribute('id') === sourceId
            ) as HTMLScriptElement | undefined;
            
            if (!cloneScript) continue;
            
            // Check if source script has export
            let sourceExport = (sourceScript as any).export;
            
            if (!sourceExport) {
                // Wait for the source script to resolve
                try {
                    // Create a promise that waits for the resolved event
                    const event = await new Promise<Event>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Timeout'));
                        }, 5000);
                        
                        sourceScript.addEventListener('resolved', (e) => {
                            clearTimeout(timeout);
                            resolve(e);
                        }, { once: true });
                    });
                    sourceExport = (event as any).export;
                } catch (error) {
                    console.warn(`HTMLInclude: Timeout waiting for MOSE script #${sourceId} to resolve`);
                    continue;
                }
            }
            
            // Copy export to cloned script
            if (sourceExport) {
                (cloneScript as any).export = sourceExport;
            }
        }
    }
}

// Register the handler
import { MountObserver } from '../MountObserver.js';

MountObserver.define('builtIns.HTMLInclude', HTMLIncludeHandler);
