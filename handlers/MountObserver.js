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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MountObserver = void 0;
var arr_js_1 = require("./arr.js");
var Events_js_1 = require("./Events.js");
var SharedMutationObserver_js_1 = require("./SharedMutationObserver.js");
var withScopePerimeter_js_1 = require("./withScopePerimeter.js");
var MountObserver = /** @class */ (function (_super) {
    __extends(MountObserver, _super);
    function MountObserver(config, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _MountObserver_instances.add(_this);
        _MountObserver_init.set(_this, void 0);
        _MountObserver_options.set(_this, void 0);
        _MountObserver_abortController.set(_this, void 0);
        _MountObserver_modules.set(_this, []);
        _MountObserver_configFromPromise.set(_this, void 0);
        _MountObserver_mountedElements.set(_this, {
            weakSet: new WeakSet(),
            setWeak: new Set()
        });
        _MountObserver_processedDoForElement.set(_this, new WeakSet());
        _MountObserver_processedEventsForElement.set(_this, new WeakMap());
        _MountObserver_mutationCallback.set(_this, void 0);
        _MountObserver_rootNode.set(_this, void 0);
        _MountObserver_importsLoaded.set(_this, false);
        _MountObserver_mediaQueryCleanup.set(_this, void 0);
        _MountObserver_rootSizeCleanup.set(_this, void 0);
        _MountObserver_intersectionCleanup.set(_this, void 0);
        _MountObserver_connectionCleanup.set(_this, void 0);
        _MountObserver_intersectionObserver.set(_this, void 0);
        _MountObserver_mediaMatches.set(_this, true);
        _MountObserver_rootSizeMatches.set(_this, true);
        _MountObserver_connectionMatches.set(_this, true);
        _MountObserver_asgMtSource.set(_this, void 0);
        _MountObserver_asgDisMtSource.set(_this, void 0);
        _MountObserver_stageMtSource.set(_this, void 0);
        _MountObserver_stageReversals.set(_this, new WeakMap());
        _MountObserver_assignTentatively.set(_this, void 0);
        _MountObserver_elementNotifiers.set(_this, new WeakMap());
        _MountObserver_notifierMountedElements.set(_this, new WeakSet());
        _MountObserver_subObservers.set(_this, void 0);
        _MountObserver_whenDefinedResolved.set(_this, false);
        // Merge handler defaults if do is a string reference
        var mergedConfig = __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_mergeHandlerDefaults).call(_this, config);
        __classPrivateFieldSet(_this, _MountObserver_init, mergedConfig, "f");
        __classPrivateFieldSet(_this, _MountObserver_options, options, "f");
        __classPrivateFieldSet(_this, _MountObserver_abortController, new AbortController(), "f");
        var assignOnMount = mergedConfig.assignOnMount, assignOnDismount = mergedConfig.assignOnDismount, stageOnMount = mergedConfig.stageOnMount, doValue = mergedConfig.do, loadingEagerness = mergedConfig.loadingEagerness, imp = mergedConfig.import, configFrom = mergedConfig.configFrom;
        // Make a copy of assignOnMount config using structuredClone
        if (assignOnMount !== undefined) {
            __classPrivateFieldSet(_this, _MountObserver_asgMtSource, structuredClone(assignOnMount), "f");
        }
        if (assignOnDismount !== undefined) {
            __classPrivateFieldSet(_this, _MountObserver_asgDisMtSource, structuredClone(assignOnDismount), "f");
        }
        if (stageOnMount !== undefined) {
            __classPrivateFieldSet(_this, _MountObserver_stageMtSource, structuredClone(stageOnMount), "f");
        }
        if (options.disconnectedSignal) {
            options.disconnectedSignal.addEventListener('abort', function () {
                _this.disconnect();
            });
        }
        // Validate do property if it contains string references
        if (doValue !== undefined) {
            __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_validateDoHandlers).call(_this);
        }
        // Load configFrom modules if specified
        if (configFrom !== undefined) {
            __classPrivateFieldSet(_this, _MountObserver_configFromPromise, __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_loadConfigFrom).call(_this), "f");
        }
        // Start loading imports if eager
        if (loadingEagerness === 'eager' && imp) {
            __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_loadImports).call(_this);
        }
        return _this;
    }
    MountObserver.define = function (name, handler) {
        if (__classPrivateFieldGet(this, _a, "f", _MountObserver_handlerRegistry).has(name)) {
            throw new Error("".concat(name, " already in use"));
        }
        __classPrivateFieldGet(this, _a, "f", _MountObserver_handlerRegistry).set(name, handler);
    };
    Object.defineProperty(MountObserver.prototype, "disconnectedSignal", {
        get: function () {
            return __classPrivateFieldGet(this, _MountObserver_abortController, "f").signal;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MountObserver.prototype, "mountedElements", {
        get: function () {
            var elements = [];
            for (var _i = 0, _b = __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak; _i < _b.length; _i++) {
                var ref = _b[_i];
                var element = ref.deref();
                if (element !== undefined) {
                    elements.push(element);
                }
            }
            return elements;
        },
        enumerable: false,
        configurable: true
    });
    MountObserver.prototype.getNotifier = function (element) {
        // Return cached notifier if it exists
        var notifier = __classPrivateFieldGet(this, _MountObserver_elementNotifiers, "f").get(element);
        if (notifier) {
            return notifier;
        }
        // Create new EventTarget for this element
        notifier = new EventTarget();
        __classPrivateFieldGet(this, _MountObserver_elementNotifiers, "f").set(element, notifier);
        return notifier;
    };
    /**
     * Begins observing elements within the provided node.
     *
     * @param observedNode - The node to observe for matching elements. This is the root
     *                       of the observation scope where the mutation observer will be
     *                       registered. All matching elements within this node (and its
     *                       descendants) will trigger mount callbacks.
     *
     *                       Common values:
     *                       - `document` - Observe the entire document
     *                       - `element` - Observe a specific subtree
     *                       - `shadowRoot` - Observe within a shadow DOM
     */
    MountObserver.prototype.observe = function (observedNode) {
        return __awaiter(this, void 0, void 0, function () {
            var assignTentatively, observerConfig;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (__classPrivateFieldGet(this, _MountObserver_rootNode, "f")) {
                            throw new Error('Already observing');
                        }
                        if (!__classPrivateFieldGet(this, _MountObserver_configFromPromise, "f")) return [3 /*break*/, 2];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_configFromPromise, "f")];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!(__classPrivateFieldGet(this, _MountObserver_asgMtSource, "f") || __classPrivateFieldGet(this, _MountObserver_asgDisMtSource, "f"))) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('assign-gingerly/object-extension.js'); })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        if (!__classPrivateFieldGet(this, _MountObserver_stageMtSource, "f")) return [3 /*break*/, 6];
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('assign-gingerly/assignTentatively.js'); })];
                    case 5:
                        assignTentatively = (_b.sent()).assignTentatively;
                        __classPrivateFieldSet(this, _MountObserver_assignTentatively, assignTentatively, "f");
                        _b.label = 6;
                    case 6:
                        __classPrivateFieldSet(this, _MountObserver_rootNode, new WeakRef(observedNode), "f");
                        // Wait for whenDefined if specified (must be first check)
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_waitForWhenDefined).call(this, observedNode)];
                    case 7:
                        // Wait for whenDefined if specified (must be first check)
                        _b.sent();
                        // Create sub-observers from `with` property
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_createSubObservers).call(this, observedNode)];
                    case 8:
                        // Create sub-observers from `with` property
                        _b.sent();
                        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").withMediaMatching) return [3 /*break*/, 10];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_setupMediaQuery).call(this)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").whereObservedRootSizeMatches) return [3 /*break*/, 12];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_setupRootSizeObserver).call(this)];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12:
                        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").whereElementIntersectsWith) return [3 /*break*/, 14];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_setupElementIntersection).call(this)];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14:
                        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").whereConnectionHas) return [3 /*break*/, 16];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_setupConnectionMonitor).call(this)];
                    case 15:
                        _b.sent();
                        _b.label = 16;
                    case 16:
                        if (!(__classPrivateFieldGet(this, _MountObserver_init, "f").loadingEagerness === 'eager' && __classPrivateFieldGet(this, _MountObserver_init, "f").import && !__classPrivateFieldGet(this, _MountObserver_importsLoaded, "f"))) return [3 /*break*/, 18];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_loadImports).call(this)];
                    case 17:
                        _b.sent();
                        _b.label = 18;
                    case 18:
                        // Process existing elements only if all conditions match
                        if (__classPrivateFieldGet(this, _MountObserver_mediaMatches, "f") && __classPrivateFieldGet(this, _MountObserver_rootSizeMatches, "f") && __classPrivateFieldGet(this, _MountObserver_connectionMatches, "f")) {
                            __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_processNode).call(this, observedNode);
                        }
                        // Create mutation callback
                        __classPrivateFieldSet(this, _MountObserver_mutationCallback, function (mutations) {
                            // Skip processing if any condition doesn't match
                            if (!__classPrivateFieldGet(_this, _MountObserver_mediaMatches, "f") || !__classPrivateFieldGet(_this, _MountObserver_rootSizeMatches, "f") || !__classPrivateFieldGet(_this, _MountObserver_connectionMatches, "f")) {
                                return;
                            }
                            for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
                                var mutation = mutations_1[_i];
                                if (mutation.type === 'childList') {
                                    for (var _b = 0, _c = mutation.addedNodes; _b < _c.length; _b++) {
                                        var node = _c[_b];
                                        if (node.nodeType === Node.ELEMENT_NODE) {
                                            __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_processNode).call(_this, node);
                                        }
                                    }
                                    mutation.removedNodes.forEach(function (node) {
                                        if (node.nodeType === Node.ELEMENT_NODE) {
                                            __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_handleRemoval).call(_this, node);
                                        }
                                    });
                                }
                            }
                        }, "f");
                        observerConfig = {
                            childList: true,
                            subtree: true
                        };
                        // Register with shared mutation observer
                        (0, SharedMutationObserver_js_1.registerSharedObserver)(observedNode, __classPrivateFieldGet(this, _MountObserver_mutationCallback, "f"), observerConfig);
                        return [2 /*return*/];
                }
            });
        });
    };
    MountObserver.prototype.disconnect = function () {
        var _b;
        var rootNode = (_b = __classPrivateFieldGet(this, _MountObserver_rootNode, "f")) === null || _b === void 0 ? void 0 : _b.deref();
        // Disconnect all sub-observers first (recursive)
        if (__classPrivateFieldGet(this, _MountObserver_subObservers, "f")) {
            for (var _i = 0, _c = __classPrivateFieldGet(this, _MountObserver_subObservers, "f").values(); _i < _c.length; _i++) {
                var subObserver = _c[_i];
                subObserver.disconnect();
            }
            __classPrivateFieldGet(this, _MountObserver_subObservers, "f").clear();
            __classPrivateFieldSet(this, _MountObserver_subObservers, undefined, "f");
        }
        // Unregister from shared mutation observer
        if (rootNode && __classPrivateFieldGet(this, _MountObserver_mutationCallback, "f")) {
            (0, SharedMutationObserver_js_1.unregisterSharedObserver)(rootNode, __classPrivateFieldGet(this, _MountObserver_mutationCallback, "f"));
            __classPrivateFieldSet(this, _MountObserver_mutationCallback, undefined, "f");
        }
        // Remove media query listener
        if (__classPrivateFieldGet(this, _MountObserver_mediaQueryCleanup, "f")) {
            __classPrivateFieldGet(this, _MountObserver_mediaQueryCleanup, "f").call(this);
            __classPrivateFieldSet(this, _MountObserver_mediaQueryCleanup, undefined, "f");
        }
        // Remove root size observer
        if (__classPrivateFieldGet(this, _MountObserver_rootSizeCleanup, "f")) {
            __classPrivateFieldGet(this, _MountObserver_rootSizeCleanup, "f").call(this);
            __classPrivateFieldSet(this, _MountObserver_rootSizeCleanup, undefined, "f");
        }
        // Remove intersection observer
        if (__classPrivateFieldGet(this, _MountObserver_intersectionCleanup, "f")) {
            __classPrivateFieldGet(this, _MountObserver_intersectionCleanup, "f").call(this);
            __classPrivateFieldSet(this, _MountObserver_intersectionCleanup, undefined, "f");
        }
        // Remove connection monitor
        if (__classPrivateFieldGet(this, _MountObserver_connectionCleanup, "f")) {
            __classPrivateFieldGet(this, _MountObserver_connectionCleanup, "f").call(this);
            __classPrivateFieldSet(this, _MountObserver_connectionCleanup, undefined, "f");
        }
        __classPrivateFieldGet(this, _MountObserver_abortController, "f").abort();
        __classPrivateFieldSet(this, _MountObserver_rootNode, undefined, "f");
    };
    MountObserver.prototype.assignGingerly = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _b, ref, element;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Handle undefined case
                        if (config === undefined) {
                            __classPrivateFieldSet(this, _MountObserver_asgMtSource, undefined, "f");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('assign-gingerly/object-extension.js'); })];
                    case 1:
                        _c.sent();
                        // Update the source config for future mounted elements
                        if (__classPrivateFieldGet(this, _MountObserver_asgMtSource, "f") === undefined) {
                            // No existing config, just clone the passed in object
                            __classPrivateFieldSet(this, _MountObserver_asgMtSource, structuredClone(config), "f");
                        }
                        else {
                            // Merge into existing config using assignGingerly
                            __classPrivateFieldGet(this, _MountObserver_asgMtSource, "f").assignGingerly(config);
                            //assignGingerly(this.#asgMtSource, config);
                        }
                        // Apply to already mounted elements using setWeak for iteration
                        for (_i = 0, _b = __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak; _i < _b.length; _i++) {
                            ref = _b[_i];
                            element = ref.deref();
                            if (element) {
                                element.assignGingerly(config);
                                //assignGingerly(element, config);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    var _MountObserver_instances, _a, _MountObserver_handlerRegistry, _MountObserver_init, _MountObserver_options, _MountObserver_abortController, _MountObserver_modules, _MountObserver_configFromPromise, _MountObserver_mountedElements, _MountObserver_processedDoForElement, _MountObserver_processedEventsForElement, _MountObserver_mutationCallback, _MountObserver_rootNode, _MountObserver_importsLoaded, _MountObserver_mediaQueryCleanup, _MountObserver_rootSizeCleanup, _MountObserver_intersectionCleanup, _MountObserver_connectionCleanup, _MountObserver_intersectionObserver, _MountObserver_mediaMatches, _MountObserver_rootSizeMatches, _MountObserver_connectionMatches, _MountObserver_asgMtSource, _MountObserver_asgDisMtSource, _MountObserver_stageMtSource, _MountObserver_stageReversals, _MountObserver_assignTentatively, _MountObserver_elementNotifiers, _MountObserver_notifierMountedElements, _MountObserver_subObservers, _MountObserver_whenDefinedResolved, _MountObserver_mergeHandlerDefaults, _MountObserver_validateDoHandlers, _MountObserver_loadConfigFrom, _MountObserver_waitForWhenDefined, _MountObserver_createSubObservers, _MountObserver_setupMediaQuery, _MountObserver_setupRootSizeObserver, _MountObserver_setupElementIntersection, _MountObserver_setupConnectionMonitor, _MountObserver_loadImports, _MountObserver_processNode, _MountObserver_matchesSelector, _MountObserver_handleMatch, _MountObserver_handleRemoval;
    _a = MountObserver, _MountObserver_init = new WeakMap(), _MountObserver_options = new WeakMap(), _MountObserver_abortController = new WeakMap(), _MountObserver_modules = new WeakMap(), _MountObserver_configFromPromise = new WeakMap(), _MountObserver_mountedElements = new WeakMap(), _MountObserver_processedDoForElement = new WeakMap(), _MountObserver_processedEventsForElement = new WeakMap(), _MountObserver_mutationCallback = new WeakMap(), _MountObserver_rootNode = new WeakMap(), _MountObserver_importsLoaded = new WeakMap(), _MountObserver_mediaQueryCleanup = new WeakMap(), _MountObserver_rootSizeCleanup = new WeakMap(), _MountObserver_intersectionCleanup = new WeakMap(), _MountObserver_connectionCleanup = new WeakMap(), _MountObserver_intersectionObserver = new WeakMap(), _MountObserver_mediaMatches = new WeakMap(), _MountObserver_rootSizeMatches = new WeakMap(), _MountObserver_connectionMatches = new WeakMap(), _MountObserver_asgMtSource = new WeakMap(), _MountObserver_asgDisMtSource = new WeakMap(), _MountObserver_stageMtSource = new WeakMap(), _MountObserver_stageReversals = new WeakMap(), _MountObserver_assignTentatively = new WeakMap(), _MountObserver_elementNotifiers = new WeakMap(), _MountObserver_notifierMountedElements = new WeakMap(), _MountObserver_subObservers = new WeakMap(), _MountObserver_whenDefinedResolved = new WeakMap(), _MountObserver_instances = new WeakSet(), _MountObserver_mergeHandlerDefaults = function _MountObserver_mergeHandlerDefaults(config) {
        var doValue = config.do;
        // Only process if do is a string (single handler reference)
        if (typeof doValue !== 'string') {
            return config;
        }
        // Look up the handler class
        var HandlerClass = __classPrivateFieldGet(_a, _a, "f", _MountObserver_handlerRegistry).get(doValue);
        if (!HandlerClass) {
            // Validation will catch this later
            return config;
        }
        // Extract static properties from the handler class
        var handlerDefaults = {};
        var proto = HandlerClass;
        // Get all static properties
        for (var _i = 0, _b = Object.getOwnPropertyNames(proto); _i < _b.length; _i++) {
            var key = _b[_i];
            if (key !== 'prototype' && key !== 'length' && key !== 'name') {
                handlerDefaults[key] = proto[key];
            }
        }
        // Merge: handler defaults first, then inline config (inline trumps)
        // Using object spread - inline config overwrites handler defaults
        return __assign(__assign({}, handlerDefaults), config);
    }, _MountObserver_validateDoHandlers = function _MountObserver_validateDoHandlers() {
        var doValue = __classPrivateFieldGet(this, _MountObserver_init, "f").do;
        if (doValue === undefined)
            return;
        var handlers = Array.isArray(doValue) ? doValue : [doValue];
        for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
            var handler = handlers_1[_i];
            if (typeof handler === 'string') {
                if (!__classPrivateFieldGet(_a, _a, "f", _MountObserver_handlerRegistry).has(handler)) {
                    throw new Error("No handler defined for ".concat(handler));
                }
            }
        }
    }, _MountObserver_loadConfigFrom = function _MountObserver_loadConfigFrom() {
        return __awaiter(this, void 0, void 0, function () {
            var configFrom, configPaths, pathSet, _i, configPaths_1, path, loadedConfigs, _b, configPaths_2, path, module, error_1, inlineConfig, mergedConfig, _c, loadedConfigs_1, loadedConfig;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        configFrom = __classPrivateFieldGet(this, _MountObserver_init, "f").configFrom;
                        if (!configFrom)
                            return [2 /*return*/];
                        configPaths = Array.isArray(configFrom) ? configFrom : [configFrom];
                        pathSet = new Set();
                        for (_i = 0, configPaths_1 = configPaths; _i < configPaths_1.length; _i++) {
                            path = configPaths_1[_i];
                            if (pathSet.has(path)) {
                                throw new Error("Duplicate configFrom module: '".concat(path, "'"));
                            }
                            pathSet.add(path);
                        }
                        loadedConfigs = [];
                        _b = 0, configPaths_2 = configPaths;
                        _d.label = 1;
                    case 1:
                        if (!(_b < configPaths_2.length)) return [3 /*break*/, 6];
                        path = configPaths_2[_b];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, Promise.resolve("".concat(path)).then(function (s) { return require(s); })];
                    case 3:
                        module = _d.sent();
                        if (!module.mountConfig) {
                            throw new Error("Module '".concat(path, "' does not export 'mountConfig'"));
                        }
                        if (typeof module.mountConfig !== 'object' || module.mountConfig === null) {
                            throw new Error("Module '".concat(path, "' exports invalid mountConfig: must be an object"));
                        }
                        loadedConfigs.push(module.mountConfig);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _d.sent();
                        // Re-throw with better context if it's not already our error
                        if (error_1 instanceof Error && !error_1.message.includes(path)) {
                            throw new Error("Failed to load config from '".concat(path, "': ").concat(error_1.message));
                        }
                        throw error_1;
                    case 5:
                        _b++;
                        return [3 /*break*/, 1];
                    case 6:
                        inlineConfig = __assign({}, __classPrivateFieldGet(this, _MountObserver_init, "f"));
                        mergedConfig = {};
                        for (_c = 0, loadedConfigs_1 = loadedConfigs; _c < loadedConfigs_1.length; _c++) {
                            loadedConfig = loadedConfigs_1[_c];
                            mergedConfig = Object.assign(mergedConfig, loadedConfig);
                        }
                        // Inline config takes final precedence
                        mergedConfig = Object.assign(mergedConfig, inlineConfig);
                        // Update the init config with merged result
                        __classPrivateFieldSet(this, _MountObserver_init, mergedConfig, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_waitForWhenDefined = function _MountObserver_waitForWhenDefined(rootNode) {
        return __awaiter(this, void 0, void 0, function () {
            var registry, tagNames;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Skip if already resolved or not configured
                        if (__classPrivateFieldGet(this, _MountObserver_whenDefinedResolved, "f") || !__classPrivateFieldGet(this, _MountObserver_init, "f").whenDefined) {
                            return [2 /*return*/];
                        }
                        registry = rootNode.customElementRegistry || customElements;
                        tagNames = (0, arr_js_1.arr)(__classPrivateFieldGet(this, _MountObserver_init, "f").whenDefined);
                        // Wait for all tags to be defined
                        return [4 /*yield*/, Promise.all(tagNames.map(function (tag) { return registry.whenDefined(tag); }))];
                    case 1:
                        // Wait for all tags to be defined
                        _b.sent();
                        // Mark as resolved so we don't check again
                        __classPrivateFieldSet(this, _MountObserver_whenDefinedResolved, true, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_createSubObservers = function _MountObserver_createSubObservers(rootNode) {
        return __awaiter(this, void 0, void 0, function () {
            var withConfig, _i, _b, _c, key, subConfig, subObserver;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        withConfig = __classPrivateFieldGet(this, _MountObserver_init, "f").with;
                        if (!withConfig)
                            return [2 /*return*/];
                        __classPrivateFieldSet(this, _MountObserver_subObservers, new Map(), "f");
                        _i = 0, _b = Object.entries(withConfig);
                        _d.label = 1;
                    case 1:
                        if (!(_i < _b.length)) return [3 /*break*/, 4];
                        _c = _b[_i], key = _c[0], subConfig = _c[1];
                        subObserver = new _a(subConfig);
                        __classPrivateFieldGet(this, _MountObserver_subObservers, "f").set(key, subObserver);
                        return [4 /*yield*/, subObserver.observe(rootNode)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_setupMediaQuery = function _MountObserver_setupMediaQuery() {
        return __awaiter(this, void 0, void 0, function () {
            var setupMediaQuery, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!__classPrivateFieldGet(this, _MountObserver_rootNode, "f")) {
                            throw new Error('Cannot setup media query before observe() is called');
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./mediaQuery.js'); })];
                    case 1:
                        setupMediaQuery = (_b.sent()).setupMediaQuery;
                        result = setupMediaQuery(__classPrivateFieldGet(this, _MountObserver_init, "f"), __classPrivateFieldGet(this, _MountObserver_rootNode, "f"), __classPrivateFieldGet(this, _MountObserver_mountedElements, "f"), __classPrivateFieldGet(this, _MountObserver_modules, "f"), this, function (node) { return __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_processNode).call(_this, node); });
                        __classPrivateFieldSet(this, _MountObserver_mediaMatches, result.mediaMatches, "f");
                        __classPrivateFieldSet(this, _MountObserver_mediaQueryCleanup, result.cleanup, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_setupRootSizeObserver = function _MountObserver_setupRootSizeObserver() {
        return __awaiter(this, void 0, void 0, function () {
            var setupRootSizeObserver, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!__classPrivateFieldGet(this, _MountObserver_rootNode, "f")) {
                            throw new Error('Cannot setup root size observer before observe() is called');
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./rootSizeObserver.js'); })];
                    case 1:
                        setupRootSizeObserver = (_b.sent()).setupRootSizeObserver;
                        result = setupRootSizeObserver(__classPrivateFieldGet(this, _MountObserver_init, "f"), __classPrivateFieldGet(this, _MountObserver_rootNode, "f"), __classPrivateFieldGet(this, _MountObserver_mountedElements, "f"), __classPrivateFieldGet(this, _MountObserver_modules, "f"), this, function (node) { return __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_processNode).call(_this, node); });
                        __classPrivateFieldSet(this, _MountObserver_rootSizeMatches, result.conditionMatches, "f");
                        __classPrivateFieldSet(this, _MountObserver_rootSizeCleanup, result.cleanup, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_setupElementIntersection = function _MountObserver_setupElementIntersection() {
        return __awaiter(this, void 0, void 0, function () {
            var setupElementIntersection, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!__classPrivateFieldGet(this, _MountObserver_rootNode, "f")) {
                            throw new Error('Cannot setup element intersection before observe() is called');
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./elementIntersection.js'); })];
                    case 1:
                        setupElementIntersection = (_b.sent()).setupElementIntersection;
                        result = setupElementIntersection(__classPrivateFieldGet(this, _MountObserver_init, "f"), __classPrivateFieldGet(this, _MountObserver_rootNode, "f"), __classPrivateFieldGet(this, _MountObserver_mountedElements, "f"), __classPrivateFieldGet(this, _MountObserver_modules, "f"), this, function (element) { return __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_matchesSelector).call(_this, element); }, function (element) { return __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_handleMatch).call(_this, element); });
                        __classPrivateFieldSet(this, _MountObserver_intersectionObserver, result.intersectionObserver, "f");
                        __classPrivateFieldSet(this, _MountObserver_intersectionCleanup, result.cleanup, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_setupConnectionMonitor = function _MountObserver_setupConnectionMonitor() {
        return __awaiter(this, void 0, void 0, function () {
            var setupConnectionMonitor, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!__classPrivateFieldGet(this, _MountObserver_rootNode, "f")) {
                            throw new Error('Cannot setup connection monitor before observe() is called');
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./connectionMonitor.js'); })];
                    case 1:
                        setupConnectionMonitor = (_b.sent()).setupConnectionMonitor;
                        result = setupConnectionMonitor(__classPrivateFieldGet(this, _MountObserver_init, "f"), __classPrivateFieldGet(this, _MountObserver_rootNode, "f"), __classPrivateFieldGet(this, _MountObserver_mountedElements, "f"), __classPrivateFieldGet(this, _MountObserver_modules, "f"), this, function (node) { return __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_processNode).call(_this, node); });
                        __classPrivateFieldSet(this, _MountObserver_connectionMatches, result.conditionMatches, "f");
                        __classPrivateFieldSet(this, _MountObserver_connectionCleanup, result.cleanup, "f");
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_loadImports = function _MountObserver_loadImports() {
        return __awaiter(this, void 0, void 0, function () {
            var loadImports, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (__classPrivateFieldGet(this, _MountObserver_importsLoaded, "f") || !__classPrivateFieldGet(this, _MountObserver_init, "f").import) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./loadImports.js'); })];
                    case 1:
                        loadImports = (_c.sent()).loadImports;
                        _b = [this, _MountObserver_modules];
                        return [4 /*yield*/, loadImports(__classPrivateFieldGet(this, _MountObserver_init, "f").import)];
                    case 2:
                        __classPrivateFieldSet.apply(void 0, _b.concat([_c.sent(), "f"]));
                        __classPrivateFieldSet(this, _MountObserver_importsLoaded, true, "f");
                        this.dispatchEvent(new Events_js_1.LoadEvent(__classPrivateFieldGet(this, _MountObserver_modules, "f"), __classPrivateFieldGet(this, _MountObserver_init, "f")));
                        return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_processNode = function _MountObserver_processNode(node) {
        var _this = this;
        // If it's an element node, check if it matches
        if (node.nodeType === Node.ELEMENT_NODE) {
            var element = node;
            // If intersection observer is active, start observing the element
            // The intersection callback will handle mounting when it intersects
            if (__classPrivateFieldGet(this, _MountObserver_intersectionObserver, "f")) {
                __classPrivateFieldGet(this, _MountObserver_intersectionObserver, "f").observe(element);
            }
            else if (__classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_matchesSelector).call(this, element)) {
                __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_handleMatch).call(this, element);
            }
        }
        // Process children
        if ('querySelectorAll' in node && __classPrivateFieldGet(this, _MountObserver_init, "f").matching) {
            var root = node;
            // Get all elements matching the CSS selector first
            var matches = root.querySelectorAll(__classPrivateFieldGet(this, _MountObserver_init, "f").matching);
            matches.forEach(function (child) {
                // If intersection observer is active, start observing the element
                if (__classPrivateFieldGet(_this, _MountObserver_intersectionObserver, "f")) {
                    __classPrivateFieldGet(_this, _MountObserver_intersectionObserver, "f").observe(child);
                }
                else if (__classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_matchesSelector).call(_this, child)) {
                    __classPrivateFieldGet(_this, _MountObserver_instances, "m", _MountObserver_handleMatch).call(_this, child);
                }
            });
        }
    }, _MountObserver_matchesSelector = function _MountObserver_matchesSelector(element) {
        var _b;
        //TODO:  reduce redundncy with this.#init?
        // Check matching condition
        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").matching) {
            return false;
        }
        var matchesElement = element.matches(__classPrivateFieldGet(this, _MountObserver_init, "f").matching);
        if (!matchesElement) {
            return false;
        }
        // Check that element's customElementRegistry matches root node's registry
        var rootNode = (_b = __classPrivateFieldGet(this, _MountObserver_rootNode, "f")) === null || _b === void 0 ? void 0 : _b.deref();
        if (rootNode) {
            var registriesMatch = rootNode.customElementRegistry === element.customElementRegistry;
            // If whereDifferentCustomElementRegistry is true, exclude matching registries
            if (__classPrivateFieldGet(this, _MountObserver_init, "f").whereDifferentCustomElementRegistry) {
                if (registriesMatch)
                    return false;
            }
            else {
                // Default behavior: exclude non-matching registries
                if (!registriesMatch)
                    return false;
            }
        }
        // Check withScopePerimeter condition if specified (donut hole scoping)
        if (__classPrivateFieldGet(this, _MountObserver_init, "f").withScopePerimeter) {
            if (!rootNode || !(0, withScopePerimeter_js_1.withScopePerimeter)(rootNode, element, __classPrivateFieldGet(this, _MountObserver_init, "f").withScopePerimeter)) {
                return false;
            }
        }
        // Check whereObservedRootSizeMatches condition if specified
        if (__classPrivateFieldGet(this, _MountObserver_init, "f").whereObservedRootSizeMatches && !__classPrivateFieldGet(this, _MountObserver_rootSizeMatches, "f")) {
            return false;
        }
        // Check whereInstanceOf condition if specified
        if (__classPrivateFieldGet(this, _MountObserver_init, "f").whereInstanceOf) {
            var constructors = (0, arr_js_1.arr)(__classPrivateFieldGet(this, _MountObserver_init, "f").whereInstanceOf);
            // Element must be an instance of at least one constructor (OR logic for array)
            var matchesInstanceOf = constructors.some(function (constructor) { return element instanceof constructor; });
            if (!matchesInstanceOf) {
                return false;
            }
        }
        // Check whereLocalNameMatches condition if specified
        if (__classPrivateFieldGet(this, _MountObserver_init, "f").whereLocalNameMatches) {
            var pattern = typeof __classPrivateFieldGet(this, _MountObserver_init, "f").whereLocalNameMatches === 'string'
                ? new RegExp(__classPrivateFieldGet(this, _MountObserver_init, "f").whereLocalNameMatches)
                : __classPrivateFieldGet(this, _MountObserver_init, "f").whereLocalNameMatches;
            if (!pattern.test(element.localName)) {
                return false;
            }
        }
        // All conditions passed
        return true;
    }, _MountObserver_handleMatch = function _MountObserver_handleMatch(element) {
        return __awaiter(this, void 0, void 0, function () {
            var rootNode, context, _i, _b, _c, key, subObserver, shouldMount, _d, _e, ref, _f, _g, ref, reversal, notifierExistedBeforeDo, doHandlers, _h, doHandlers_1, handler, HandlerClass, mountEvent, notifier, emitMountedElementEvents;
            var _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        if (__classPrivateFieldGet(this, _MountObserver_processedDoForElement, "f").has(element)) {
                            return [2 /*return*/];
                        }
                        if (!(!__classPrivateFieldGet(this, _MountObserver_importsLoaded, "f") && __classPrivateFieldGet(this, _MountObserver_init, "f").import)) return [3 /*break*/, 2];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MountObserver_instances, "m", _MountObserver_loadImports).call(this)];
                    case 1:
                        _k.sent();
                        _k.label = 2;
                    case 2:
                        __classPrivateFieldGet(this, _MountObserver_processedDoForElement, "f").add(element);
                        // Add to both WeakSet and Set<WeakRef> for efficient operations
                        if (!__classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.has(element)) {
                            __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.add(element);
                            __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak.add(new WeakRef(element));
                        }
                        rootNode = (_j = __classPrivateFieldGet(this, _MountObserver_rootNode, "f")) === null || _j === void 0 ? void 0 : _j.deref();
                        if (!rootNode) {
                            // Root node was garbage collected
                            return [2 /*return*/];
                        }
                        context = {
                            modules: __classPrivateFieldGet(this, _MountObserver_modules, "f"),
                            observer: this,
                            rootNode: rootNode,
                            mountConfig: __classPrivateFieldGet(this, _MountObserver_init, "f"),
                        };
                        // Add withObservers if sub-observers exist
                        if (__classPrivateFieldGet(this, _MountObserver_subObservers, "f") && __classPrivateFieldGet(this, _MountObserver_subObservers, "f").size > 0) {
                            context.withObservers = {};
                            for (_i = 0, _b = __classPrivateFieldGet(this, _MountObserver_subObservers, "f").entries(); _i < _b.length; _i++) {
                                _c = _b[_i], key = _c[0], subObserver = _c[1];
                                context.withObservers[key] = subObserver;
                            }
                        }
                        // Check shouldMount condition if specified (final gate before mounting)
                        if (__classPrivateFieldGet(this, _MountObserver_init, "f").shouldMount) {
                            try {
                                shouldMount = __classPrivateFieldGet(this, _MountObserver_init, "f").shouldMount(element, context);
                                if (!shouldMount) {
                                    // shouldMount returned false - don't mount this element
                                    // Remove from processed set so it can be re-evaluated later
                                    __classPrivateFieldGet(this, _MountObserver_processedDoForElement, "f").delete(element);
                                    // Remove from mounted elements tracking
                                    __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.delete(element);
                                    for (_d = 0, _e = __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak; _d < _e.length; _d++) {
                                        ref = _e[_d];
                                        if (ref.deref() === element) {
                                            __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak.delete(ref);
                                            break;
                                        }
                                    }
                                    return [2 /*return*/];
                                }
                            }
                            catch (error) {
                                // shouldMount threw an error - treat as false and log
                                console.error('shouldMount check failed:', error);
                                // Remove from processed set so it can be re-evaluated later
                                __classPrivateFieldGet(this, _MountObserver_processedDoForElement, "f").delete(element);
                                // Remove from mounted elements tracking
                                __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.delete(element);
                                for (_f = 0, _g = __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak; _f < _g.length; _f++) {
                                    ref = _g[_f];
                                    if (ref.deref() === element) {
                                        __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak.delete(ref);
                                        break;
                                    }
                                }
                                return [2 /*return*/];
                            }
                        }
                        // Apply assignGingerly if specified
                        if (__classPrivateFieldGet(this, _MountObserver_asgMtSource, "f")) {
                            element.assignGingerly(__classPrivateFieldGet(this, _MountObserver_asgMtSource, "f"));
                        }
                        // Apply assignTentatively if specified (staged assignments)
                        if (__classPrivateFieldGet(this, _MountObserver_stageMtSource, "f") && __classPrivateFieldGet(this, _MountObserver_assignTentatively, "f")) {
                            reversal = {};
                            __classPrivateFieldGet(this, _MountObserver_assignTentatively, "f").call(this, element, __classPrivateFieldGet(this, _MountObserver_stageMtSource, "f"), { reversal: reversal });
                            __classPrivateFieldGet(this, _MountObserver_stageReversals, "f").set(element, reversal);
                        }
                        notifierExistedBeforeDo = __classPrivateFieldGet(this, _MountObserver_elementNotifiers, "f").has(element);
                        // Call do callback(s) - can be string, function, or array
                        if (__classPrivateFieldGet(this, _MountObserver_init, "f").do !== undefined) {
                            doHandlers = Array.isArray(__classPrivateFieldGet(this, _MountObserver_init, "f").do) ? __classPrivateFieldGet(this, _MountObserver_init, "f").do : [__classPrivateFieldGet(this, _MountObserver_init, "f").do];
                            for (_h = 0, doHandlers_1 = doHandlers; _h < doHandlers_1.length; _h++) {
                                handler = doHandlers_1[_h];
                                if (typeof handler === 'string') {
                                    HandlerClass = __classPrivateFieldGet(_a, _a, "f", _MountObserver_handlerRegistry).get(handler);
                                    if (HandlerClass) {
                                        new HandlerClass(element, context);
                                    }
                                }
                                else if (typeof handler === 'function') {
                                    // Inline function
                                    handler(element, context);
                                }
                            }
                        }
                        mountEvent = new Events_js_1.MountEvent(element, __classPrivateFieldGet(this, _MountObserver_modules, "f"), __classPrivateFieldGet(this, _MountObserver_init, "f"), context);
                        this.dispatchEvent(mountEvent);
                        // Dispatch to element-specific notifier only if:
                        // 1. Notifier existed before do callback (wasn't just created), AND
                        // 2. Element hasn't already received a mount event on its notifier
                        if (notifierExistedBeforeDo && !__classPrivateFieldGet(this, _MountObserver_notifierMountedElements, "f").has(element)) {
                            notifier = __classPrivateFieldGet(this, _MountObserver_elementNotifiers, "f").get(element);
                            if (notifier) {
                                __classPrivateFieldGet(this, _MountObserver_notifierMountedElements, "f").add(element);
                                notifier.dispatchEvent(mountEvent);
                            }
                        }
                        if (!__classPrivateFieldGet(this, _MountObserver_init, "f").mountedElemEmits) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./emitEvents.js'); })];
                    case 3:
                        emitMountedElementEvents = (_k.sent()).emitMountedElementEvents;
                        return [4 /*yield*/, emitMountedElementEvents(element, __classPrivateFieldGet(this, _MountObserver_init, "f"), __classPrivateFieldGet(this, _MountObserver_processedEventsForElement, "f"))];
                    case 4:
                        _k.sent();
                        _k.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, _MountObserver_handleRemoval = function _MountObserver_handleRemoval(element) {
        return __awaiter(this, void 0, void 0, function () {
            var reversal, _i, _b, ref, rootNode, context, _c, _d, _e, key, subObserver, dismountEvent, notifier;
            var _this = this;
            var _f;
            return __generator(this, function (_g) {
                if (!__classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.has(element)) {
                    return [2 /*return*/];
                }
                // Reverse tentative assignments first (restore original values)
                if (__classPrivateFieldGet(this, _MountObserver_stageMtSource, "f") && __classPrivateFieldGet(this, _MountObserver_assignTentatively, "f")) {
                    reversal = __classPrivateFieldGet(this, _MountObserver_stageReversals, "f").get(element);
                    if (reversal) {
                        __classPrivateFieldGet(this, _MountObserver_assignTentatively, "f").call(this, element, reversal);
                        __classPrivateFieldGet(this, _MountObserver_stageReversals, "f").delete(element);
                    }
                }
                // Apply assignGingerly if specified for dismount
                if (__classPrivateFieldGet(this, _MountObserver_asgDisMtSource, "f")) {
                    element.assignGingerly(__classPrivateFieldGet(this, _MountObserver_asgDisMtSource, "f"));
                }
                // Remove from both structures
                __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").weakSet.delete(element);
                for (_i = 0, _b = __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak; _i < _b.length; _i++) {
                    ref = _b[_i];
                    if (ref.deref() === element) {
                        __classPrivateFieldGet(this, _MountObserver_mountedElements, "f").setWeak.delete(ref);
                        break;
                    }
                }
                // Remove from processed set so element can be re-mounted
                __classPrivateFieldGet(this, _MountObserver_processedDoForElement, "f").delete(element);
                // Remove from notifier mounted tracking so mount event can fire again
                __classPrivateFieldGet(this, _MountObserver_notifierMountedElements, "f").delete(element);
                rootNode = (_f = __classPrivateFieldGet(this, _MountObserver_rootNode, "f")) === null || _f === void 0 ? void 0 : _f.deref();
                if (!rootNode) {
                    // Root node was garbage collected
                    return [2 /*return*/];
                }
                context = {
                    modules: __classPrivateFieldGet(this, _MountObserver_modules, "f"),
                    observer: this,
                    rootNode: rootNode,
                    mountConfig: __classPrivateFieldGet(this, _MountObserver_init, "f"),
                };
                // Add withObservers if sub-observers exist
                if (__classPrivateFieldGet(this, _MountObserver_subObservers, "f") && __classPrivateFieldGet(this, _MountObserver_subObservers, "f").size > 0) {
                    context.withObservers = {};
                    for (_c = 0, _d = __classPrivateFieldGet(this, _MountObserver_subObservers, "f").entries(); _c < _d.length; _c++) {
                        _e = _d[_c], key = _e[0], subObserver = _e[1];
                        context.withObservers[key] = subObserver;
                    }
                }
                dismountEvent = new Events_js_1.DismountEvent(element, 'with-matching-failed', __classPrivateFieldGet(this, _MountObserver_init, "f"));
                this.dispatchEvent(dismountEvent);
                notifier = __classPrivateFieldGet(this, _MountObserver_elementNotifiers, "f").get(element);
                if (notifier) {
                    notifier.dispatchEvent(dismountEvent);
                }
                // Check if element is being moved within the same root
                // If it's truly disconnected, dispatch disconnect event
                setTimeout(function () {
                    if (!rootNode.contains(element)) {
                        var disconnectEvent = new Events_js_1.DisconnectEvent(element, __classPrivateFieldGet(_this, _MountObserver_init, "f"));
                        _this.dispatchEvent(disconnectEvent);
                        // Dispatch to element-specific notifier
                        var notifier_1 = __classPrivateFieldGet(_this, _MountObserver_elementNotifiers, "f").get(element);
                        if (notifier_1) {
                            notifier_1.dispatchEvent(disconnectEvent);
                        }
                    }
                }, 0);
                return [2 /*return*/];
            });
        });
    };
    // Static registry for registered handlers
    _MountObserver_handlerRegistry = { value: new Map() };
    return MountObserver;
}(EventTarget));
exports.MountObserver = MountObserver;
