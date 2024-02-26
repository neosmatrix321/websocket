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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "inversify", "../global/globalEventHandling", "./client/clientInstance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLIENTS_WRAPPER_TOKEN = void 0;
    var inversify_1 = require("inversify");
    var globalEventHandling_1 = require("../global/globalEventHandling");
    var clientInstance_1 = require("./client/clientInstance");
    exports.CLIENTS_WRAPPER_TOKEN = Symbol('Clients');
    var MyClass = /** @class */ (function () {
        function MyClass() {
        }
        return MyClass;
    }());
    var MyClassWithMixin = (0, globalEventHandling_1.EventEmitterMixin)(MyClass);
    var globalEventEmitter = new MyClassWithMixin();
    var Clients = /** @class */ (function (_super) {
        __extends(Clients, _super);
        function Clients(statsInstance) {
            var _this = _super.call(this) || this;
            _this._clients = {}; // Clients dictionary
            _this._clients = {}; // Initialize if needed
            return _this;
        }
        Clients.prototype.addClient = function (id, ip) {
            this._clients[id] = clientInstance_1.clientWrapper.create(id, ip); // Use index notation
            globalEventEmitter.emit("addClient " + id + " ip: " + ip);
        };
        Clients.prototype.updateClientStats = function (id) {
            this._clients[id].stats = this._clients[id].getClientLatency(); // Assume getClientLatency returns stats
            globalEventEmitter.emit("updateClientStats" + id);
        };
        Clients.prototype.updateClient = function (id, settings) {
            var client = this._clients[id];
            if (client) {
                client.updateSettings(settings); // Use existing method
                globalEventEmitter.emit("updateClient" + id);
            }
        };
        Clients.prototype.removeClient = function (id) {
            delete this._clients[id];
            globalEventEmitter.emit("removeClient" + id);
        };
        Clients = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(exports.CLIENTS_WRAPPER_TOKEN)),
            __metadata("design:paramtypes", [Object])
        ], Clients);
        return Clients;
    }((0, globalEventHandling_1.EventEmitterMixin)(Object)));
    exports.default = Clients;
});
