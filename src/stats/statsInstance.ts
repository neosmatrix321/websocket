"use strict";
import { injectable, Container } from "inversify";
import 'reflect-metadata';


export interface IRconStats {
  info: { name: string, ver: string };
  players: { name: string, playeruid: string, steamid: string }[];
}

export interface IIntValStats {
  idleStart: number;
  idleEnd: number;
  duration: number;
}


export interface IGlobalStats {
  latencyGoogle: number | "NaN",
  si: { proc: string, pid: number | "NaN", cpu: number | "NaN", mem: number | "NaN" },
  pu: { cpu: number | "NaN", memory: number | "NaN", pid: number | "NaN", ctime: number | "NaN", elapsed: number | "NaN", timestamp: number | "NaN" },
  rcon: IRconStats,
  intvalStats: IIntValStats,
  lastUpdates: Record<string, number>,
}

interface IServerStats {
  webHandle: {
    isAlive: boolean;
    hasConnection: boolean;
  };
  fileHandle: {
    isAlive: boolean;
    hasConnection: boolean;
  };
}

interface IwebHandleStats {
  connectedClients: number
}

interface IfileHandleStats {
  connectedClients: number
}

interface IClientsStats {
  webHandle: IwebHandleStats,
  fileHandle: IfileHandleStats,
  clientsCounter: number,
  activeClients: number,
}

export class globalStats {
  latencyGoogle: number | "NaN" = "NaN";
  si: { proc: string, pid: number | "NaN", cpu: number | "NaN", mem: number | "NaN" } = { proc: "NaN", pid: "NaN", cpu: "NaN", mem: "NaN" };
  pu: { cpu: number | "NaN", memory: number | "NaN", pid: number | "NaN", ctime: number | "NaN", elapsed: number | "NaN", timestamp: number | "NaN" } = { cpu: "NaN", memory: "NaN", pid: "NaN", ctime: "NaN", elapsed: "NaN", timestamp: "NaN" };
  rcon: IRconStats = { info: { name: "NaN", ver: "NaN" }, players: [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }] }; // { name: "name", playeruid: "playeruid", steamid: "steamid" },
  intvalStats: IIntValStats = { idleStart: 0, idleEnd: 0, duration: 0 };
  lastUpdates: Record<string, number> = { "init": Date.now() };
  constructor() { }
}  

export class serverStats {
  webHandle: {
    isAlive: boolean;
    hasConnection: boolean;
  } = { isAlive: false, hasConnection: false };
  fileHandle: {
    isAlive: boolean;
    hasConnection: boolean;
  } = { isAlive: false, hasConnection: false };
  constructor() { }
}

export class clientsStats {
  webHandle: IwebHandleStats = { connectedClients: 0 };
  fileHandle: IfileHandleStats = { connectedClients: 0 };
  clientsCounter: number = 0;
  activeClients: number = 0;
  constructor() { }
}

export interface IStatsWrapper {
  global: IGlobalStats;
  server: IServerStats;
  client: IClientsStats;
}

@injectable()
export class statsWrapper implements IStatsWrapper {
  global: IGlobalStats;
  server: IServerStats;
  client: IClientsStats;

  constructor() {
    this.global = new globalStats();
    this.server = new serverStats();
    this.client = new clientsStats();
  }
}

export const StatsWrapperSymbol = Symbol('statsWrapper'); 
