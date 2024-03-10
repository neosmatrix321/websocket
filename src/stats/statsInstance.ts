"use strict";
import "reflect-metadata";
import { injectable, inject } from "inversify";


interface IwebHandle {
  isAlive: boolean,
  hasConnection: boolean,
}

interface IfileHandle {
  isAlive: boolean,
  hasConnection: boolean,
}

export interface IStats {
  webHandle: IwebHandle,
  fileHandle: IfileHandle,
  latencyGoogle: number | null,
  si: { proc: string, pid: number, cpu: number, mem: number},
  pu: { cpu: number, memory: number, pid: number, ctime: number, elapsed: number, timestamp: number },
  rcon: object,
  lastUpdates: Record<string, number>,
  interval_sendinfo: any
}

export interface IglobalStats {
  stats: IStats
}
export const STATS_WRAPPER_TOKEN = Symbol('statsWrapper');

@injectable()
export class statsWrapper {
  public stats: IStats = {
    webHandle: { isAlive: false, hasConnection: false },
    fileHandle: { isAlive: false, hasConnection: false },
    latencyGoogle: null,
    si: { proc: '', pid: 0, cpu: 0, mem: 0 },
    pu: { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0 },
    rcon: {},
    lastUpdates: {},
    interval_sendinfo: false
  };
    constructor(@inject(STATS_WRAPPER_TOKEN) statsInstance: IStats) {
      this.stats = statsInstance;  // Initialize if needed
    }
}
// export interface IStatsService extends globalStats {
//   getGlobalStats(): IglobalStats;
//   updateGlobalStats(allStats: IglobalStats): void;
// }
