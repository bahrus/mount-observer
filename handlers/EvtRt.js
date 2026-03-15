"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _EvtRt_ac;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvtRt = void 0;
var Events_js_1 = require("./Events.js");
var MountObserver_js_1 = require("./MountObserver.js");
var EvtRt = /** @class */ (function () {
    function EvtRt(mountedElement, ctx) {
        _EvtRt_ac.set(this, void 0);
        var observer = ctx.observer, mountConfig = ctx.mountConfig;
        __classPrivateFieldSet(this, _EvtRt_ac, new AbortController(), "f");
        var et = observer.getNotifier(mountedElement);
        et.addEventListener(Events_js_1.mountEventName, this, { signal: __classPrivateFieldGet(this, _EvtRt_ac, "f").signal });
        et.addEventListener(Events_js_1.disconnectEventName, this, { signal: __classPrivateFieldGet(this, _EvtRt_ac, "f").signal });
        et.addEventListener(Events_js_1.dismountEventName, this, { signal: __classPrivateFieldGet(this, _EvtRt_ac, "f").signal });
        this.mount(mountedElement, mountConfig, ctx);
    }
    EvtRt.prototype.abort = function () {
        __classPrivateFieldGet(this, _EvtRt_ac, "f").abort();
    };
    EvtRt.prototype.mount = function (mountedElement, mountConfig, context) {
        console.log({ mountedElement: mountedElement, mountConfig: mountConfig, context: context });
    };
    EvtRt.prototype.disconnect = function (mountedElement, mountConfig) {
        console.log({ mountedElement: mountedElement, mountConfig: mountConfig });
    };
    EvtRt.prototype.dismount = function (mountedElement, mountConfig) {
        console.log({ mountedElement: mountedElement, mountConfig: mountConfig });
    };
    EvtRt.prototype.handleEvent = function (evt) {
        if (evt instanceof Events_js_1.MountEvent) {
            var mountedElement = evt.mountedElement, mountContext = evt.mountContext, mountConfig = evt.mountConfig;
            this.mount(mountedElement, mountConfig, mountContext);
        }
        else if (evt instanceof Events_js_1.DismountEvent) {
            var mountedElement = evt.mountedElement, mountConfig = evt.mountConfig;
            this.dismount(mountedElement, mountConfig);
        }
        else if (evt instanceof Events_js_1.DisconnectEvent) {
            var mountedElement = evt.mountedElement, mountConfig = evt.mountConfig;
            this.disconnect(mountedElement, mountConfig);
        }
    };
    return EvtRt;
}());
exports.EvtRt = EvtRt;
_EvtRt_ac = new WeakMap();
MountObserver_js_1.MountObserver.define('builtIns.logToConsole', EvtRt);
