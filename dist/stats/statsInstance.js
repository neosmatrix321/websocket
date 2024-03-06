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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "reflect-metadata", "inversify"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.statsWrapper = exports.STATS_WRAPPER_TOKEN = void 0;
    require("reflect-metadata");
    var inversify_1 = require("inversify");
    exports.STATS_WRAPPER_TOKEN = Symbol('statsWrapper');
    var statsWrapper = /** @class */ (function () {
        function statsWrapper(statsInstance) {
            this.stats = {
                webHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
                fileHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
                clientsCounter: 0,
                activeClients: 0,
                latencyGoogle: null,
                si: { proc: '', pid: 0, cpu: 0, mem: 0 },
                pu: { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0 },
                rcon: {},
                lastUpdates: {},
                clients: {},
                interval_sendinfo: false
            };
            this.stats = statsInstance; // Initialize if needed
        }
        statsWrapper = __decorate([
            (0, inversify_1.injectable)(),
            __param(0, (0, inversify_1.inject)(exports.STATS_WRAPPER_TOKEN)),
            __metadata("design:paramtypes", [Object])
        ], statsWrapper);
        return statsWrapper;
    }());
    exports.statsWrapper = statsWrapper;
});
// export interface IStatsService extends globalStats {
//   getGlobalStats(): IglobalStats;
//   updateGlobalStats(allStats: IglobalStats): void;
// }
