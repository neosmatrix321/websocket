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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "https", "fs", "../global/EventHandlingMixin", "ws", "../clients/clientInstance", "inversify", "./serverInstance", "../settings/settingsInstance", "../global/EventHandlingMixin", "../global/EventHandlingManager", "../clients/clients"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serverType = void 0;
    var https_1 = require("https");
    var fs_1 = require("fs");
    var EventHandlingMixin_1 = require("../global/EventHandlingMixin");
    var ws_1 = require("ws");
    var clientInstance_1 = require("../clients/clientInstance");
    var inversify_1 = require("inversify");
    var serverInstance_1 = require("./serverInstance");
    var settingsInstance_1 = require("../settings/settingsInstance");
    var eH = __importStar(require("../global/EventHandlingMixin"));
    var eM = __importStar(require("../global/EventHandlingManager"));
    var clients_1 = require("../clients/clients");
    var serverType;
    (function (serverType) {
        serverType[serverType["listen"] = 0] = "listen";
        serverType[serverType["clientConnected"] = 1] = "clientConnected";
        serverType[serverType["clientMessageReady"] = 2] = "clientMessageReady";
        serverType[serverType["clientDisconnected"] = 3] = "clientDisconnected";
    })(serverType = exports.serverType || (exports.serverType = {}));
    var BaseServerEvent = /** @class */ (function () {
        function BaseServerEvent() {
            this["cat"] = eH.catType.server;
        }
        return BaseServerEvent;
    }());
    function isMyWebSocketWithId(ws) {
        return 'id' in ws;
    }
    var Server = /** @class */ (function (_super) {
        __extends(Server, _super);
        function Server() {
            var _this = _super.call(this) || this;
            _this._server._handle.web = ;
            _this._server._handle.file = new ws_1.WebSocketServer({ noServer: true });
            _this.setupWebSocketListeners();
            return _this;
        }
        Server.prototype.setupWebSocketListeners = function () {
            this._server._handle.web.on('connection', this.handleConnection.bind(this));
            this._server._handle.web.on('close', this.handleClose.bind(this));
            // ... Add listeners for other WebSocketServer events if needed
        };
        Server.prototype.createServer = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _serverCert;
                var _this = this;
                return __generator(this, function (_a) {
                    try {
                        _serverCert = (0, https_1.createServer)({
                            cert: (0, fs_1.readFileSync)(this._server._settings.certPath),
                            key: (0, fs_1.readFileSync)(this._server._settings.keyPath)
                        });
                        _serverCert.on('upgrade', function (request, socket, head) {
                            //  ... adjust upgrade handling as needed ...
                            _this._server._handle.web.handleUpgrade(request, socket, head, function (client, request) {
                                var webSocketStream = (0, ws_1.createWebSocketStream)(client);
                                webSocketStream.on('data', function (data) {
                                    try {
                                        var message = JSON.parse(data.toString());
                                        console.log("connected:", message);
                                    }
                                    catch (error) {
                                        console.error("Error parsing message:", error);
                                    }
                                });
                                _this.emitConnection(webSocketStream, request); // Adapt emitConnection if needed 
                            });
                        });
                        _serverCert.listen(this._server._settings.streamServerPort, this._server._settings.ip, function () {
                            console.log("HTTPS server ".concat(_this._server._settings.ip, " listening on ").concat(_this._server._settings.streamServerPort));
                            _this.emit('serverCreated');
                        });
                    }
                    catch (err) {
                        console.error("Error creating server:", err);
                        this.emit('serverCreated', { 'err': err });
                    }
                    return [2 /*return*/];
                });
            });
        };
        Server.prototype.createTimer = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Interval function moved here
                            // this.stats.updateAndGetPidIfNecessary();
                            this.emit('createTimer');
                            this._server._handle.web.clients.forEach(function (ws_client) {
                                if (isMyWebSocketWithId(ws_client)) {
                                    var client = _this._clients[ws_client.id];
                                    if (client._config.type === clientInstance_1.ClientType.Admin) {
                                        console.log(client._config.type);
                                    }
                                    if (ws_client.readyState === ws_client.OPEN) {
                                        if (_this._clients[ws_client.id]) {
                                            console.error("No Client with ID: ".concat(ws_client.id, " known"));
                                        }
                                        var time_diff = (Date.now() - ws_client.now);
                                        console.log("admin(" + ws_client.admin + ") sending to ip(" + _this._clients[ws_client.id].info.ip + ") alive(" + ws_client.readyState + ") count(" + _this._clients[ws_client.id]._stats.clientsCounter + ") connected(" + _this.stats.connectedClients + ") latency_user(" + _this._clients[ws_client.id]._stats.latency_user + ") latency_google(" + _this.stats.latencyGoogle + ") connected since(" + _this.stats.lastUpdates.web + ") diff(" + time_diff + ")");
                                        if (time_diff > 20000) {
                                            _this.eM.emit(clients_1.clientsType.statsUpdated, {
                                                clientId: ws_client.id,
                                                latency: time_diff,
                                                // ... more data 
                                            });
                                        }
                                    }
                                }
                            });
                            return [4 /*yield*/, this.statsService.updateAllStats()];
                        case 1:
                            _a.sent(); // Get updated stats
                            this.eM.emit('statsUpdated', this.statsService.stats);
                            return [2 /*return*/];
                    }
                });
            });
        };
        Server.prototype.handleUpgrade = function (request, socket, head, callback) {
            this._server._handle.web.handleUpgrade(request, socket, head, callback);
        };
        Server.prototype.emitConnection = function (ws, request) {
            this._server._handle.web.emit('connection', ws, request);
            globalEventEmitter.emit('clientConnected', ws);
        };
        Server.prototype.destroyClient = function (ip) {
            // Implement the logic to destroy a client
        };
        __decorate([
            (0, inversify_1.inject)(serverInstance_1.SERVER_WRAPPER_TOKEN),
            __metadata("design:type", Object)
        ], Server.prototype, "_server", void 0);
        __decorate([
            (0, inversify_1.inject)(settingsInstance_1.PRIVATE_SETTINGS_TOKEN),
            __metadata("design:type", Object)
        ], Server.prototype, "_settings", void 0);
        __decorate([
            (0, inversify_1.inject)(eM.EVENT_MANAGER_TOKEN),
            __metadata("design:type", eM.eventManager)
        ], Server.prototype, "eM", void 0);
        Server = __decorate([
            (0, inversify_1.injectable)(),
            __metadata("design:paramtypes", [])
        ], Server);
        return Server;
    }((0, EventHandlingMixin_1.EventEmitterMixin)(BaseServerEvent)));
    exports.default = Server;
});
