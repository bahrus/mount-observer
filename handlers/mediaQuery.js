"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMediaQuery = setupMediaQuery;
var Events_js_1 = require("./Events.js");
function setupMediaQuery(init, rootNodeRef, mountedElements, modules, observer, processNode) {
    var withMediaMatching = init.withMediaMatching;
    // Create or use MediaQueryList
    var mediaQueryList;
    if (typeof withMediaMatching === 'string') {
        mediaQueryList = window.matchMedia(withMediaMatching);
    }
    else {
        mediaQueryList = withMediaMatching;
    }
    // Track current state
    var mediaMatches = mediaQueryList.matches;
    // Set up change listener
    var mediaChangeHandler = function (e) {
        var previousMatches = mediaMatches;
        mediaMatches = e.matches;
        if (e.matches && !previousMatches) {
            // Media query now matches - wake up and process elements
            handleMediaMatch();
        }
        else if (!e.matches && previousMatches) {
            // Media query no longer matches - dismount all elements
            handleMediaUnmatch();
        }
    };
    function handleMediaMatch() {
        // Dispatch mediamatch event if requested
        if (init.getPlayByPlay) {
            observer.dispatchEvent(new Events_js_1.MediaMatchEvent(init));
        }
        // Process all elements in the observed node
        var rootNode = rootNodeRef.deref();
        if (rootNode) {
            processNode(rootNode);
        }
    }
    function handleMediaUnmatch() {
        // Dispatch mediaunmatch event if requested
        if (init.getPlayByPlay) {
            observer.dispatchEvent(new Events_js_1.MediaUnmatchEvent(init));
        }
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
            observer.dispatchEvent(new Events_js_1.DismountEvent(element, 'media-query-failed', init));
        }
    }
    mediaQueryList.addEventListener('change', mediaChangeHandler);
    return {
        mediaQueryList: mediaQueryList,
        mediaMatches: mediaMatches,
        cleanup: function () {
            mediaQueryList.removeEventListener('change', mediaChangeHandler);
        }
    };
}
