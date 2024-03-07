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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const inversify_1 = require("inversify");
// Definieren Sie die Tokens
const MAIN_SERVICE_TOKEN = Symbol("MainService");
const GLOBAL_VALUES_TOKEN = Symbol("GlobalValues");
const SERVER_WRAPPER_TOKEN = Symbol("ServerWrapper");
const PRIVATE_SETTINGS_TOKEN = Symbol("PrivateSettings");
const CLIENTS_TOKEN = Symbol("Clients");
const UNIQUE_CLIENT_TOKEN = Symbol("UniqueClient");
// Implementieren Sie die Klassen
let GlobalValues = class GlobalValues {
};
GlobalValues = __decorate([
    (0, inversify_1.injectable)()
], GlobalValues);
let ServerWrapper = class ServerWrapper {
    handle = { web: null, file: null };
};
ServerWrapper = __decorate([
    (0, inversify_1.injectable)()
], ServerWrapper);
let PrivateSettings = class PrivateSettings {
};
PrivateSettings = __decorate([
    (0, inversify_1.injectable)()
], PrivateSettings);
let Clients = class Clients {
};
Clients = __decorate([
    (0, inversify_1.injectable)()
], Clients);
let UniqueClient = class UniqueClient {
};
UniqueClient = __decorate([
    (0, inversify_1.injectable)()
], UniqueClient);
let MainService = class MainService {
    stats;
    server;
    settings;
    clients;
    uniqueClient;
};
__decorate([
    (0, inversify_1.inject)(GLOBAL_VALUES_TOKEN),
    __metadata("design:type", Object)
], MainService.prototype, "stats", void 0);
__decorate([
    (0, inversify_1.inject)(SERVER_WRAPPER_TOKEN),
    __metadata("design:type", Object)
], MainService.prototype, "server", void 0);
__decorate([
    (0, inversify_1.inject)(PRIVATE_SETTINGS_TOKEN),
    __metadata("design:type", Object)
], MainService.prototype, "settings", void 0);
__decorate([
    (0, inversify_1.inject)(CLIENTS_TOKEN),
    __metadata("design:type", Object)
], MainService.prototype, "clients", void 0);
__decorate([
    (0, inversify_1.inject)(UNIQUE_CLIENT_TOKEN),
    __metadata("design:type", Object)
], MainService.prototype, "uniqueClient", void 0);
MainService = __decorate([
    (0, inversify_1.injectable)()
], MainService);
// Erstellen Sie den IoC-Container und registrieren Sie die Bindungen
const container = new inversify_1.Container();
container.bind(GLOBAL_VALUES_TOKEN).to(GlobalValues);
container.bind(SERVER_WRAPPER_TOKEN).to(ServerWrapper);
container.bind(PRIVATE_SETTINGS_TOKEN).to(PrivateSettings);
container.bind(CLIENTS_TOKEN).to(Clients);
container.bind(UNIQUE_CLIENT_TOKEN).to(UniqueClient);
container.bind(MAIN_SERVICE_TOKEN).to(MainService);
// Holen Sie sich eine Instanz des MainService
const mainService = container.get(MAIN_SERVICE_TOKEN);
