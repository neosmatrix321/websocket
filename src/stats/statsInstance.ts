"use strict";

import { RconConnection } from "../rcon/lib/server/connection";
import * as fs from 'fs';

export interface IRconStats {
  info: { name: string, ver: string };
  players: { name: string, playeruid: string, steamid: string }[];
 }

export interface IGlobalStats {
  latencyGoogle: number | "NaN",
  si: { proc: string, pid: number | "NaN", cpu: number | "NaN", mem: number | "NaN" },
  pu: { cpu: number | "NaN", memory: number | "NaN", pid: number | "NaN", ctime: number | "NaN", elapsed: number | "NaN", timestamp: number | "NaN" },
  rcon: IRconStats,
  lastUpdates: Record<string, number>,
}

export interface IHandle {
  rcon: RconConnection | undefined;
  pidWatcher: fs.FSWatcher | undefined;
}

export interface IRconSettings {
  host: string;
  port: number;
  pw: string;
  isConnected: boolean;
}

export const packetHandlers = {
  serverMessage: "serverMessage",
  pidInfo: "pidInfo",
  chatMessage: "chatMessage",
  extras: "extras",
  latencyGoogle: "latencyGoogle",
  latencyUser: "latencyUser",
  rconInfo: "rconInfo",
  rconPlayers: "rconPlayers",
};

export interface IPidSettings {
  file: string;
  pid: number | undefined;
  fileExists: boolean;
  fileReadable: boolean;
  serverFound: boolean;
}

export class globalStats implements IGlobalStats {
  public latencyGoogle: number | "NaN" = "NaN";
  public si: { proc: string, pid: number | "NaN", cpu: number | "NaN", mem: number | "NaN" } = { proc: "NaN", pid: "NaN", cpu: "NaN", mem: "NaN" };
  public pu: { cpu: number | "NaN", memory: number | "NaN", pid: number | "NaN", ctime: number | "NaN", elapsed: number | "NaN", timestamp: number | "NaN" } = { cpu: "NaN", memory: "NaN", pid: "NaN", ctime: "NaN", elapsed: "NaN", timestamp: "NaN" };
  public rcon: IRconStats = { info: { name: "NaN", ver: "NaN" }, players: [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }] }; // { name: "name", playeruid: "playeruid", steamid: "steamid" }, 
  public lastUpdates: Record<string, number> = { "init": Date.now() };
  constructor() { }
}

export interface IStatsSettings {
  rcon: IRconSettings,
  pid: IPidSettings,
}

export class statsSettings {
  public rcon: IRconSettings = {
    host: "192.168.228.7",
    port: 9998,
    pw: "Descent3$",
    isConnected: false,
  };
  public pid: IPidSettings = {
    file: "/var/www/html/pal_server/server/pal_server.pid",
    pid: undefined,
    fileExists: false,
    fileReadable: false,
    serverFound: false,
  }
  constructor() { }
}

export class Handle implements IHandle {
  public rcon: RconConnection | undefined;
  public pidWatcher: any;
  constructor() {
    this.rcon = undefined;
    this.pidWatcher = undefined;
  }
}
