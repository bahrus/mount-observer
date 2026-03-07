import { EvtRt } from '../EvtRt.js';
export class DefineCustomElementHandler extends EvtRt {
    mount(mountedElement, MountConfig, context) {
        this.abort();
        // Check if modules are specified
        if (!context.modules || context.modules.length === 0) {
            throw new Error('Must specify an ES Module');
        }
        const module = context.modules[0];
        const tagName = mountedElement.localName;
        // Check if already defined
        if (customElements.get(tagName)) {
            return;
        }
        // Find suitable class
        const ElementClass = this.findSuitableClass(module);
        // Validate that ElementClass is a constructor
        if (typeof ElementClass !== 'function') {
            throw new Error(`Found class is not a constructor: ${typeof ElementClass}`);
        }
        // Create wrapper class to allow reuse
        // Use anonymous class expression which works across all browsers
        const WrapperClass = class extends ElementClass {
        };
        // Define the custom element using the define method
        this.define(tagName, WrapperClass, mountedElement);
    }
    /**
     * Define the custom element in the appropriate registry.
     * Override this method in subclasses to use scoped registries.
     * @param tagName - The custom element tag name
     * @param ElementClass - The element class constructor
     * @param mountedElement - The mounted element (used for scoped registry access)
     */
    define(tagName, ElementClass, mountedElement) {
        customElements.define(tagName, ElementClass);
    }
    findSuitableClass(module) {
        // Check default export first
        const defaultExport = module.default;
        if (defaultExport && this.extendsHTMLElement(defaultExport)) {
            return defaultExport;
        }
        // Find all exports that extend HTMLElement
        const htmlElementClasses = Object.values(module)
            .filter(exp => typeof exp === 'function' && this.extendsHTMLElement(exp));
        if (htmlElementClasses.length === 0) {
            throw new Error('No suitable class found in module');
        }
        if (htmlElementClasses.length > 1) {
            throw new Error('More than one class found in module');
        }
        return htmlElementClasses[0];
    }
    extendsHTMLElement(cls) {
        try {
            // Must be a function
            if (typeof cls !== 'function') {
                return false;
            }
            // Handle direct HTMLElement export
            if (cls === HTMLElement) {
                return true;
            }
            // Check if it has a prototype and extends HTMLElement
            if (cls.prototype && cls.prototype instanceof HTMLElement) {
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
}
/**
 * Handler for defining custom elements in scoped registries.
 * Uses the element's customElementRegistry property to define elements
 * in the appropriate scoped registry instead of the global registry.
 */
export class DefineScopedCustomElementHandler extends DefineCustomElementHandler {
    /**
     * Define the custom element in the element's scoped registry.
     * @param tagName - The custom element tag name
     * @param ElementClass - The element class constructor
     * @param mountedElement - The mounted element with customElementRegistry
     */
    define(tagName, ElementClass, mountedElement) {
        const registry = mountedElement.customElementRegistry;
        if (!registry) {
            throw new Error('Element does not have a customElementRegistry. Scoped registries require Chrome 146+ or latest WebKit/Safari.');
        }
        // Check if already defined in this scoped registry
        if (registry.get(tagName)) {
            return;
        }
        registry.define(tagName, ElementClass);
    }
}
// Register built-in handlers
import { MountObserver } from '../MountObserver.js';
MountObserver.define('builtIns.defineCustomElement', DefineCustomElementHandler);
MountObserver.define('buildIns.defineScopedCustomElement', DefineScopedCustomElementHandler);
