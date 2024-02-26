"use strict";
import "reflect-metadata";
import { injectable, optional, inject } from "inversify";
import pidusage from 'pidusage';
import { ProcessesProcessLoadData } from 'systeminformation';
interface IwebHandle {
  isAlive: boolean,
  hasConnection: boolean,
  connectedClients: number
}
interface IfileHandle {
  isAlive: boolean,
  hasConnection: boolean,
  connectedClients: number
}
export interface IStats {
  webHandle: IwebHandle,
  fileHandle: IfileHandle,
  clientsCounter: number,
  activeClients: number,
  latencyGoogle: number | null,
  si: ProcessesProcessLoadData,
  pu: { cpu: number, memory: number, pid: number, ctime: number, elapsed: number, timestamp: number },
rcon: object,
  lastUpdates: Record<string, number>,
  clients: object,
  interval_sendinfo: any
}
export interface IglobalStats {
  stats: IStats
}

// export interface IStatsService extends globalStats {
//   getGlobalStats(): IglobalStats;
//   updateGlobalStats(allStats: IglobalStats): void;
// }
@injectable()
export default class globalStats implements IglobalStats {
  public stats!: IStats;
  public constructor(@inject(GLOBAL_STATS_TOKEN) statsInstance: IStats) {
    this.stats = statsInstance || {
      webHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
      fileHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
      clientsCounter: 0,
      activeClients: 0,
      latencyGoogle: null,
      si: { cpu: null, memory: null, ppid: null, pid: null, ctime: null, elapsed: null, timestamp: null},
      pu: { proc: null, pid: null, pids: null, cpu: null, mem: null },
      rcon: {},
      lastUpdates: {},
      clients: {},
      interval_sendinfo: false
    };
  }
  // getGlobalStats(): IStats {
  //   return this.allStats;
  // }
  // updateGlobalStats(allStats: IStats): void {
  //   this.allStats = allStats;
  //   this.emit('statsUpdated', allStats);
  // }
}
export const GLOBAL_STATS_TOKEN = Symbol('StatService');
// const statsInstance = new Container();
// statsInstance.bind<IStats>(GLOBAL_STATS_TOKEN).toConstantValue(null);
// export default statsInstance;

