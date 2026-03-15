"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupElementIntersection = setupElementIntersection;
exports.isElementIntersecting = isElementIntersecting;
var Events_js_1 = require("./Events.js");
function setupElementIntersection(init, rootNodeRef, mountedElements, modules, observer, matchesSelector, handleMatch) {
    var whereElementIntersectsWith = init.whereElementIntersectsWith;
    if (!whereElementIntersectsWith) {
        throw new Error('whereElementIntersectsWith is required');
    }
    // Track which elements are currently intersecting
    var intersectingElements = new WeakSet();
    // Create IntersectionObserver with the provided options
    var intersectionObserver = new IntersectionObserver(function (entries) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var element = entry.target;
            if (entry.isIntersecting) {
                // Element is now intersecting
                intersectingElements.add(element);
                // Check if element matches all other conditions and mount if so
                if (matchesSelector(element)) {
                    handleMatch(element);
                }
            }
            else {
                // Element is no longer intersecting
                intersectingElements.delete(element);
                // Dismount if it was mounted
                if (mountedElements.weakSet.has(element)) {
                    dismountElement(element);
                }
            }
        }
    }, whereElementIntersectsWith);
    function dismountElement(element) {
        // Remove from mounted elements
        mountedElements.weakSet.delete(element);
        for (var _i = 0, _a = mountedElements.setWeak; _i < _a.length; _i++) {
            var ref = _a[_i];
            if (ref.deref() === element) {
                mountedElements.setWeak.delete(ref);
                break;
            }
        }
        // Dispatch dismount event
        observer.dispatchEvent(new Events_js_1.DismountEvent(element, 'intersection-failed', init));
    }
    function observeElement(element) {
        intersectionObserver.observe(element);
    }
    return {
        intersectionObserver: intersectionObserver,
        observeElement: observeElement,
        cleanup: function () {
            intersectionObserver.disconnect();
        }
    };
}
/**
 * Check if an element is currently intersecting
 * This is called from #matchesSelector to determine if intersection condition is met
 */
function isElementIntersecting(element, intersectionObserver) {
    // If no intersection observer is set up, consider all elements as intersecting
    if (!intersectionObserver) {
        return true;
    }
    // When intersection observer is active, we can't synchronously determine intersection state
    // The element will be observed and the callback will handle mounting when it intersects
    // Return false here to prevent immediate mounting
    return false;
}
