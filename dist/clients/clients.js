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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "inversify", "./clientInstance", "systeminformation", "../global/EventHandlingMixin", "../global/EventHandlingManager"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var inversify_1 = require("inversify");
    var clientI = __importStar(require("./clientInstance"));
    var systeminformation_1 = __importDefault(require("systeminformation"));
    var eH = __importStar(require("../global/EventHandlingMixin"));
    var eM = __importStar(require("../global/EventHandlingManager"));
    var Clients = /** @class */ (function () {
        function Clients(clientsInstance, eMInstance) {
            this._clients = clientsInstance || {}; // Initialize if needed
            this.eM = eMInstance;
        }
        Clients.prototype.addClient = function (id, ip, type) {
            var typeFinal;
            switch (type) {
                case 'admin':
                    typeFinal = clientI.ClientType.Admin;
                    break;
                case 'server':
                    typeFinal = clientI.ClientType.Server;
                    break;
                default:
                    typeFinal = clientI.ClientType.Basic;
            }
            //public create(newID: string, newIP: string, type: ClientType): void {
            var newClientInfo = { id: id, ip: ip, type: typeFinal };
            var newResult = { errCode: -1 };
            try {
                var newClient = clientI.clientWrapper.createClient(newClientInfo);
                this._clients[id] = newClient;
                newResult = { errCode: 0 };
            }
            catch (e) {
                newResult = { errCode: 2, message: 'create client failed', data: e };
            }
            var newEvent = {
                types: [eH.MainEventTypes.CLIENTS],
                message: 'Create client event',
                success: newResult.errCode == 0 ? true : false,
                data: newClientInfo,
                clientsEvent: { subTypes: [eH.SubEventTypes.CLIENTS.CREATED], id: newClientInfo.id, ip: newClientInfo.ip, clientType: newClientInfo.type }
            };
            this.eM.emit(eH.SubEventTypes.CLIENTS.CREATE, newEvent);
        };
        // public updateClientConfig(id: string, info: IClientInfo): void {
        //   const newClientInfo: IClientInfo = { id: id, ip: ip, type: typeFinal };
        //   const client = this._clients[id];
        //   if (client) {
        //     client.info.type = type;
        //     client._stats.eventCount++;
        //     client._stats.lastUpdates.updateConfig = Date.now();
        //   }
        // }
        Clients.prototype.updateClientSettings = function (id, settings) {
            var client = this._clients[id];
            if (client) {
                client._clientSettings = __assign({}, settings); // Update settings
                client._stats.eventCount++;
                client._stats.lastUpdates.updateSettings = Date.now();
            }
        };
        Clients.prototype.updateClientStats = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var client, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            client = this._clients[id];
                            if (!client) return [3 /*break*/, 2];
                            _a = client._stats;
                            return [4 /*yield*/, systeminformation_1.default.inetLatency(client.info.ip)];
                        case 1:
                            _a.latency = _b.sent();
                            client._stats.eventCount++;
                            client._stats.lastUpdates['getClientLatency'] = Date.now();
                            this.eM.emit("updateClientStats" + id);
                            _b.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        Clients.prototype.removeClient = function (clientId) {
            delete this._clients[clientId];
        };
        Clients.prototype.getClient = function (clientId) {
            return this._clients[clientId];
        };
        Clients = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(clientI.CLIENTS_WRAPPER_TOKEN)),
            __param(1, (0, inversify_1.inject)(eM.EVENT_MANAGER_TOKEN)),
            __metadata("design:paramtypes", [Object, eM.eventManager])
        ], Clients);
        return Clients;
    }());
    exports.default = Clients;
});
