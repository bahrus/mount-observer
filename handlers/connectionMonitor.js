"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupConnectionMonitor = setupConnectionMonitor;
var Events_js_1 = require("./Events.js");
function setupConnectionMonitor(init, rootNodeRef, mountedElements, modules, observer, processNode) {
    var whereConnectionHas = init.whereConnectionHas;
    if (!whereConnectionHas) {
        throw new Error('whereConnectionHas is required');
    }
    // Get connection object with vendor prefixes
    var nav = navigator;
    var connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    // If Network Information API is not supported, warn and pass the condition
    if (!connection) {
        console.warn('Network Information API is not supported in this browser. whereConnectionHas condition will be ignored.');
        return {
            conditionMatches: true,
            cleanup: function () { }
        };
    }
    // Check initial condition
    var conditionMatches = evaluateConnectionCondition(connection, whereConnectionHas);
    // Set up change listener
    var changeHandler = function () {
        var previousMatches = conditionMatches;
        conditionMatches = evaluateConnectionCondition(connection, whereConnectionHas);
        if (conditionMatches && !previousMatches) {
            // Connection now matches - process elements
            handleConditionMatch();
        }
        else if (!conditionMatches && previousMatches) {
            // Connection no longer matches - dismount all elements
            handleConditionUnmatch();
        }
    };
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
            observer.dispatchEvent(new Events_js_1.DismountEvent(element, 'connection-failed', init));
        }
    }
    // Listen for connection changes
    connection.addEventListener('change', changeHandler);
    return {
        conditionMatches: conditionMatches,
        cleanup: function () {
            connection.removeEventListener('change', changeHandler);
        }
    };
}
/**
 * Evaluate if the current connection meets the specified conditions
 */
function evaluateConnectionCondition(connection, condition) {
    // Check effectiveType (e.g., 'slow-2g', '2g', '3g', '4g')
    if (condition.effectiveTypeIn && condition.effectiveTypeIn.length > 0) {
        var effectiveType = connection.effectiveType;
        if (!effectiveType || !condition.effectiveTypeIn.includes(effectiveType)) {
            return false;
        }
    }
    // Check downlink (bandwidth in Mbps)
    if (condition.downlinkMin !== undefined) {
        var downlink = connection.downlink;
        if (downlink === undefined || downlink < condition.downlinkMin) {
            return false;
        }
    }
    if (condition.downlinkMax !== undefined) {
        var downlink = connection.downlink;
        if (downlink === undefined || downlink > condition.downlinkMax) {
            return false;
        }
    }
    // Check RTT (round-trip time in ms)
    if (condition.rttMax !== undefined) {
        var rtt = connection.rtt;
        if (rtt === undefined || rtt > condition.rttMax) {
            return false;
        }
    }
    // All conditions passed
    return true;
}
