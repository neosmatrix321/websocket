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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../clients"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var clients_1 = __importDefault(require("../clients"));
    var uniqueClient = /** @class */ (function (_super) {
        __extends(uniqueClient, _super);
        function uniqueClient(id, settings, Client) {
            var _this = _super.call(this, Client) || this;
            _this.uniqueClient = {
                id: id,
                settings: settings,
                stats: __assign({}, defaultClientStats),
                eventCount: 0,
                lastUpdates: { create: Date.now() },
                // Other client-specific properties
            };
            return _this;
        }
        uniqueClient.prototype.updateSettings = function (settings) {
            this.uniqueClient.settings = __assign({}, settings); // Update settings with spread
            this.uniqueClient.eventCount++;
            this.uniqueClient.lastUpdates.updateSettings = Date.now();
        };
        uniqueClient.prototype.updateConfig = function (config) {
            if (config !== '{}') {
                // Update logic if needed
                this.uniqueClient.eventCount++;
                this.uniqueClient.lastUpdates.updateConfig = Date.now();
            }
        };
        return uniqueClient;
    }(clients_1.default));
    exports.default = uniqueClient;
});
