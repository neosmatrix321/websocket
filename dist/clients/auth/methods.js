(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../client/clientInstance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicClient = exports.AdvancedClient = void 0;
    var clientInstance_1 = require("../client/clientInstance");
    var AdvancedClient = /** @class */ (function () {
        function AdvancedClient(id, settings) {
            this.type = clientInstance_1.ClientType.Advanced;
            this.id = id;
            this.settings = settings;
            this.stats = {};
        }
        AdvancedClient.prototype.connect = function () {
            // Implementiere die erweiterte Verbindungslogik
        };
        AdvancedClient.prototype.disconnect = function () {
            // Implementiere die erweiterte Trennungslogik
        };
        AdvancedClient.prototype.sendMessage = function (message) {
            // Implementiere die Nachrichtenversandlogik
        };
        AdvancedClient.prototype.receiveMessage = function (message) {
            // Implementiere die Nachrichtenempfangslogik
        };
        return AdvancedClient;
    }());
    exports.AdvancedClient = AdvancedClient;
    var BasicClient = /** @class */ (function () {
        function BasicClient(id, settings) {
            this.type = clientInstance_1.ClientType.Basic;
            this.id = id;
            this.settings = settings;
            this.stats = {};
        }
        BasicClient.prototype.connect = function () {
            // Implementiere die Verbindungslogik
        };
        BasicClient.prototype.disconnect = function () {
            // Implementiere die Trennungslogik
        };
        return BasicClient;
    }());
    exports.BasicClient = BasicClient;
});
