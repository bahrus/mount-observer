"use strict";
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
exports.emitMountedElementEvents = emitMountedElementEvents;
/**
 * Emits events from a mounted element based on the mountedElemEmits configuration.
 * This module is dynamically loaded only when mountedElemEmits is configured.
 */
function emitMountedElementEvents(element, MountConfig, processedEventsForElement) {
    return __awaiter(this, void 0, void 0, function () {
        var configs, _i, configs_1, config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configs = Array.isArray(MountConfig.mountedElemEmits)
                        ? MountConfig.mountedElemEmits
                        : [MountConfig.mountedElemEmits];
                    _i = 0, configs_1 = configs;
                    _a.label = 1;
                case 1:
                    if (!(_i < configs_1.length)) return [3 /*break*/, 4];
                    config = configs_1[_i];
                    return [4 /*yield*/, emitSingleEvent(element, MountConfig, config, processedEventsForElement)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function emitSingleEvent(element, MountConfig, config, processedEventsForElement) {
    return __awaiter(this, void 0, void 0, function () {
        var eventId, processedEvents, EventCtor, processedArgs, event, options, assignGingerly, processedProps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check if this event should only fire once per element
                    if (config.oncePerMountedElement) {
                        eventId = getEventId(config);
                        processedEvents = processedEventsForElement.get(element);
                        if (!processedEvents) {
                            processedEvents = new Set();
                            processedEventsForElement.set(element, processedEvents);
                        }
                        if (processedEvents.has(eventId)) {
                            return [2 /*return*/]; // Already emitted for this element
                        }
                        processedEvents.add(eventId);
                    }
                    EventCtor = resolveEventConstructor(config.event);
                    processedArgs = config.args !== undefined
                        ? processMagicStrings(config.args, element, MountConfig)
                        : undefined;
                    if (processedArgs === undefined) {
                        event = new EventCtor();
                    }
                    else if (Array.isArray(processedArgs)) {
                        // For array args, ensure bubbles is set if second arg is an options object
                        if (processedArgs.length === 2 && typeof processedArgs[0] === 'string' && typeof processedArgs[1] === 'object' && processedArgs[1] !== null) {
                            options = __assign({ bubbles: true }, processedArgs[1]);
                            event = new EventCtor(processedArgs[0], options);
                        }
                        else {
                            event = new (EventCtor.bind.apply(EventCtor, __spreadArray([void 0], processedArgs, false)))();
                        }
                    }
                    else {
                        // Single arg - if it's a string (event name), add bubbles: true by default
                        if (typeof processedArgs === 'string') {
                            event = new EventCtor(processedArgs, { bubbles: true });
                        }
                        else {
                            event = new EventCtor(processedArgs);
                        }
                    }
                    if (!config.eventProps) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('assign-gingerly/assignGingerly.js'); })];
                case 1:
                    assignGingerly = (_a.sent()).assignGingerly;
                    processedProps = processMagicStrings(config.eventProps, element, MountConfig);
                    assignGingerly(event, processedProps);
                    _a.label = 2;
                case 2:
                    // Dispatch the event from the mounted element
                    element.dispatchEvent(event);
                    return [2 /*return*/];
            }
        });
    });
}
function resolveEventConstructor(event) {
    if (typeof event === 'string') {
        var EventCtor = globalThis[event];
        if (!EventCtor || typeof EventCtor !== 'function') {
            throw new Error("Event constructor \"".concat(event, "\" not found in globalThis"));
        }
        return EventCtor;
    }
    return event;
}
function getEventId(config) {
    var eventName = typeof config.event === 'string' ? config.event : config.event.name;
    var argsStr = JSON.stringify(config.args || '');
    return "".concat(eventName, ":").concat(argsStr);
}
function processMagicStrings(value, element, MountConfig) {
    if (typeof value === 'string') {
        if (value === '{{mountedElement}}') {
            return element;
        }
        if (value === '{{MountConfig}}') {
            return MountConfig;
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(function (item) { return processMagicStrings(item, element, MountConfig); });
    }
    if (value && typeof value === 'object') {
        var processed = {};
        for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], val = _b[1];
            processed[key] = processMagicStrings(val, element, MountConfig);
        }
        return processed;
    }
    return value;
}
