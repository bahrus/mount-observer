import { EvtRt } from '../EvtRt.js';
import { upShadowSearch } from '../upShadowSearch.js';
/**
 * Cache for element lookups by ID.
 * Maps root nodes to a map of ID -> WeakRef<Element> for performance.
 */
const idCache = new WeakMap();
/**
 * Tracks IDs currently being processed to detect circular references.
 */
const processingStack = new Set();
/**
 * Splits a space-separated string of attribute names into an array.
 */
function splitRefs(refs) {
    return refs
        .split(' ')
        .map(s => s.trim())
        .filter(s => !!s);
}
/**
 * Creates a CSS selector from an element's attributes, classes, and tag name.
 * Excludes the -i attribute and any attributes listed in -i from the selector.
 */
function toQuery(el) {
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
    const { localName } = el;
    return `${localName}${classes}${parts}${attributes}`;
}
/**
 * Prepares an element for insertion by extracting its children and insertion attributes.
 * Returns a DocumentFragment with the children and a map of attributes to insert.
 */
function prepareForInsertion(el) {
    const fragment = new DocumentFragment();
    const clone = el.cloneNode(true);
    // Move all children to the fragment
    while (clone.firstChild) {
        fragment.appendChild(clone.firstChild);
    }
    // Check for -i attribute which specifies which attributes to insert
    const insertAttrs = el.getAttribute('-i');
    let attributeMap = null;
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
function applyInsertion(targetElement, sourceFragment, attributeMap) {
    // Clone the fragment so it can be reused
    const fragmentClone = sourceFragment.cloneNode(true);
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
    mount(mountedElement, mountConfig, context) {
        try {
            const template = mountedElement;
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
                const rootNode = template.getRootNode();
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
                // Insert clone and remove template
                template.parentNode?.insertBefore(clone, template);
                template.remove();
            }
            finally {
                // Always remove from processing stack
                processingStack.delete(id);
            }
        }
        catch (error) {
            console.error('HTMLInclude: Unexpected error:', error);
        }
    }
    /**
     * Gets a cached element reference if available and still valid.
     */
    getCachedElement(rootNode, id) {
        const rootCache = idCache.get(rootNode);
        if (!rootCache)
            return null;
        const weakRef = rootCache.get(id);
        if (!weakRef)
            return null;
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
    cacheElement(rootNode, id, element) {
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
    processMatchingInsertions(clonedContent, templateChildren) {
        // For each child in the template, find matching elements in the cloned content
        for (const templateChild of templateChildren) {
            // Generate a selector from the template child
            const selector = toQuery(templateChild);
            // Prepare the insertion content and attribute map
            const { fragment, attributeMap } = prepareForInsertion(templateChild);
            // Find all matching elements in the cloned content
            let matchingElements = [];
            if (clonedContent instanceof Element) {
                // Check if the cloned element itself matches
                if (clonedContent.matches(selector)) {
                    matchingElements.push(clonedContent);
                }
                // Find matching descendants
                const descendants = Array.from(clonedContent.querySelectorAll(selector));
                matchingElements = [...matchingElements, ...descendants];
            }
            else if (clonedContent instanceof DocumentFragment) {
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
     */
    cloneContent(sourceElement) {
        // Check for remoteContent property (hoisted templates)
        if ('remoteContent' in sourceElement) {
            try {
                const remoteContent = sourceElement.remoteContent;
                return remoteContent.cloneNode(true);
            }
            catch (e) {
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
