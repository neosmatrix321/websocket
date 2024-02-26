(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clientWrapper = exports.ClientType = void 0;
    var ClientType;
    (function (ClientType) {
        ClientType[ClientType["Basic"] = 0] = "Basic";
        ClientType[ClientType["Admin"] = 1] = "Admin";
        ClientType[ClientType["Server"] = 2] = "Server";
        // ...
    })(ClientType = exports.ClientType || (exports.ClientType = {}));
    // client.ts
    var clientWrapper = /** @class */ (function () {
        function clientWrapper(newID, newIP) {
            this.info = { id: newID, ip: newIP };
        }
        clientWrapper.prototype.connect = function () {
            console.log('lets connect!');
        };
        clientWrapper.prototype.disconnect = function () {
            return;
        };
        clientWrapper.prototype.update = function () {
            return;
        };
        clientWrapper.prototype.sendMessage = function (message) {
            return;
        };
        clientWrapper.prototype.receiveMessage = function (message, data) {
            return;
        };
        return clientWrapper;
    }());
    exports.clientWrapper = clientWrapper;
});
