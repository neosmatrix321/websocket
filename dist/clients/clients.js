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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../global/globalEventHandling", "./client/manageClient", "./client/updateClient"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClientsInstance = void 0;
    var globalEventHandling_1 = require("../global/globalEventHandling");
    var manageClient_1 = __importDefault(require("./client/manageClient"));
    var updateClient_1 = __importDefault(require("./client/updateClient"));
    var MyClass = /** @class */ (function () {
        function MyClass() {
        }
        return MyClass;
    }());
    var MyClassWithMixin = (0, globalEventHandling_1.EventEmitterMixin)(MyClass);
    var globalEventEmitter = new MyClassWithMixin();
    var Clients = /** @class */ (function (_super) {
        __extends(Clients, _super);
        function Clients() {
            var _this = _super.call(this) || this;
            _this._clients = {}; // Clients dictionary
            _this._clients = undefined; // Initialize if needed
            return _this;
        }
        Clients.prototype.addClient = function (id, settings) {
            var newUniqueClient = new manageClient_1.default(id, settings, this); // Pass 'this' for reference
            this._clients[id] = newUniqueClient; // Use index notation
            globalEventEmitter.emit("addClient", id);
        };
        Clients.prototype.updateClientStats = function (id) {
            var newClientStats = new updateClient_1.default(this._clients[id]); // Get client by id
            this._clients[id].stats = newClientStats.getClientLatency(); // Assume getClientLatency returns stats
            globalEventEmitter.emit("updateClientStats", id);
        };
        Clients.prototype.updateClient = function (id, settings) {
            var client = this._clients[id];
            if (client) {
                client.updateSettings(settings); // Use existing method
                globalEventEmitter.emit("updateClient", id);
            }
        };
        Clients.prototype.removeClient = function (id) {
            globalStats.getInstance().stats.connectedClients--;
            delete this._clients[id];
            globalEventEmitter.emit("removeClient", id);
        };
        Clients.getInstance = function () {
            if (!Clients.instance) {
                Clients.instance = new Clients();
            }
            return Clients.instance;
        };
        return Clients;
    }((0, globalEventHandling_1.EventEmitterMixin)(Object)));
    exports.default = Clients;
    exports.ClientsInstance = Clients.getInstance();
});
