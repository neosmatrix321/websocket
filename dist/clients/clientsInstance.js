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
        define(["require", "exports", "reflect-metadata", "inversify"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CLIENTS_WRAPPER_TOKEN = exports.clientsWrapper = void 0;
    require("reflect-metadata");
    var inversify_1 = require("inversify");
    var clientsWrapper = /** @class */ (function () {
        function clientsWrapper(clientsInstance) {
            this._clients = clientsInstance !== null && clientsInstance !== void 0 ? clientsInstance : new Map();
        }
        clientsWrapper.prototype.addClient = function (client) {
            if (!client.info || !client.info.id) {
                throw new Error('Client is missing an ID');
            }
            this._clients.set(client.info.id, client);
        };
        clientsWrapper.prototype.removeClient = function (clientId) {
            this._clients.delete(clientId);
        };
        clientsWrapper.prototype.getClient = function (clientId) {
            return this._clients.get(clientId);
        };
        clientsWrapper.prototype.getAllClients = function () {
            return Array.from(this._clients.values());
        };
        clientsWrapper = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(exports.CLIENTS_WRAPPER_TOKEN)),
            __param(0, (0, inversify_1.optional)()),
            __metadata("design:paramtypes", [Map])
        ], clientsWrapper);
        return clientsWrapper;
    }());
    exports.clientsWrapper = clientsWrapper;
    exports.CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
});
