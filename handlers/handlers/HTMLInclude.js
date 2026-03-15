"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLIncludeHandler = void 0;
var EvtRt_js_1 = require("../EvtRt.js");
var upShadowSearch_js_1 = require("../upShadowSearch.js");
/**
 * Cache for element lookups by ID.
 * Maps root nodes to a map of ID -> WeakRef<Element> for performance.
 */
var idCache = new WeakMap();
/**
 * Tracks IDs currently being processed to detect circular references.
 */
var processingStack = new Set();
/**
 * Splits a space-separated string of attribute names into an array.
 */
function splitRefs(refs) {
    return refs
        .split(' ')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return !!s; });
}
/**
 * Creates a CSS selector from an element's attributes, classes, and tag name.
 * Excludes the -i attribute and any attributes listed in -i from the selector.
 */
function toQuery(el) {
    // Get the list of attributes to exclude from the selector
    var insertAttrs = el.getAttribute('-i');
    var excludeAttrs = new Set(['-i']); // Always exclude -i itself
    if (insertAttrs !== null) {
        var attrs = splitRefs(insertAttrs);
        attrs.forEach(function (attr) { return excludeAttrs.add(attr); });
    }
    var classes = Array.from(el.classList).map(function (c) { return ".".concat(c); }).join('');
    var parts = Array.from(el.part).map(function (p) { return "[part~=\"".concat(p, "\"]"); }).join('');
    var attributes = Array.from(el.attributes)
        .filter(function (attr) { return !excludeAttrs.has(attr.name); })
        .map(function (attr) { return "[".concat(attr.name, "=\"").concat(attr.value, "\"]"); })
        .join('');
    var localName = el.localName;
    return "".concat(localName).concat(classes).concat(parts).concat(attributes);
}
/**
 * Prepares an element for insertion by extracting its children and insertion attributes.
 * Returns a DocumentFragment with the children and a map of attributes to insert.
 */
function prepareForInsertion(el) {
    var fragment = new DocumentFragment();
    var clone = el.cloneNode(true);
    // Move all children to the fragment
    while (clone.firstChild) {
        fragment.appendChild(clone.firstChild);
    }
    // Check for -i attribute which specifies which attributes to insert
    var insertAttrs = el.getAttribute('-i');
    var attributeMap = null;
    if (insertAttrs !== null) {
        var attrs = splitRefs(insertAttrs);
        attributeMap = {};
        for (var _i = 0, attrs_1 = attrs; _i < attrs_1.length; _i++) {
            var attr = attrs_1[_i];
            var value = el.getAttribute(attr);
            if (value !== null) {
                attributeMap[attr] = value;
            }
        }
    }
    return { fragment: fragment, attributeMap: attributeMap };
}
/**
 * Applies insertion to a matched element by replacing its children and updating attributes.
 */
function applyInsertion(targetElement, sourceFragment, attributeMap) {
    // Clone the fragment so it can be reused
    var fragmentClone = sourceFragment.cloneNode(true);
    // Replace all children of the target element
    targetElement.replaceChildren(fragmentClone);
    // Update attributes if specified
    if (attributeMap !== null) {
        for (var key in attributeMap) {
            var value = attributeMap[key];
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
var HTMLIncludeHandler = /** @class */ (function (_super) {
    __extends(HTMLIncludeHandler, _super);
    function HTMLIncludeHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HTMLIncludeHandler.prototype.mount = function (mountedElement, mountConfig, context) {
        return __awaiter(this, void 0, void 0, function () {
            var template, src, id, error, rootNode, sourceElement, error, _a, clone, isLiveElement, error, templateChildren, shadowRootMode, parent_1, shadowRoot, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 6, , 7]);
                        template = mountedElement;
                        src = template.getAttribute('src');
                        if (!src || !src.startsWith('#')) {
                            console.warn('HTMLInclude: Invalid src attribute, must start with #');
                            return [2 /*return*/];
                        }
                        id = src.substring(1);
                        // Check for circular references
                        if (processingStack.has(id)) {
                            error = "Circular reference detected: #".concat(id);
                            template.setAttribute('data-include-error', error);
                            console.error("HTMLInclude: ".concat(error));
                            return [2 /*return*/];
                        }
                        // Mark as processing
                        processingStack.add(id);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, , 4, 5]);
                        rootNode = template.getRootNode();
                        sourceElement = this.getCachedElement(rootNode, id);
                        if (!sourceElement) {
                            // Search up through shadow roots
                            sourceElement = (0, upShadowSearch_js_1.upShadowSearch)(template, id);
                            if (!sourceElement) {
                                error = "Element with id=\"".concat(id, "\" not found");
                                template.setAttribute('data-include-error', error);
                                console.warn("HTMLInclude: ".concat(error));
                                return [2 /*return*/];
                            }
                            // Cache the result
                            this.cacheElement(rootNode, id, sourceElement);
                        }
                        _a = this.cloneContent(sourceElement), clone = _a.clone, isLiveElement = _a.isLiveElement;
                        if (!clone) {
                            error = "Unable to clone content from #".concat(id);
                            template.setAttribute('data-include-error', error);
                            console.warn("HTMLInclude: ".concat(error));
                            return [2 /*return*/];
                        }
                        if (!isLiveElement) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.copyMoseExports(sourceElement, clone, rootNode)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        templateChildren = Array.from(template.content.children);
                        if (templateChildren.length > 0) {
                            // Process matching insertions for each child in the template
                            this.processMatchingInsertions(clone, templateChildren);
                        }
                        // Remove ID from cloned element to avoid duplicate IDs in the DOM
                        if (clone instanceof Element && clone.hasAttribute('id')) {
                            clone.removeAttribute('id');
                        }
                        shadowRootMode = template.getAttribute('shadowrootmodeonload');
                        if (shadowRootMode) {
                            parent_1 = template.parentElement;
                            if (!parent_1) {
                                console.warn('HTMLInclude: Cannot attach shadow root - template has no parent element');
                                return [2 /*return*/];
                            }
                            // Validate shadow root mode
                            if (shadowRootMode !== 'open' && shadowRootMode !== 'closed') {
                                console.warn("HTMLInclude: Invalid shadowRootModeOnLoad value \"".concat(shadowRootMode, "\", must be \"open\" or \"closed\""));
                                return [2 /*return*/];
                            }
                            shadowRoot = parent_1.shadowRoot;
                            if (!shadowRoot) {
                                try {
                                    shadowRoot = parent_1.attachShadow({ mode: shadowRootMode });
                                }
                                catch (error) {
                                    console.error('HTMLInclude: Failed to attach shadow root:', error);
                                    return [2 /*return*/];
                                }
                            }
                            // Append clone to shadow root
                            shadowRoot.appendChild(clone);
                            template.remove();
                        }
                        else {
                            // Normal mode - insert before template
                            (_b = template.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(clone, template);
                            template.remove();
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        // Always remove from processing stack
                        processingStack.delete(id);
                        return [7 /*endfinally*/];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _c.sent();
                        console.error('HTMLInclude: Unexpected error:', error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a cached element reference if available and still valid.
     */
    HTMLIncludeHandler.prototype.getCachedElement = function (rootNode, id) {
        var rootCache = idCache.get(rootNode);
        if (!rootCache)
            return null;
        var weakRef = rootCache.get(id);
        if (!weakRef)
            return null;
        var element = weakRef.deref();
        if (!element) {
            // Element was garbage collected, remove from cache
            rootCache.delete(id);
            return null;
        }
        return element;
    };
    /**
     * Caches an element reference for future lookups.
     */
    HTMLIncludeHandler.prototype.cacheElement = function (rootNode, id, element) {
        var rootCache = idCache.get(rootNode);
        if (!rootCache) {
            rootCache = new Map();
            idCache.set(rootNode, rootCache);
        }
        rootCache.set(id, new WeakRef(element));
    };
    /**
     * Processes matching insertions by finding elements in the cloned content that match
     * the selectors from template children and applying insertions to them.
     */
    HTMLIncludeHandler.prototype.processMatchingInsertions = function (clonedContent, templateChildren) {
        // For each child in the template, find matching elements in the cloned content
        for (var _i = 0, templateChildren_1 = templateChildren; _i < templateChildren_1.length; _i++) {
            var templateChild = templateChildren_1[_i];
            // Generate a selector from the template child
            var selector = toQuery(templateChild);
            // Prepare the insertion content and attribute map
            var _a = prepareForInsertion(templateChild), fragment = _a.fragment, attributeMap = _a.attributeMap;
            // Find all matching elements in the cloned content
            var matchingElements = [];
            if (clonedContent instanceof Element) {
                // Check if the cloned element itself matches
                if (clonedContent.matches(selector)) {
                    matchingElements.push(clonedContent);
                }
                // Find matching descendants
                var descendants = Array.from(clonedContent.querySelectorAll(selector));
                matchingElements = __spreadArray(__spreadArray([], matchingElements, true), descendants, true);
            }
            else if (clonedContent instanceof DocumentFragment) {
                // Search within the fragment
                matchingElements = Array.from(clonedContent.querySelectorAll(selector));
            }
            // Apply insertion to each matching element
            for (var _b = 0, matchingElements_1 = matchingElements; _b < matchingElements_1.length; _b++) {
                var matchingElement = matchingElements_1[_b];
                applyInsertion(matchingElement, fragment, attributeMap);
            }
        }
    };
    /**
     * Clones content from the source element.
     * Priority: remoteContent (hoisted templates) > content (templates) > element itself
     * Returns an object with the cloned node and whether it was cloned from a live element
     */
    HTMLIncludeHandler.prototype.cloneContent = function (sourceElement) {
        // Check for remoteContent property (hoisted templates)
        if ('remoteContent' in sourceElement) {
            try {
                var remoteContent = sourceElement.remoteContent;
                return { clone: remoteContent.cloneNode(true), isLiveElement: false };
            }
            catch (e) {
                console.warn('HTMLInclude: Failed to access remoteContent', e);
            }
        }
        // Check for content property (regular templates)
        if (sourceElement instanceof HTMLTemplateElement && sourceElement.content) {
            return { clone: sourceElement.content.cloneNode(true), isLiveElement: false };
        }
        // Clone the element itself (live DOM element)
        return { clone: sourceElement.cloneNode(true), isLiveElement: true };
    };
    /**
     * Copies MOSE script exports from source to cloned scripts.
     * This optimization avoids re-parsing JSON when cloning MOSE scripts across shadow boundaries.
     */
    HTMLIncludeHandler.prototype.copyMoseExports = function (sourceElement, clone, templateRootNode) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceRootNode, sourceScripts, cloneScripts, waitForEvent, _loop_1, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sourceRootNode = sourceElement.getRootNode();
                        // Only process if source and template are in different root nodes
                        if (sourceRootNode === templateRootNode) {
                            return [2 /*return*/];
                        }
                        sourceScripts = sourceElement.querySelectorAll('script[type="mountobserver"]');
                        if (sourceScripts.length === 0) {
                            return [2 /*return*/];
                        }
                        if (clone instanceof Element) {
                            cloneScripts = clone.querySelectorAll('script[type="mountobserver"]');
                        }
                        else if (clone instanceof DocumentFragment) {
                            cloneScripts = clone.querySelectorAll('script[type="mountobserver"]');
                        }
                        else {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('assign-gingerly/waitForEvent.js'); })];
                    case 1:
                        waitForEvent = (_a.sent()).waitForEvent;
                        _loop_1 = function (i) {
                            var sourceScript, sourceId, cloneScript, sourceExport, event_1, error_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        sourceScript = sourceScripts[i];
                                        sourceId = sourceScript.getAttribute('id');
                                        if (!sourceId)
                                            return [2 /*return*/, "continue"];
                                        cloneScript = Array.from(cloneScripts).find(function (s) { return s.getAttribute('id') === sourceId; });
                                        if (!cloneScript)
                                            return [2 /*return*/, "continue"];
                                        sourceExport = sourceScript.export;
                                        if (!!sourceExport) return [3 /*break*/, 4];
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, waitForEvent(sourceScript, 'resolved', { timeout: 5000 })];
                                    case 2:
                                        event_1 = _b.sent();
                                        sourceExport = event_1.export;
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_2 = _b.sent();
                                        console.warn("HTMLInclude: Timeout waiting for MOSE script #".concat(sourceId, " to resolve"));
                                        return [2 /*return*/, "continue"];
                                    case 4:
                                        // Copy export to cloned script
                                        if (sourceExport) {
                                            cloneScript.export = sourceExport;
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < sourceScripts.length)) return [3 /*break*/, 5];
                        return [5 /*yield**/, _loop_1(i)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    HTMLIncludeHandler.matching = 'template[src^="#"]';
    HTMLIncludeHandler.whereInstanceOf = HTMLTemplateElement;
    return HTMLIncludeHandler;
}(EvtRt_js_1.EvtRt));
exports.HTMLIncludeHandler = HTMLIncludeHandler;
// Register the handler
var MountObserver_js_1 = require("../MountObserver.js");
MountObserver_js_1.MountObserver.define('builtIns.HTMLInclude', HTMLIncludeHandler);
