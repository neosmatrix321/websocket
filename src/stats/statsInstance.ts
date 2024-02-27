"use strict";
import "reflect-metadata";
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
  si: { proc: string, pid: number, cpu: number, mem: number},
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
