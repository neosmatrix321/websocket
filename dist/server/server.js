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
        define(["require", "exports", "https", "fs", "ws", "inversify", "../global/EventHandlingMixin", "../global/EventHandlingManager", "../server/serverInstance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var https_1 = require("https");
    var fs_1 = require("fs");
    var ws_1 = require("ws");
    var inversify_1 = require("inversify");
    var eH = __importStar(require("../global/EventHandlingMixin"));
    var eM = __importStar(require("../global/EventHandlingManager"));
    var serverI = __importStar(require("../server/serverInstance"));
    var Server = /** @class */ (function () {
        function Server() {
            this._server._handle.file = new ws_1.WebSocketServer({ noServer: true });
        }
        Server.prototype.isMyWebSocketWithId = function (ws) {
            return 'id' in ws;
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
                            _this.eV.emit('serverCreated');
                        });
                    }
                    catch (error) {
                        console.error("Error creating server:", error);
                        this.eV.handleError(new Error('Error creating server'), error);
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
                            this.eV.emit('createTimer');
                            this._server._handle.web.clients.forEach(function (ws_client) {
                                if (!_this.isMyWebSocketWithId(ws_client)) {
                                    _this.eV.emit(eH.MainEventTypes.WS, ws_client);
                                }
                                if (_this.isMyWebSocketWithId(ws_client)) {
                                    if (ws_client.readyState === ws_client.OPEN) {
                                        if (!ws_client.id) {
                                            console.error("No Client with ID: ".concat(ws_client.id, " known"));
                                        }
                                        if (time_diff > 20000) {
                                            _this.eV.emit(eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, ws_client.id);
                                        }
                                    }
                                }
                            });
                            return [4 /*yield*/, this.statsService.updateAllStats()];
                        case 1:
                            _a.sent(); // Get updated stats
                            this.eV.emit('statsUpdated', this.statsService.stats);
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
            (0, inversify_1.inject)(serverI.SERVER_WRAPPER_TOKEN),
            __metadata("design:type", Object)
        ], Server.prototype, "_server", void 0);
        __decorate([
            (0, inversify_1.inject)(eM.EVENT_MANAGER_TOKEN),
            __metadata("design:type", eM.eventManager)
        ], Server.prototype, "eV", void 0);
        Server = __decorate([
            (0, inversify_1.injectable)(),
            __metadata("design:paramtypes", [])
        ], Server);
        return Server;
    }());
    exports.default = Server;
});
