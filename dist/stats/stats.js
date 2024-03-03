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
        define(["require", "exports", "reflect-metadata", "node:fs/promises", "inversify", "pidusage", "systeminformation", "../global/EventHandlingMixin", "../stats/statsInstance", "../settings/settingsInstance"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.statsType = exports.GLOBAL_STATS_TOKEN = void 0;
    require("reflect-metadata");
    var promises_1 = require("node:fs/promises");
    var inversify_1 = require("inversify");
    var pidusage_1 = __importDefault(require("pidusage"));
    var systeminformation_1 = __importDefault(require("systeminformation"));
    var eH = __importStar(require("../global/EventHandlingMixin"));
    var S = __importStar(require("../stats/statsInstance"));
    var pS = __importStar(require("../settings/settingsInstance"));
    var PRIVATE_SETTINGS_TOKEN = Symbol('PrivateSettings');
    exports.GLOBAL_STATS_TOKEN = Symbol('GlobalStats');
    var statsType;
    (function (statsType) {
        statsType[statsType["update"] = 0] = "update";
        statsType[statsType["updated"] = 1] = "updated";
    })(statsType = exports.statsType || (exports.statsType = {}));
    var BaseStatsEvent = /** @class */ (function () {
        function BaseStatsEvent() {
            this["cat"] = eH.catType.stats;
        }
        return BaseStatsEvent;
    }());
    var Stats = /** @class */ (function (_super) {
        __extends(Stats, _super);
        function Stats(statsInstance, settingsInstance) {
            var _this = _super.call(this) || this;
            _this.stats = statsInstance || {
                webHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
                fileHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
                clientsCounter: 0,
                activeClients: 0,
                latencyGoogle: null,
                si: { cpu: null, memory: null, ppid: null, pid: null, ctime: null, elapsed: null, timestamp: null },
                pu: { proc: null, pid: null, pids: null, cpu: null, mem: null },
                rcon: {},
                lastUpdates: {},
                clients: {},
                interval_sendinfo: false
            };
            _this._settings = settingsInstance;
            _this.updateAllStats();
            return _this;
        }
        Stats.prototype.updateAllStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            this.stats.lastUpdates["createstatContainer"] = Date.now();
                            return [4 /*yield*/, this.updateAndGetPidIfNecessary()];
                        case 1:
                            _a.sent(); // Fetch PID if needed
                            return [4 /*yield*/, this.comparePids()];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.getLatencyGoogle()];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.getSI()];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.getPU()];
                        case 5:
                            _a.sent();
                            this.emit('statsUpdated', {
                                type: statsType.update,
                                message: 'All stats updated',
                                data: { errCode: 0 } // Success
                            });
                            return [3 /*break*/, 7];
                        case 6:
                            error_1 = _a.sent();
                            this.emit('statsUpdated', {
                                type: statsType.update,
                                message: 'Error updating stats',
                                data: { errCode: 1, blob: { error: error_1 } }
                            });
                            console.error("Error fetching google ping:", error_1);
                            this.stats.latencyGoogle = null;
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.getLatencyGoogle = function () {
            return __awaiter(this, void 0, void 0, function () {
                var latency, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, systeminformation_1.default.inetLatency()];
                        case 1:
                            latency = _a.sent();
                            this.stats.latencyGoogle = latency;
                            this.emit('latencyUpdated', {
                                type: statsType.update,
                                message: 'Google latency updated',
                                data: { errCode: 0, blob: { latency: latency } }
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            this.emit('latencyUpdated', {
                                type: statsType.update,
                                message: 'Error fetching Google latency',
                                data: { errCode: 1, blob: { error: error_2 } }
                            });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.createstatContainer = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.stats.lastUpdates = { "createstatContainer": Date.now() };
                    return [2 /*return*/];
                });
            });
        };
        Stats.prototype.getPid = function () {
            return __awaiter(this, void 0, void 0, function () {
                var data, pid, err_1, errorData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, (0, promises_1.readFile)(this._settings.pidFile, 'utf-8')];
                        case 1:
                            data = _a.sent();
                            pid = parseInt(data, 10);
                            this._settings.pid = pid;
                            this._settings.pidFileExists = true;
                            this._settings.pidFileReadable = true;
                            this.emit('pidAvailable', "PID: ".concat(pid));
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            this._settings.pidFileExists = false;
                            this._settings.pidFileReadable = false;
                            errorData = (err_1 instanceof Error) ? { errCode: 999, message: err_1.message } : null;
                            this.emit("getPid error PID retrieval error", errorData);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.updateAndGetPidIfNecessary = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(!this._settings.pid || typeof this._settings.pid !== "number")) return [3 /*break*/, 2];
                            this.stats.lastUpdates.getpid = Date.now();
                            return [4 /*yield*/, this.getPid()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.comparePids = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    this.stats.lastUpdates['comparePids'] = Date.now();
                    if (this._settings.pid) {
                        try {
                            this.getSI().then(function () {
                                if (_this.stats.si.pid == _this._settings.pid)
                                    _this.getPU();
                            }).then(function () {
                                return true;
                            }).catch(function (e) {
                                console.error('Error fetching pid: ' + _this._settings.pid, ' si_pid: ' + _this.stats.si.pid, ' pu_pid: ' + _this.stats.pu.pid, e);
                                return false;
                            });
                        }
                        catch (e) {
                            console.error('Error fetching pid: ' + this._settings.pid, ' si_pid: ' + this.stats.si.pid, ' pu_pid: ' + this.stats.pu.pid, e);
                        }
                    }
                    return [2 /*return*/];
                });
            });
        };
        Stats.prototype.getSI = function () {
            return __awaiter(this, void 0, void 0, function () {
                var targetProcess, e_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, systeminformation_1.default.processLoad("PalServer-Linux")];
                        case 1:
                            targetProcess = (_a.sent()).find(function (p) { return p.pid === _this._settings.pid; });
                            if (targetProcess) {
                                this.stats.si = { proc: targetProcess.proc, pid: targetProcess.mem, cpu: targetProcess.pid, mem: targetProcess.mem };
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            console.error("Error fetching system information:", e_1);
                            return [3 /*break*/, 3];
                        case 3:
                            this.stats.lastUpdates = { "getLatencyGoogle": Date.now() };
                            return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.getPU = function () {
            return __awaiter(this, void 0, void 0, function () {
                var usage, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.stats.lastUpdates['getPU'] = Date.now();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, (0, pidusage_1.default)(this._settings.pid)];
                        case 2:
                            usage = _a.sent();
                            this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _a.sent();
                            console.error("Error fetching pid usage:", e_2);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        Stats.prototype.setupGlobalEventListeners = function () {
            // Event handling for client connections, messages, errors
        };
        Stats = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(exports.GLOBAL_STATS_TOKEN)),
            __param(1, (0, inversify_1.inject)(PRIVATE_SETTINGS_TOKEN)),
            __metadata("design:paramtypes", [Object, Object])
        ], Stats);
        return Stats;
    }(eH.EventEmitterMixin(BaseStatsEvent)));
    exports.default = Stats;
});
/*
import { inject, injectable } from 'inversify';
import { Stats } from './stats';

@injectable()
export class StatsMonitor {
    @inject(Stats) private statsService!: Stats;

    startMonitoring() {
        this.statsService.on('latencyUpdated', (event: IStatsEvent) => {
            // Handle latency updates
        });

        this.statsService.on('statsUpdated', (event: IStatsEvent) => {
            // Handle comprehensive stats updates
        });
    }
} */ 
