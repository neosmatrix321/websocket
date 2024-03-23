"use strict";

import { injectable } from "inversify";
import 'reflect-metadata';
import { convertTimestampToTime, calcDurationDetailed } from '../global/functions';
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { settingsContainer } from "../global/containerWrapper";


interface IRconStats {
  isConnected: boolean,
  info: { name: string, ver: string };
  players: { name: string, playeruid: string, steamid: string }[];
}

interface IIntValStats {
  idleStart: number;
  idleEnd: number;
  duration: number;
}


interface IGlobalStats {
  latencyGoogle: string,
  widget: { cpu: number, memory: number, pid: number, ctime: number, elapsed: number, timestamp: number, formattedTime: string, cpuLoad: string, memoryFormated: string },
  pid: { fileExists: boolean, fileReadable: boolean, processFound: boolean, },
  si: { proc: string, pid: number, cpu: number, mem: number, memFormated: string, },
  pu: { cpu: number, memory: number, pid: number, ctime: number, elapsed: number, timestamp: number, elapsedFormated: string, ctimeFormated: string, cpuFormated: string, memFormated: string, },
  rcon: IRconStats,
  widgetExtra: { memMB: string, memHeap: string, memHeapTotal: string, },
  intvalStats: IIntValStats,
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
  guiStart: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesSTATS {
  comparePids: { last: number, count: number, success: boolean },
  updateAllStats: { last: number, count: number, success: boolean },
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
  [key: string]: { last: number, count: number, success: boolean };
}

interface ILastUpdatesCLIENTS {
  statsUpdated: { last: number, count: number, success: boolean },
  subscribe: { last: number, count: number, success: boolean },
  unsubscribe: { last: number, count: number, success: boolean },
  messagePayload: { last: number, count: number, success: boolean },
  [key: string]: { last: number, count: number, success: boolean };
}
// this.header = ["cat", "function", "lastUpdate", "idleTime", "no", "success"];

export interface IFormatedLastUpdates extends Array<{ cat: string, function: string, lastUpdate: string, idleTime: string, no: number, success: boolean, [key: string]: string | number | boolean }> {}

export class globalStats implements IGlobalStats {
  latencyGoogle = "NaN";
  widget = { cpu: -1, memory: -1, pid: -1, ctime: -1, elapsed: -1, timestamp: -1, formattedTime: "NaN", cpuLoad: "NaN", memoryFormated: "NaN", };
  pid = { fileExists: false, fileReadable: false, processFound: false };
  si = { proc: "NaN", pid: -1, cpu: -1, mem: -1, memFormated: "NaN",};
  pu = { cpu: -1, memory: -1, pid: -1, ctime: -1, elapsed: -1, timestamp: -1, elapsedFormated: "NaN", ctimeFormated: "NaN", cpuFormated: "NaN", memFormated: "NaN", };
  rcon: IRconStats = { isConnected: false, info: { name: "NaN", ver: "NaN" }, players: [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }] }; // { name: "name", playeruid: "playeruid", steamid: "steamid" },
  widgetExtra = { memMB: "NaN", memHeap: "NaN", memHeapTotal: "NaN" };
  intvalStats: IIntValStats = { idleStart: 0, idleEnd: 0, duration: 0 };
  lastUpdates: ILastUpdatesSTATS = {
    initStats: { last: 0, count: 0, success: false }, comparePids: { last: 0, count: 0, success: false }, updateAllStats: { last: 0, count: 0, success: false }, getSI: { last: 0, count: 0, success: false }, getPU: { last: 0, count: 0, success: false }, getLatencyGoogle: {
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
    "timestamp": string,
    "heap memory": string,
    "total heap": string,
    "ErrLog count": number,
    [key: string]: string | boolean | number,
  };
  "pid": {
    "exists": boolean,
    "readable": boolean,
    "found": boolean,
    "pid": string,
    "SI pid": string,
    "PU pid": string,
    "upTime": string,
    "cTime": string,
    [key: string]: string | boolean,
  };
  "web": {
    "web has conn": boolean,
    "clients alive": number,
    "client counter": number,
    "messages sent": number,
    "IDLE time": string,
    [key: string]: string | boolean | number,
  };
  "server": {
    "Ping": string,
    "CPU load": string,
    "SI Mem": string,
    "PU Mem": string,
    [key: string]: string | boolean,
  };
  [key: string]: { [key: string]: boolean | string | number } | string | boolean | number;
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
    guiStart: { last: 0, count: 0, success: false },
  };
  constructor() { }
}

export class serverStats implements IServerStats {
  webHandle = { isAlive: false, hasConnection: false };
  fileHandle = { isAlive: false, hasConnection: false };
  lastUpdates = { createServer: { last: 0, count: 0, success: false }, rconConnect: { last: 0, count: 0, success: false }, rconDisconnect: { last: 0, count: 0, success: false }, rconGetStatsInfo: { last: 0, count: 0, success: false }, rconGetStatsPlayers: { last: 0, count: 0, success: false }, startPidWatcher: { last: 0, count: 0, success: false }, updatePid: { last: 0, count: 0, success: false } };
  constructor() { }
}

interface IClientsStats {
  webHandle: IwebHandleStats,
  fileHandle: IfileHandleStats,
  clientsCounter: number,
  activeClients: number,
  lastUpdates: ILastUpdatesCLIENTS,
}

export class clientsStats implements IClientsStats {
  webHandle = { connectedClients: 0 };
  fileHandle = { connectedClients: 0 };
  clientsCounter = 0;
  activeClients = 0;
  lastUpdates = { statsUpdated: { last: 0, count: 0, success: false }, subscribe: { last: 0, count: 0, success: false }, unsubscribe: { last: 0, count: 0, success: false }, messagePayload: { last: 0, count: 0, success: false } };
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
        "gui": ["start", "stop", "draw", "guiStart"],
        "global": ["initStats", "comparePids", "updateAllStats", "getSI", "getPU", "widgetStats", "getLatencyGoogle"],
        "server": ["createServer", "rconConnect", "rconDisconnect", "rconGetStatsInfo", "rconGetStatsPlayers", "startPidWatcher", "updatePid"],
        "clients": ["statsUpdated", "subscribe", "unsubscribe", "messagePayload"]
      };
  
      for (let category of categories) {
        for (let func of functions[category]) {
          lastUpdatesTab.push(this.calcLastUpdateValues(category, func));
        }
      }
      return lastUpdatesTab as IFormatedLastUpdates;
    };
    this.getFormatedStats = (): IFormatedStats => {
      const dur: number = Math.floor(Date.now() - this.global.intvalStats.idleStart);
      const FormatedStats = {
        "header": {
          "address": `${settingsContainer.getSetting('rcon', 'host')}:${settingsContainer.getSetting('server', 'streamServerPort')}`,
          "alive": this.server.webHandle.isAlive,
          "Events (GUI | APP)": `${EventEmitterMixin.eventStats.activeEvents} | ${EventEmitterMixin.eventStats.guiActiveEvents}`,
          "Widget WxH": `${this.gui.selfStats.width}x${this.gui.selfStats.height}`,
        },
        "widget": {
          "refresh rate": this.gui.selfStats.isPainting,  // , guiAlive: `${this.settings.gui.period} ms`)
          "uptime": `${this.global.widget.elapsed}`,
          "ctime": `${this.global.widget.ctime}`,
          "CPU load": `${this.global.widget.cpuLoad}`,
          "memory usage": `${this.global.widget.memoryFormated}`,
          "timestamp": `${this.global.widget.formattedTime}`,
          "heap memory": `${this.global.widgetExtra.memHeap}`,
          "total heap": `${this.global.widgetExtra.memHeapTotal}`,
          "ErrLog count": this.gui.selfStats.capturedErrors,
        },

        "pid": {
          "exists": this.global.pid.fileExists,
          "readable": this.global.pid.fileReadable,
          "found": this.global.pid.processFound,
          "pid": `${settingsContainer.getSetting('pid', 'pid')}`,
          "SI pid": `${this.global.si.pid}`,
          "PU pid": `${this.global.pu.pid}`,
          "upTime": this.global.pu.elapsedFormated,
          "cTime": this.global.pu.ctimeFormated,
        },
        "web": {
          "web has conn": this.server.webHandle.hasConnection,
          "clients alive": this.clients.activeClients,
          "client counter": this.clients.clientsCounter,
          "messages sent": -1,
          "IDLE time": `${typeof dur === 'number' && dur > 0 ? calcDurationDetailed(dur) : 'NaN'}`,
          //"IDLE start": idleStart,
          //"IDLE end": idleEnd,
        },
        "server": {
          "Ping": `${this.global.latencyGoogle}`,
          "CPU load": `${this.global.pu.cpuFormated}`,
          "SI Mem": `${this.global.si.memFormated}`,
          "PU Mem": `${this.global.pu.memFormated}`,
        },
      };
      return FormatedStats;
    };
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
    statsObject.lastUpdates[index].count++;
    statsObject.lastUpdates[index].success = success;
  }

  private calcLastUpdateValues(category: string, index: string): { cat: string, function: string, lastUpdate: string, idleTime: string, no: number, success: boolean } {

    const statsObject = this[category].lastUpdates;
    const object = statsObject[index];
    if (object.last === 0) {
      return { 'cat': category, 'function': index, 'lastUpdate': "NaN", 'idleTime': "NaN", 'no': 0, 'success': false };
    }
    const diff = Date.now() - object.last;
    const counter = object.count;
    const timeConverted: string = convertTimestampToTime(object.last as number) || "NaN";
    const idleTime: string = calcDurationDetailed(diff as number) || "NaN";
    return { 'cat': category, 'function': index, 'lastUpdate': timeConverted, 'idleTime': idleTime, 'no': counter, 'success': object.success };
  }

}

export const StatsWrapperSymbol = Symbol('statsWrapper'); 
