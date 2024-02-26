"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueClient = exports.PrivateSettings = exports.ServerWrapper = exports.GlobalValues = exports.MainService = void 0;
// main.ts
const Injectable_1 = require("./Injectable");
const inversify_1 = require("inversify");
const interfaces_1 = require("./interfaces");
Object.defineProperty(exports, "MainService", { enumerable: true, get: function () { return interfaces_1.MainService; } });
const tokens_1 = require("./tokens");
let MainService = class MainService {
};
MainService = __decorate([
    (0, Injectable_1.Injectable)()
], MainService);
exports.MainService = MainService;
let GlobalValues = class GlobalValues {
};
GlobalValues = __decorate([
    (0, Injectable_1.Injectable)()
], GlobalValues);
exports.GlobalValues = GlobalValues;
let ServerWrapper = class ServerWrapper {
};
ServerWrapper = __decorate([
    Injectable_1.Injectable
], ServerWrapper);
exports.ServerWrapper = ServerWrapper;
let PrivateSettings = class PrivateSettings {
};
PrivateSettings = __decorate([
    (0, Injectable_1.Injectable)()
], PrivateSettings);
exports.PrivateSettings = PrivateSettings;
// uniqueClient.ts
class UniqueClient {
}
exports.UniqueClient = UniqueClient;
const ___1 = require("./..."); // Richtige Pfade ergänzen
Object.defineProperty(exports, "GlobalValues", { enumerable: true, get: function () { return ___1.GlobalValues; } });
Object.defineProperty(exports, "ServerWrapper", { enumerable: true, get: function () { return ___1.ServerWrapper; } });
Object.defineProperty(exports, "PrivateSettings", { enumerable: true, get: function () { return ___1.PrivateSettings; } });
const container = new inversify_1.Container();
container.bind(interfaces_1.MainService).to(interfaces_1.MainService).inSingletonScope();
container.bind(tokens_1.GLOBAL_VALUES_TOKEN).to(___1.GlobalValues).inSingletonScope();
container.bind(tokens_1.SERVER_WRAPPER_TOKEN).to(___1.ServerWrapper).inSingletonScope();
container.bind(tokens_1.PRIVATE_SETTINGS_TOKEN).to(___1.PrivateSettings).inSingletonScope();
