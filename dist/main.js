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
        define(["require", "exports", "reflect-metadata", "inversify", "./settings/settingsInstance.js", "https", "./global/EventHandlingManager", "./global/EventHandlingMixin", "./stats/stats", "./stats/statsInstance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainType = void 0;
    require("reflect-metadata");
    var inversify_1 = require("inversify");
    var settingsInstance_js_1 = require("./settings/settingsInstance.js");
    var https_1 = require("https");
    var eM = __importStar(require("./global/EventHandlingManager"));
    var eH = __importStar(require("./global/EventHandlingMixin"));
    var statsMain = __importStar(require("./stats/stats"));
    var statsI = __importStar(require("./stats/statsInstance"));
    var MainType;
    (function (MainType) {
        MainType[MainType["timerCreated"] = 0] = "timerCreated";
        MainType[MainType["timerStarted"] = 1] = "timerStarted";
        MainType[MainType["timerStopped"] = 2] = "timerStopped";
    })(MainType = exports.MainType || (exports.MainType = {}));
    var BaseMainEvent = /** @class */ (function () {
        function BaseMainEvent() {
            this["cat"] = eH.catType.main;
        }
        return BaseMainEvent;
    }());
    var Main = /** @class */ (function (_super) {
        __extends(Main, _super);
        function Main() {
            var _this = _super.call(this) || this;
            _this.initialize();
            _this.on('serverCreated', _this.gatherAndSendStats);
            return _this;
        }
        Main.prototype.initialize = function () {
            return __awaiter(this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log(this);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, https_1.Server.createServer()];
                        case 2:
                            _a.sent();
                            this._server.on('connection', this.handleConnection.bind(this));
                            this.setupGlobalEventListeners();
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            console.error("Main Initialization Error: ", err_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        Main.prototype.handleConnection = function (ws) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.stats.clientsCounter++;
                    // const client1 = new Client({ /* Client Data */ });
                    // // Add clients to the container
                    // clientsContainer.addClient(client1);
                    this.handleGreeting(ws, 'greeting'); // Integrate with your client management 
                    this.setupWebSocketEvents(ws);
                    this.startIntervalIfNeeded();
                    return [2 /*return*/];
                });
            });
        };
        Main.prototype.handleWebSocketMessage = function (ws, data, isBinary) {
            return __awaiter(this, void 0, void 0, function () {
                var decodedData, messageObject;
                return __generator(this, function (_a) {
                    decodedData = Buffer.from(data, 'base64').toString();
                    messageObject = JSON.parse(decodedData);
                    if (messageObject.type) {
                        switch (messageObject.type) {
                            case 'greeting':
                                this.handleGreeting(ws, messageObject);
                                break;
                            // Add other cases for message types 
                            default:
                                console.log("Unknown message type");
                        }
                    }
                    return [2 /*return*/];
                });
            });
        };
        Main.prototype.handleGreeting = function (client, obj) {
            return __awaiter(this, void 0, void 0, function () {
                var newIP, type, newIP_1, newID, type_1, ID;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            newIP = client.socket.remoteAddress;
                            type = 'basic';
                            if (!isMyWebSocketWithId(client)) {
                                this.stats.clientsCounter++;
                                newIP_1 = client.socket.remoteAddress;
                                newID = this.stats.clientsCounter;
                                type_1 = 'basic';
                                this._clients.addClient(newIP_1, newID, type_1);
                            }
                            if (!isMyWebSocketWithId(client)) return [3 /*break*/, 2];
                            ID = client.id;
                            // this._clients[client.info.id]._config.type = ClientType.Admin; // Update isAdmin
                            return [4 /*yield*/, this._clients.updateClientStats(this._clients[ID])];
                        case 1:
                            // this._clients[client.info.id]._config.type = ClientType.Admin; // Update isAdmin
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            console.error("Could not create Client " + newIP);
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        Main.prototype.handleMessage = function (ws, data, isBinary) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log('dummy');
                    return [2 /*return*/];
                });
            });
        };
        Main.prototype.handleClose = function (ws, code) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
                            return [4 /*yield*/, this._clients.removeClient(ws.id)];
                        case 1:
                            _a.sent(); // Assuming you have removeClient
                            this._server._handle.web.destroyClient(ws.ip); // If applicable
                            ws.terminate();
                            this.startIntervalIfNeeded();
                            return [2 /*return*/];
                    }
                });
            });
        };
        Main.prototype.startIntervalIfNeeded = function () {
            var _this = this;
            if (this.stats.clientsCounter > 0 && !this.stats.interval_sendinfo) {
                this.stats.interval_sendinfo = setInterval(function () {
                    _this.gatherAndSendStats();
                }, 1000);
            }
        };
        Main.prototype.gatherAndSendStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var updatedStats;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._systemMonitor.getUpdatedStats()];
                        case 1:
                            updatedStats = _a.sent();
                            this.updateGlobalStats(updatedStats);
                            this._clients.forEach(function (client) {
                                if (client.readyState === client.OPEN) {
                                    // . detailed logic to build and send the stats payload.
                                    client.send('client aagdssdaf');
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        };
        __decorate([
            (0, inversify_1.inject)(statsMain.GLOBAL_STATS_TOKEN),
            __metadata("design:type", Object)
        ], Main.prototype, "stats", void 0);
        __decorate([
            (0, inversify_1.inject)(settingsInstance_js_1.PRIVATE_SETTINGS_TOKEN),
            __metadata("design:type", Object)
        ], Main.prototype, "_settings", void 0);
        __decorate([
            (0, inversify_1.inject)(eM.EVENT_MANAGER_TOKEN),
            __metadata("design:type", eM.eventManager)
        ], Main.prototype, "eM", void 0);
        Main = __decorate([
            (0, inversify_1.injectable)(),
            __metadata("design:paramtypes", [])
        ], Main);
        return Main;
    }(eH.EventEmitterMixin(BaseMainEvent)));
    exports.default = Main;
});
// Instantiate the main object to start your application
