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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainService = void 0;
// (Implementierung von UniqueClient und ClientContainer hier)
// main.ts
const Injectable_1 = require("./Injectable");
const globalValues_1 = require("./globalValues");
const server_1 = require("./server");
const clients_1 = require("./clients"); // Wichtiger Import
const privateSettings_1 = require("./privateSettings");
const inversify_1 = require("inversify");
let MainService = class MainService {
    _globalValues;
    _server;
    _settings;
    _clients;
    constructor(globalValues, server, clients // Clients-Injection
    , // Clients-Injection
    settings) {
        this._globalValues = globalValues;
        this._server = server;
        this._settings = settings;
        this._clients = clients;
    }
};
MainService = __decorate([
    (0, Injectable_1.Injectable)(),
    __param(0, (0, Injectable_1.Inject)(GLOBAL_VALUES_TOKEN)),
    __param(1, (0, Injectable_1.Inject)(server_1.SERVER_WRAPPER_TOKEN)),
    __param(2, (0, Injectable_1.Inject)(clients_1.CLIENT_COLLECTOR_TOKEN)),
    __param(3, (0, Injectable_1.Inject)(privateSettings_1.PRIVATE_SETTINGS_TOKEN)),
    __metadata("design:paramtypes", [typeof (_a = typeof globalValues_1.IGlobalValues !== "undefined" && globalValues_1.IGlobalValues) === "function" ? _a : Object, typeof (_b = typeof server_1.ServerWrapper !== "undefined" && server_1.ServerWrapper) === "function" ? _b : Object, typeof (_c = typeof clients_1.ClientContainer // Clients-Injection
         !== "undefined" && clients_1.ClientContainer // Clients-Injection
        ) === "function" ? _c : Object, typeof (_d = typeof privateSettings_1.IPrivateSettings !== "undefined" && privateSettings_1.IPrivateSettings) === "function" ? _d : Object])
], MainService);
exports.MainService = MainService;
const ___1 = require("./...");
Object.defineProperty(exports, "MainService", { enumerable: true, get: function () { return ___1.MainService; } });
const container = new inversify_1.Container();
container.bind(___1.MAIN_SERVICE_TOKEN).to(___1.MainService).inSingletonScope();
container.bind(server_1.SERVER_WRAPPER_TOKEN).to(server_1.ServerWrapper).inSingletonScope();
// ...weitere Bindungen hinzufügen
