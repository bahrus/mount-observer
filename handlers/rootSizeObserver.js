"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRootSizeObserver = setupRootSizeObserver;
var Events_js_1 = require("./Events.js");
function setupRootSizeObserver(init, rootNodeRef, mountedElements, modules, observer, processNode) {
    var whereObservedRootSizeMatches = init.whereObservedRootSizeMatches;
    if (!whereObservedRootSizeMatches) {
        throw new Error('whereObservedRootSizeMatches is required');
    }
    var rootNode = rootNodeRef.deref();
    if (!rootNode) {
        throw new Error('Root node has been garbage collected');
    }
    // Get the element to observe
    var rootElement = rootNode instanceof Element
        ? rootNode
        : rootNode.documentElement;
    if (!rootElement) {
        throw new Error('Could not determine root element for whereObservedRootSizeMatches');
    }
    // Parse the container query condition
    // Container queries use the same syntax as media queries: (min-width: 700px)
    var containerQuery = whereObservedRootSizeMatches;
    // Check if condition currently matches
    var conditionMatches = evaluateContainerQuery(rootElement, containerQuery);
    // Set up ResizeObserver to watch for size changes
    var resizeObserver = new ResizeObserver(function (entries) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var previousMatches = conditionMatches;
            conditionMatches = evaluateContainerQuery(entry.target, containerQuery);
            if (conditionMatches && !previousMatches) {
                // Condition now matches - process elements
                handleConditionMatch();
            }
            else if (!conditionMatches && previousMatches) {
                // Condition no longer matches - dismount all elements
                handleConditionUnmatch();
            }
        }
    });
    function handleConditionMatch() {
        // Process all elements in the observed node
        var rootNode = rootNodeRef.deref();
        if (rootNode) {
            processNode(rootNode);
        }
    }
    function handleConditionUnmatch() {
        // Dismount all currently mounted elements
        var rootNode = rootNodeRef.deref();
        if (!rootNode) {
            return;
        }
        var context = {
            modules: modules,
            observer: observer,
            rootNode: rootNode,
            mountConfig: init
        };
        // Get all mounted elements from the WeakDual setWeak
        var mountedElementsList = [];
        for (var _i = 0, _a = mountedElements.setWeak; _i < _a.length; _i++) {
            var ref = _a[_i];
            var element = ref.deref();
            if (element) {
                mountedElementsList.push(element);
            }
        }
        // Dismount each element
        for (var _b = 0, mountedElementsList_1 = mountedElementsList; _b < mountedElementsList_1.length; _b++) {
            var element = mountedElementsList_1[_b];
            // Remove from both structures
            mountedElements.weakSet.delete(element);
            for (var _c = 0, _d = mountedElements.setWeak; _c < _d.length; _c++) {
                var ref = _d[_c];
                if (ref.deref() === element) {
                    mountedElements.setWeak.delete(ref);
                    break;
                }
            }
            // Dispatch dismount event with reason
            observer.dispatchEvent(new Events_js_1.DismountEvent(element, 'root-size-failed', init));
        }
    }
    // Start observing the root element
    resizeObserver.observe(rootElement);
    return {
        conditionMatches: conditionMatches,
        cleanup: function () {
            resizeObserver.disconnect();
        }
    };
}
/**
 * Evaluate a container query condition against an element
 * Supports: min-width, max-width, min-height, max-height
 */
function evaluateContainerQuery(element, query) {
    // Parse container query: (min-width: 700px) or (max-height: 500px)
    var match = query.match(/\(([^:]+):\s*([^)]+)\)/);
    if (!match) {
        console.warn("Invalid container query format: ".concat(query));
        return false;
    }
    var property = match[1], valueStr = match[2];
    var prop = property.trim();
    var value = parseFloat(valueStr);
    if (isNaN(value)) {
        console.warn("Invalid container query value: ".concat(valueStr));
        return false;
    }
    // Get element dimensions
    var rect = element.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;
    // Evaluate condition
    switch (prop) {
        case 'min-width':
            return width >= value;
        case 'max-width':
            return width <= value;
        case 'min-height':
            return height >= value;
        case 'max-height':
            return height <= value;
        default:
            console.warn("Unsupported container query property: ".concat(prop));
            return false;
    }
}
