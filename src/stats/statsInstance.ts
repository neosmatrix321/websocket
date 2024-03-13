"use strict";

import { RconConnection } from "../rcon/lib/server/connection";

export interface IGlobalStats {
  latencyGoogle: number | null,
  si: { proc: string, pid: number, cpu: number, mem: number },
  pu: { cpu: number, memory: number, pid: number, ctime: number, elapsed: number, timestamp: number },
  rcon: { info: string, players: any }
  lastUpdates: Record<string, number>,
}

export interface IHandle {
  rcon: RconConnection | undefined | null;
}
export interface IRconSettings {
  host: string;
  port: number;
  pw: string;
  isConnected: boolean;
  // timeout: number;
  // keepAlive: boolean;
  // keepAliveInterval: number;
  // keepAliveTimeout: number;
  // encoding: string;
  // debug: boolean;
  // maxRetries: number;
  // retryInterval: number;
  // useTLS: boolean;
  // tls: {
  //   certPath: string;
  //   keyPath: string;
  //   caPath: string;
  //   rejectUnauthorized: boolean;
  // }
}

export interface IPidSettings {
  file: string;
  pid: number | undefined;
  fileExists: boolean;
  fileReadable: boolean;
}


export class globalStats implements IGlobalStats {
  public latencyGoogle = null;
  public si = { proc: "", pid: 0, cpu: 0, mem: 0 };
  public pu = { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0 };
  public rcon = { info: "", players: {} };
  public lastUpdates = { "init": Date.now() };
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
  }
  constructor() { }
}

export class Handle implements IHandle {
  public rcon: RconConnection | undefined | null;
  public intval: any;
  constructor() {
    this.rcon = undefined;
  }
}
