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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "events"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventEmitterMixin = void 0;
    var events_1 = require("events");
    var EventEmitterMixin = function (BaseClass) {
        return /** @class */ (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var _this = _super.apply(this, args) || this;
                _this._events = new Map(); // Internal Map ;
                _this._emitter = new events_1.EventEmitter();
                _this._events = new Map([]); // Internal Map 
                return _this;
            }
            class_1.prototype.on = function (event, listener) {
                var _a, _b;
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_c) {
                        if (!this._events.has(event)) {
                            this._events.set(event, []);
                        }
                        (_b = (_a = this._events) === null || _a === void 0 ? void 0 : _a.get(event)) === null || _b === void 0 ? void 0 : _b.push(listener);
                        return [2 /*return*/];
                    });
                });
            };
            class_1.prototype.prepend = function (event, listener) {
                var _a, _b;
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_c) {
                        console.log("prepend Event ", this._events, event);
                        (_b = (_a = this._events) === null || _a === void 0 ? void 0 : _a.get(event)) === null || _b === void 0 ? void 0 : _b.push(listener);
                        return [2 /*return*/];
                    });
                });
            };
            class_1.prototype.off = function (event, listener) {
                var _a, _b;
                return __awaiter(this, void 0, void 0, function () {
                    var listeners;
                    return __generator(this, function (_c) {
                        if (this._events.has(event)) {
                            listeners = (_b = (_a = this._events) === null || _a === void 0 ? void 0 : _a.get(event)) === null || _b === void 0 ? void 0 : _b.filter(function (cb) { return cb !== listener; });
                            if (listeners)
                                this._events.set(event, listeners);
                        }
                        return [2 /*return*/];
                    });
                });
            };
            class_1.prototype.emit = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(this._events.has(event) && Array.isArray(this._events.get(event)))) return [3 /*break*/, 2];
                                return [4 /*yield*/, Promise.all(this._events.get(event).map(function (listener) { return listener.apply(void 0, args); }))];
                            case 1:
                                _a.sent(); // Confident use! 
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                });
            };
            class_1.prototype.emitCustomEvent = function (event) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        this.emit.apply(this, __spreadArray([event], args, false));
                        return [2 /*return*/];
                    });
                });
            };
            return class_1;
        }(BaseClass));
    };
    exports.EventEmitterMixin = EventEmitterMixin;
});
