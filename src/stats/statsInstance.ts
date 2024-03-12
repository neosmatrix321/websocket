"use strict";

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

export class statsWrapper implements IStats {
  public webHandle = { isAlive: false, hasConnection: false };
  public fileHandle = { isAlive: false, hasConnection: false };
  public latencyGoogle = null;
  public si = { proc: '', pid: 0, cpu: 0, mem: 0 };
  public pu = { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0 };
  public rcon = {};
  public lastUpdates = { "init": Date.now()};
  public interval_sendinfo = false;
  constructor() { }
}
// export interface IStatsService extends globalStats {
//   getGlobalStats(): IglobalStats;
//   updateGlobalStats(allStats: IglobalStats): void;
// }
