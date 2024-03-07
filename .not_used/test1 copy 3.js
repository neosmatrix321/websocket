"use strict";
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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAIN_SERVICE_TOKEN = exports.MainService = exports.CLIENT_COLLECTOR_TOKEN = exports.ClientService = exports.PRIVATE_SETTINGS_TOKEN = exports.PrivateSettingsService = exports.SERVER_WRAPPER_TOKEN = exports.ServerService = exports.GlobalStatsService = void 0;
// globalStats
const Injectable_1 = require("./Injectable");
let GlobalStatsService = class GlobalStatsService {
    _stats = {
        clientsConnected: 0,
        serverUptime: 0,
        // ...weitere Startwerte
    };
    export GLOBAL_STATS_TOKEN = Symbol('StatsService');
}; // Token
GlobalStatsService = __decorate([
    (0, Injectable_1.Injectable)()
], GlobalStatsService);
exports.GlobalStatsService = GlobalStatsService;
const interfaces_1 = require("./interfaces");
let ServerService = class ServerService {
    _webHandle;
    _fileHandle;
    _handles = {
        web: null,
        file: null
    };
    constructor(_webHandle, _fileHandle) {
        this._webHandle = _webHandle;
        this._fileHandle = _fileHandle;
        this._handles.web = _webHandle;
        this._handles.file = _fileHandle;
    }
    getHandle(type) {
        return this._handles[type];
    }
};
ServerService = __decorate([
    (0, Injectable_1.Injectable)(),
    __param(0, (0, Injectable_1.Inject)(WEB_HANDLE_TOKEN)),
    __param(1, (0, Injectable_1.Inject)(FILE_HANDLE_TOKEN)),
    __metadata("design:paramtypes", [typeof (_a = typeof interfaces_1.IWebHandle !== "undefined" && interfaces_1.IWebHandle) === "function" ? _a : Object, typeof (_b = typeof interfaces_1.IFileHandle !== "undefined" && interfaces_1.IFileHandle) === "function" ? _b : Object])
], ServerService);
exports.ServerService = ServerService;
exports.SERVER_WRAPPER_TOKEN = Symbol('ServerService');
let PrivateSettingsService = class PrivateSettingsService {
    _settings = {
        apiKey: '...',
        adminPassword: '...',
        // ...weitere Startwerte
    };
    getSettings() {
        return this._settings;
    }
    updateSettings(updatedSettings) {
        this._settings = updatedSettings;
    }
};
PrivateSettingsService = __decorate([
    (0, Injectable_1.Injectable)()
], PrivateSettingsService);
exports.PrivateSettingsService = PrivateSettingsService;
exports.PRIVATE_SETTINGS_TOKEN = Symbol('SettingsService');
const interfaces_2 = require("interfaces");
let ClientService = class ClientService {
    _clients = new Map();
};
ClientService = __decorate([
    (0, Injectable_1.Injectable)()
], ClientService);
exports.ClientService = ClientService;
exports.CLIENT_COLLECTOR_TOKEN = Symbol('ClientsService');
const statsInstance_1 = require("./global/statsInstance");
const settingsInstance_1 = require("./private/settingsInstance");
const inversify_1 = require("inversify");
let MainService = class MainService {
    _statsService;
    _serverService;
    _settingsService;
    _clientsService;
    constructor(_statsService, _serverService, _settingsService, _clientsService) {
        this._statsService = _statsService;
        this._serverService = _serverService;
        this._settingsService = _settingsService;
        this._clientsService = _clientsService;
        this.stats = _statsService;
        this._server = server;
        this._settings = settings;
        this._clients = clients;
    }
};
MainService = __decorate([
    (0, Injectable_1.Injectable)(),
    __param(0, (0, Injectable_1.Inject)(___1.GLOBAL_STATS_TOKEN)),
    __param(1, (0, Injectable_1.Inject)(exports.SERVER_WRAPPER_TOKEN)),
    __param(2, (0, Injectable_1.Inject)(exports.PRIVATE_SETTINGS_TOKEN)),
    __param(3, (0, Injectable_1.Inject)(exports.CLIENT_COLLECTOR_TOKEN)),
    __metadata("design:paramtypes", [typeof (_c = typeof statsInstance_1.IGlobalStatsService !== "undefined" && statsInstance_1.IGlobalStatsService) === "function" ? _c : Object, typeof (_d = typeof interfaces_1.IServerService !== "undefined" && interfaces_1.IServerService) === "function" ? _d : Object, typeof (_e = typeof settingsInstance_1.IPrivateSettingsService !== "undefined" && settingsInstance_1.IPrivateSettingsService) === "function" ? _e : Object, typeof (_f = typeof interfaces_2.IClientsService !== "undefined" && interfaces_2.IClientsService) === "function" ? _f : Object])
], MainService);
exports.MainService = MainService;
exports.MAIN_SERVICE_TOKEN = Symbol('MainService');
const ___1 = require("./...");
Object.defineProperty(exports, "MainService", { enumerable: true, get: function () { return ___1.MainService; } });
const container = new inversify_1.Container();
container.bind(GLOBAL_VALUES_TOKEN).toDynamicValue(() => {
    return {
        server: container.get(HANDLE_TOKEN),
        settings: container.get(PrivateSettings),
        clients: []
    };
});
const mainService = container.get(___1.MainService);
// container.bind<MainService>(MAIN_SERVICE_TOKEN).to(MainService).inSingletonScope();
// ... Binden Sie weitere Abhängigkeiten
