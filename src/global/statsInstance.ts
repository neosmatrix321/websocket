"use strict";

import { injectable } from "inversify";
import 'reflect-metadata';
import { convertTimestampToTime, calcDurationDetailed, calcTimeDetailed } from './functions';
import { EventEmitterMixin } from "./EventEmitterMixin";
import { settingsContainer } from "./containerWrapper";


export interface IRconStatsPlayers {
  name: string,
  playeruid: string,
  steamid: string,
}

export interface IRconStatsInfo {
  name: string,
  ver: string,
}

export interface IRconStats {
  portOpen: boolean,
  isConnected: boolean,
  info: IRconStatsInfo;
  players: IRconStatsPlayers[];
}

export interface IWidget {
  cpu: number,
  memory: number,
  pid: number,
  ctime: number,
  elapsed: number,
  timestamp: number,
  formattedTime: string,
  cpuLoad: string,
  memoryFormated: string,
  elapsedFormated: string,
  ctimeFormated: string,
}

export interface ISI {
  proc: string,
  pid: number,
  cpu: number,
  mem: number,
  memFormated: string,
}

export interface IPU {
  cpu: number,
  memory: number,
  pid: number,
  ctime: number,
  elapsed: number,
  timestamp: number,
  elapsedFormated: string,
  ctimeFormated: string,
  cpuFormated: string,
  memFormated: string,
}

export interface IPid {
  fileExists: boolean,
  fileReadable: boolean,
  processFound: boolean,
}

export interface ILastUpdates {
  last: number,
  count: number,
  success: boolean,
}

interface IGlobalStats {
  isGathering: boolean,
  latencyGoogle: string,
  widget: IWidget,
  pid: IPid,
  si: ISI,
  pu: IPU,
  rcon: IRconStats,
  widgetExtra: { memMB: string, memHeap: string, memHeapTotal: string, },
  lastUpdates: ILastUpdatesSTATS,
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
  isReachable: boolean;
  lastUpdates: ILastUpdatesSERVER;
}

interface IwebHandleStats {
  connectedClients: number
}

interface IfileHandleStats {
  connectedClients: number
}

interface ILastUpdatesMAIN {
  init: { last: number, count: number, success: boolean },
  start: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesGUI {
  start: { last: number, count: number, success: boolean },
  stop: { last: number, count: number, success: boolean },
  draw: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesSTATS {
  updateAllStats: { last: number, count: number, success: boolean },
  gatherIntval: { last: number, count: number, success: boolean },
  comparePids: { last: number, count: number, success: boolean },
  getSI: { last: number, count: number, success: boolean },
  getPU: { last: number, count: number, success: boolean },
  getLatencyGoogle: { last: number, count: number, success: boolean },
  widgetStats: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesSERVER {
  createServer: { last: number, count: number, success: boolean },
  rconConnect: { last: number, count: number, success: boolean },
  rconDisconnect: { last: number, count: number, success: boolean },
  rconGetStatsInfo: { last: number, count: number, success: boolean },
  rconGetStatsPlayers: { last: number, count: number, success: boolean },
  startPidWatcher: { last: number, count: number, success: boolean },
  updatePid: { last: number, count: number, success: boolean },
  isPortOpen: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesCLIENTS {
  statsUpdated: { last: number, count: number, success: boolean },
  messageIntval: { last: number, count: number, success: boolean },
  subscribe: { last: number, count: number, success: boolean },
  unsubscribe: { last: number, count: number, success: boolean },
  messagePayload: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}
// this.header = ["cat", "function", "lastUpdate", "idleTime", "no", "success"];

export interface IFormatedLastUpdates extends Array<{ cat: string, function: string, lastUpdate: string, idleTime: string, no: number, result: boolean, [key: string]: string | number | boolean }> {}

export class globalStats implements IGlobalStats {
  isGathering = false;
  latencyGoogle = "NaN";
  widget = { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0, formattedTime: "NaN", cpuLoad: "NaN", memoryFormated: "NaN", elapsedFormated: "NaN", ctimeFormated: "NaN", };
  pid = { fileExists: false, fileReadable: false, processFound: false };
  si = { proc: "NaN", pid: 0, cpu: 0, mem: 0, memFormated: "NaN",};
  pu = { cpu: 0, memory: 0, pid: 0, ctime: 0, elapsed: 0, timestamp: 0, elapsedFormated: "NaN", ctimeFormated: "NaN", cpuFormated: "NaN", memFormated: "NaN", };
  rcon: IRconStats = { portOpen: false, isConnected: false, info: { name: "NaN", ver: "NaN" }, players: [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }] }; // { name: "name", playeruid: "playeruid", steamid: "steamid" },
  widgetExtra = { memMB: "NaN", memHeap: "NaN", memHeapTotal: "NaN" };
  lastUpdates: ILastUpdatesSTATS = {
    gatherIntval: { last: 0, count: 0, success: false }, initStats: { last: 0, count: 0, success: false }, comparePids: { last: 0, count: 0, success: false }, updateAllStats: { last: 0, count: 0, success: false }, getSI: { last: 0, count: 0, success: false }, getPU: { last: 0, count: 0, success: false }, getLatencyGoogle: {
      last: 0, count: 0, success: false
    }, widgetStats: { last: 0, count: 0, success: false }
  }
  constructor() { }
}

export interface IFormatedStats {
  "header": {
    "address": string,
    "alive": boolean,
    "Events (GUI | APP)": string,
    "Widget WxH": string,
    [key: string]: string | boolean,
  };
  "widget": {
    "refresh rate": boolean,
    "uptime": string,
    "ctime": string,
    "CPU load": string,
    "memory usage": string,
    "heap memory": string,
    "total heap": string,
    "ErrLog count": number,
    [key: string]: string | boolean | number,
  };
  "pid": {
    "pidIntval": boolean,
    "exists": boolean,
    "readable": boolean,
    "found": boolean,
    "pid": string,
    "upTime": string,
    "cTime": string,
    [key: string]: string | boolean,
  };
  "web": {
    "webIntval": boolean,
    "reachable": boolean,
    "has conn": boolean,
    "clients <3": number,
    "clients ##": number,
    "messages #": number,
    [key: string]: string | boolean | number,
  };
  "server": {
    "Ping": string,
    "SI pid": string,
    "PU pid": string,
    "CPU load": string,
    "SI Mem": string,
    "PU Mem": string,
    [key: string]: string | boolean,
  };
  "rcon": {
    "port open": boolean,
    "connected": boolean,
    "players": IRconStatsPlayers[],
     [key: string]: string | boolean | IRconStatsPlayers[],
  }
  "extras": {
    'localTime': string,
    'firstHeader': string,
    'secondHeader': string,
    [key: string]: string ,
  };
  [key: string]: { [key: string]: boolean | string | number | { [key: string]: string } | IRconStatsPlayers[] } | string | boolean | number;
}

interface IMainStats {
  lastUpdates: ILastUpdatesMAIN;
}

interface IGuiStats {
  selfStats: {
    width: number,
    height: number,
    capturedErrors: number,
    isPainting: boolean;
  };
  lastUpdates: ILastUpdatesGUI;
}

export class mainStats implements IMainStats {
  lastUpdates: ILastUpdatesMAIN = { init: { last: Date.now(), count: 0, success: false }, start: { last: 0, count: 0, success: false } };
  constructor() { }
}

export class guiStats implements IGuiStats {
  selfStats = {
    width: 0,
    height: 0,
    capturedErrors: 0,
    isPainting: false,
  };
  lastUpdates = {
    start: { last: 0, count: 0, success: false },
    stop: { last: 0, count: 0, success: false },
    draw: { last: 0, count: 0, success: false },
  };
  constructor() { }
}

export class serverStats implements IServerStats {
  webHandle = { isAlive: false, hasConnection: false };
  fileHandle = { isAlive: false, hasConnection: false };
  isReachable = false;
  lastUpdates = { createServer: { last: 0, count: 0, success: false }, rconConnect: { last: 0, count: 0, success: false }, rconDisconnect: { last: 0, count: 0, success: false }, rconGetStatsInfo: { last: 0, count: 0, success: false }, rconGetStatsPlayers: { last: 0, count: 0, success: false }, startPidWatcher: { last: 0, count: 0, success: false }, updatePid: { last: 0, count: 0, success: false }, isPortOpen: { last: 0, count: 0, success: false }, };
  constructor() { }
}

interface IClientsStats {
  isMessaging: boolean,
  webHandle: IwebHandleStats,
  fileHandle: IfileHandleStats,
  messageCounter: number,
  clientsCounter: number,
  activeClients: number,
  lastUpdates: ILastUpdatesCLIENTS,
}

export class clientsStats implements IClientsStats {
  isMessaging = false;
  webHandle = { connectedClients: 0 };
  fileHandle = { connectedClients: 0 };
  messageCounter = 0;
  clientsCounter = 0;
  activeClients = 0;
  lastUpdates = { messageIntval: { last: Date.now(), count: 0, success: false }, statsUpdated: { last: 0, count: 0, success: false }, subscribe: { last: 0, count: 0, success: false }, unsubscribe: { last: 0, count: 0, success: false }, messagePayload: { last: 0, count: 0, success: false } };
  constructor() { }
}

export interface IStatsWrapper {
  main: IMainStats;
  gui: IGuiStats;
  global: IGlobalStats;
  server: IServerStats;
  clients: IClientsStats;
  [key: string]: any;
}

@injectable()
export class statsWrapper implements IStatsWrapper {
  main = new mainStats();
  gui = new guiStats();
  global = new globalStats();
  server = new serverStats();
  clients = new clientsStats();
  [key: string]: any;
  constructor() {
    this.getFormatedLastUpdates = (): IFormatedLastUpdates => {
      let lastUpdatesTab: IFormatedLastUpdates = [];
      const categories = ["main", "gui", "global", "server", "clients"];
      const functions: { [key: string]: string[] } = {
        "main": ["init", "start"],
        "gui": ["start", "stop", "draw"],
        "global": ["initStats", "gatherIntval", "comparePids", "updateAllStats", "getSI", "getPU", "widgetStats", "getLatencyGoogle"],
        "server": ["createServer", "rconConnect", "rconDisconnect", "rconGetStatsInfo", "rconGetStatsPlayers", "startPidWatcher", "updatePid", "isPortOpen"],
        "clients": ["statsUpdated", "messageIntval", "subscribe", "unsubscribe", "messagePayload"]
      };
  
      for (let category of categories) {
        for (let func of functions[category]) {
          lastUpdatesTab.push(this.calcLastUpdateValues(category, func));
        }
      }
      return lastUpdatesTab as IFormatedLastUpdates;
    };
    this.getFormatedStats = (): IFormatedStats => {
      const time = calcTimeDetailed(Math.floor(Date.now()));
      const FormatedStats = {
        "header": {
          "address": `${settingsContainer.getSetting('rcon', 'host')}:${settingsContainer.getSetting('server', 'streamServerPort')}`,
          "alive": this.server.webHandle.isAlive,
          "Events (GUI | APP)": `${EventEmitterMixin.eventStats.activeEvents} | ${EventEmitterMixin.eventStats.guiActiveEvents}`,
          "Widget WxH": `${this.gui.selfStats.width}x${this.gui.selfStats.height}`,
        },
        "widget": {
          "refresh rate": this.gui.selfStats.isPainting,  // , guiAlive: `${this.settings.gui.period} ms`)
          "uptime": `${this.global.widget.elapsedFormated}`,
          "ctime": `${this.global.widget.ctimeFormated}`,
          "CPU load": `${this.global.widget.cpuLoad}`,
          "memory usage": `${this.global.widget.memoryFormated}`,
          "heap memory": `${this.global.widgetExtra.memHeap}`,
          "total heap": `${this.global.widgetExtra.memHeapTotal}`,
          "ErrLog count": this.gui.selfStats.capturedErrors,
        },
        "pid": {
          "pidIntval": this.global.isGathering,
          "exists": this.global.pid.fileExists,
          "readable": this.global.pid.fileReadable,
          "found": this.global.pid.processFound,
          "pid": `${settingsContainer.getSetting('pid', 'pid')}`,
          "upTime": this.global.pu.elapsedFormated,
          "cTime": this.global.pu.ctimeFormated,
        },
        "web": {
          "webIntval": this.clients.isMessaging,
          "reachable": this.server.isReachable,
          "has conn": this.server.webHandle.hasConnection,
          "clients <3": this.clients.activeClients,
          "clients ##": this.clients.clientsCounter,
          "messages #": this.clients.messageCounter,
          //"IDLE start": idleStart,
          //"IDLE end": idleEnd,
        },
        "server": {
          "Ping": `${this.global.latencyGoogle}`,
          "SI pid": `${this.global.si.pid}`,
          "PU pid": `${this.global.pu.pid}`,
          "CPU load": `${this.global.pu.cpuFormated}`,
          "SI Mem": `${this.global.si.memFormated}`,
          "PU Mem": `${this.global.pu.memFormated}`,
        },
        "rcon": {
          "port open": this.global.rcon.portOpen,
          "connected": this.global.rcon.isConnected,
          "players": this.global.rcon.players,
        },
        "extras": {
          'localTime': `${time}`,
          'firstHeader': `This Widget controls:`,
          'secondHeader': `Servername: ${this.global.rcon.info.name} [${this.global.rcon.info.ver}]`,
        },
      };
      return FormatedStats;
    };
    this.updateLastUpdates("global", "initStats");
  }
  public getFormatedStats: () => IFormatedStats;

  public getFormatedLastUpdates: () => IFormatedLastUpdates;

  public updateLastUpdates(category: string, index: string, success: boolean = false): void {
    // Validate inputs 
    const validCategories = ['main', 'gui', 'global', 'server', 'clients'];
    if (!validCategories.includes(category)) {
      console.error(`Invalid category: ${category}`);
      return;
    }

    // Access the correct global object
    const statsObject = this[category];
    if (!statsObject || !statsObject.lastUpdates.hasOwnProperty(index)) {
      console.error(`Invalid index: ${index} for category ${category}`);
      return;
    }

    // Update the statistics
    statsObject.lastUpdates[index].last = Date.now();
    if (!success) statsObject.lastUpdates[index].count++;
    statsObject.lastUpdates[index].success = success;
  }

  private calcLastUpdateValues(category: string, index: string): { cat: string, function: string, lastUpdate: string, idleTime: string, no: number, result: boolean } {

    const statsObject = this[category].lastUpdates;
    const object = statsObject[index];
    if (object.last === 0) {
      return { 'cat': category, 'function': index, 'lastUpdate': "NaN", 'idleTime': "NaN", 'no': 0, 'result': false };
    }
    const diff = Date.now() - object.last;
    const counter = object.count;
    const timeConverted: string = convertTimestampToTime(object.last as number) || "NaN";
    const idleTime: string = calcDurationDetailed(diff as number) || "NaN";
    return { 'cat': category, 'function': index, 'lastUpdate': timeConverted, 'idleTime': idleTime, 'no': counter, 'result': object.success };
  }

}

export const StatsWrapperSymbol = Symbol('statsWrapper'); 
