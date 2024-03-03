(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "reflect-metadata"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("reflect-metadata");
});
// export interface IStatsService extends globalStats {
//   getGlobalStats(): IglobalStats;
//   updateGlobalStats(allStats: IglobalStats): void;
// }
