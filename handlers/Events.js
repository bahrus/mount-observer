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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolvedEvent = exports.MediaUnmatchEvent = exports.MediaMatchEvent = exports.LoadEvent = exports.DisconnectEvent = exports.DismountEvent = exports.MountEvent = exports.resolvedEventName = exports.mediaunmatchEventName = exports.mediamatchEventName = exports.disconnectEventName = exports.dismountEventName = exports.mountEventName = exports.loadEventName = void 0;
// Event name constants
exports.loadEventName = 'load';
exports.mountEventName = 'mount';
exports.dismountEventName = 'dismount';
exports.disconnectEventName = 'disconnect';
exports.mediamatchEventName = 'mediamatch';
exports.mediaunmatchEventName = 'mediaunmatch';
exports.resolvedEventName = 'resolved';
var MountEvent = /** @class */ (function (_super) {
    __extends(MountEvent, _super);
    function MountEvent(mountedElement, modules, mountConfig, mountContext) {
        var _this = _super.call(this, MountEvent.eventName) || this;
        _this.mountedElement = mountedElement;
        _this.modules = modules;
        _this.mountConfig = mountConfig;
        _this.mountContext = mountContext;
        return _this;
    }
    MountEvent.eventName = exports.mountEventName;
    return MountEvent;
}(Event));
exports.MountEvent = MountEvent;
var DismountEvent = /** @class */ (function (_super) {
    __extends(DismountEvent, _super);
    function DismountEvent(mountedElement, reason, mountConfig) {
        var _this = _super.call(this, DismountEvent.eventName) || this;
        _this.mountedElement = mountedElement;
        _this.reason = reason;
        _this.mountConfig = mountConfig;
        return _this;
    }
    DismountEvent.eventName = exports.dismountEventName;
    return DismountEvent;
}(Event));
exports.DismountEvent = DismountEvent;
var DisconnectEvent = /** @class */ (function (_super) {
    __extends(DisconnectEvent, _super);
    function DisconnectEvent(mountedElement, mountConfig) {
        var _this = _super.call(this, DisconnectEvent.eventName) || this;
        _this.mountedElement = mountedElement;
        _this.mountConfig = mountConfig;
        return _this;
    }
    DisconnectEvent.eventName = exports.disconnectEventName;
    return DisconnectEvent;
}(Event));
exports.DisconnectEvent = DisconnectEvent;
var LoadEvent = /** @class */ (function (_super) {
    __extends(LoadEvent, _super);
    function LoadEvent(modules, mountConfig) {
        var _this = _super.call(this, LoadEvent.eventName) || this;
        _this.modules = modules;
        _this.mountConfig = mountConfig;
        return _this;
    }
    LoadEvent.eventName = exports.loadEventName;
    return LoadEvent;
}(Event));
exports.LoadEvent = LoadEvent;
var MediaMatchEvent = /** @class */ (function (_super) {
    __extends(MediaMatchEvent, _super);
    function MediaMatchEvent(mountConfig) {
        var _this = _super.call(this, MediaMatchEvent.eventName) || this;
        _this.mountConfig = mountConfig;
        return _this;
    }
    MediaMatchEvent.eventName = exports.mediamatchEventName;
    return MediaMatchEvent;
}(Event));
exports.MediaMatchEvent = MediaMatchEvent;
var MediaUnmatchEvent = /** @class */ (function (_super) {
    __extends(MediaUnmatchEvent, _super);
    function MediaUnmatchEvent(mountConfig) {
        var _this = _super.call(this, MediaUnmatchEvent.eventName) || this;
        _this.mountConfig = mountConfig;
        return _this;
    }
    MediaUnmatchEvent.eventName = exports.mediaunmatchEventName;
    return MediaUnmatchEvent;
}(Event));
exports.MediaUnmatchEvent = MediaUnmatchEvent;
var ResolvedEvent = /** @class */ (function (_super) {
    __extends(ResolvedEvent, _super);
    function ResolvedEvent(exportValue) {
        var _this = _super.call(this, ResolvedEvent.eventName) || this;
        _this.export = exportValue;
        return _this;
    }
    ResolvedEvent.eventName = exports.resolvedEventName;
    return ResolvedEvent;
}(Event));
exports.ResolvedEvent = ResolvedEvent;
