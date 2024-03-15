"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable, postConstruct } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as fs from 'fs';
import { BaseEvent, CustomErrorEvent, IBaseEvent, IClientsEvent, IEventTypes, IMainEvent, IServerEvent, IStatsEvent, MainEventTypes, SubEventTypes, debugDataCallback } from "../global/eventInterface";
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IGlobalStats, globalStats, IStatsSettings, statsSettings, IHandle, Handle, packetHandlers } from "./statsInstance";
import { RconConnection } from '../rcon/lib/server/connection';
import { parsePlayers, splitInfo } from '../rcon/lib/player';
import { Client } from 'mqtt/*';
import { ClientType, MyWebSocket } from '../clients/clientInstance';

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Stats {
  private eV: EventEmitterMixin = EventMixin;
  private stats: IGlobalStats = new globalStats();
  private settings: IStatsSettings = new statsSettings();
  private handle: IHandle = new Handle();
  constructor() {
    this.eV = EventMixin;
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "createStats": Date.now() };
    // this.updateAllStats();
    this.eV.on(MainEventTypes.STATS, this.handleStatsEvent.bind(this));
  }

  private handleStatsEvent(event: IEventTypes) {
    const type = event.subType;
    if (!type) throw new Error('No event type provided');
    switch (type) {
      case SubEventTypes.STATS.GET_PID:
        this.getPid();
        break;
      case SubEventTypes.STATS.UPDATE_ALL:
        this.updateAllStats();
        break;
      case SubEventTypes.STATS.FORCE_UPDATE_ALL:
        this.forceUpdateAllStats();
        break;
      case SubEventTypes.STATS.FORCE_UPDATE_ALL_FOR_ME:
        this.forceUpdateAllStats(event.message);
        break;
      case SubEventTypes.STATS.PRINT_DEBUG:
        console.log("Stats:");
        console.dir(this.stats, { depth: null, colors: true });
        console.dir(this.settings, { depth: null, colors: true });
        console.dir(this.handle, { depth: 2, colors: true });
        break;
      case SubEventTypes.STATS.PREPARE:
        this.updateAndGetPidIfNecessary();
        break;
      case SubEventTypes.STATS.RCON_CONNECT:
        try {
          this.rconConnect().then(() => {
            this.sendRconCommand('info').then((response) => {
            });
          });
        } catch (error) {
          this.eV.handleError(SubEventTypes.ERROR.WARNING, "Rcon connect error", new CustomErrorEvent("weird", MainEventTypes.STATS, error));
        }
        // this.serverActive(event);
        break;
      case SubEventTypes.STATS.RCON_DISCONNECT:
        this.rconDisconnect();
        // this.serverActive(event);
        break;

      default:
        console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  private async updateAllStats(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAllStats": Date.now() };
    if (this.settings.pid.serverFound) {
      this.getSI();
      this.getPU();
      this.rconGetStats();
    }

    const time_diff = Date.now() - this.stats.lastUpdates.getLatencyGoogle;
    if (!this.stats.lastUpdates.getLatencyGoogle || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    // console.dir(this.settings);
  }

  private async forceUpdateAllStats(id: string = "ALL"): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "forceUpdateAllStats": Date.now() };
    if (!this.settings.pid.serverFound) return this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `forceUpdateAllStats | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}, serverFound: ${this.settings.pid.serverFound}`, success: false });
    await Promise.all([this.getPU(), this.rconGetStats(true), this.getLatencyGoogle(true)]);
    this.eV.emit(MainEventTypes.STATS, {
      subType: SubEventTypes.CLIENTS.MESSAGE_PAKET_READY,
      message: `allStatsUpdated`,
      data: [ { "pidInfo": { ...this.stats.pu } }, { "latencyGoogle": this.stats.latencyGoogle }, { "rconInfo": { ...this.stats.rcon.info } }, { "rconPlayers": { ...this.stats.rcon.players } } ],
      clientsEvent: { id: id, ip: "ALL", clientType: ClientType.Basic, client: { } as MyWebSocket},
    });
  }

  async rconConnect(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "rconConnect": Date.now() };
    this.handle.rcon = new RconConnection();
    try {
      const RCON_HOSTNAME = this.settings.rcon.host;
      const RCON_PORT = this.settings.rcon.port;
      const RCON_PASSWORD = this.settings.rcon.pw;

      if (this.handle.rcon) {
        await this.handle.rcon.connect(RCON_HOSTNAME, RCON_PORT, RCON_PASSWORD);
        if (!this.handle.rcon.connectedWithoutError) throw new Error(`RCON connected with error`);
        this.settings.rcon.isConnected = true;
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `RCON connected`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
        this.rconGetStats();
      }
    } catch (error: any) {
      this.settings.rcon.isConnected = false;
      this.handle.rcon = undefined;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON connect failed`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    }
  }

  rconDisconnect() {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "rconDisconnect": Date.now() };
    if (this.handle.rcon) {
      this.handle.rcon.client.resetAndDestroy();
      this.settings.rcon.isConnected = false;
      this.handle.rcon = undefined;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    }
  }

  async rconGetStats(force: boolean = false): Promise<void> {
    if (!this.settings.rcon.isConnected) return this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `RCON not connected`, success: false });
    if (force || !this.stats.lastUpdates.rconGetStatsInfo || (Date.now() - this.stats.lastUpdates.rconGetStatsInfo) > 60000) {
      try {
        const info = await this.sendRconCommand('Info');
        if (!info) throw new Error(`No info from rcon`);
        this.stats.lastUpdates = { ...this.stats.lastUpdates, "rconGetStatsInfo": Date.now() };
        this.stats.rcon.info = splitInfo(info);
        const rconInfoEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconInfo updated ${this.stats.lastUpdates.rconGetStatsInfo}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, rconInfoEvent);
      } catch (error) {
        this.stats.rcon.info = { name: "NaN", ver: "NaN" };
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Info`, new CustomErrorEvent(`rconGetStatsInfo failed`, MainEventTypes.STATS, error));
      };
    }
    if (!this.stats.lastUpdates.rconGetStatsShowPlayers || (Date.now() - this.stats.lastUpdates.rconGetStatsShowPlayers) > 5000) {
      try {
        const players = await this.sendRconCommand('ShowPlayers');
        if (!players) throw new Error(`No players from rcon`);
        this.stats.lastUpdates = { ...this.stats.lastUpdates, "rconGetStatsShowPlayers": Date.now() };
        this.stats.rcon.players = parsePlayers(players);
        const rconPlayersEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconPlayers updated ${this.stats.lastUpdates.rconGetStatsShowPlayers}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, rconPlayersEvent);
      } catch (error) {
        this.stats.rcon.players = [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON ShowPlayers`, new CustomErrorEvent("rconGetStatsShowPlayers failed", MainEventTypes.STATS, error));
      }
    }
  }
  async sendRconCommand(command: string): Promise<string | undefined> {
    if (this.handle.rcon && this.settings.rcon.isConnected) {
      try {
        // Ensure RCON connection if not open? rconConnection.connect();
        const response = await this.handle.rcon.exec(command);
        return response.body; // Or format the response if needed
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Command`, new CustomErrorEvent("sedRconCommand failed", MainEventTypes.STATS, error));
        // Return an error message
      }
    } else {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON`, new CustomErrorEvent("RCON not connected", MainEventTypes.STATS, new Error("RCON not connected")));
    }
  }

  async getLatencyGoogle(force: boolean = false): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getLatencyGoogle": Date.now() };
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;
      const latencyGoogleEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `latencyGoogle updated ${this.stats.lastUpdates.getLatencyGoogle}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, latencyGoogleEvent);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `getLatencyGoogle`, new CustomErrorEvent(`Error`, MainEventTypes.STATS, error));
      this.stats.latencyGoogle = "NaN";
    }
  }

  private async updatePid() {
    try {
      const data = await readFile(this.settings.pid.file, 'utf-8' as BufferEncoding);
      if (!data || !(data.length > 0)) throw `No data in pid file: ${this.settings.pid.file}`;
      this.settings.pid.fileExists = true;
      this.settings.pid.pid = parseInt(data, 10)

      if (!this.settings.pid.fileExists || !this.settings.pid.pid || typeof this.settings.pid.pid !== 'number' || !(this.settings.pid.pid > 0)) throw new Error(`Invalid pid: ${this.settings.pid.pid}`);
      this.settings.pid.fileReadable = true;

      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      // ... restliche Logik zum Verarbeiten der neuen PID
    } catch (error) {
      const pidEvent: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_UNAVAILABLE, // Define an appropriate subType
        message: `pid: ${this.settings.pid.pid}`,
        success: false,
      };
      this.eV.emit(MainEventTypes.MAIN, pidEvent);
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `pid: ${this.settings.pid.pid}`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.settings.pid.fileReadable = false;
      this.settings.pid.pid = undefined;
      this.settings.pid.serverFound = false;
      this.eV.handleError(SubEventTypes.ERROR.INFO, "updatePid", new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`, MainEventTypes.STATS, error));
    }
  }
  // this.settings.pid.fileReadable = true;
  // const pidEvent: IBaseEvent = {
  //   subType: SubEventTypes.MAIN.PID_AVAILABLE, // Define an appropriate subType
  //   message: 'pidAvailable',
  // };
  // this.eV.emit(MainEventTypes.MAIN, pidEvent);
  public async getPid(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPid": Date.now() };
    this.updatePid().then(() => {
      const watcher = fs.watch(this.settings.pid.file, (eventType, file) => {
        if (eventType === 'change') {
          this.updatePid(); // Neue Funktion zum erneuten Einlesen
        }
      });
      this.handle.pidWatcher = watcher;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `Pid Watcher online`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      const resultData: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_AVAILABLE,
        message: `pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.MAIN, resultData);
    }).catch((error) => {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "getPid", new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`, MainEventTypes.STATS, error));
      this.settings.pid.fileReadable = false;
      this.settings.pid.fileExists = false;
      this.settings.pid.pid = undefined;
    });
  }
  public async updateAndGetPidIfNecessary(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAndGetPidIfNecessary": Date.now() };
    try {
      const SI = await this.getSI();
      if (this.comparePids()) {
        this.settings.pid.serverFound = true;
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `updateAndGetPidIfNecessary | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
      } else {
        this.settings.pid.serverFound = false;
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `updateAndGetPidIfNecessary | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`,
          success: false,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
      }
    } catch (error) {
      this.settings.pid.serverFound = false;
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "updateAndGetPidIfNecessary", new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`, MainEventTypes.STATS, error));
    }
  }

  comparePids(): boolean {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "comparePids": Date.now() };
    if (this.settings.pid.fileReadable && (this.settings.pid.pid && this.stats.si.pid && ((this.stats.si.pid == this.settings.pid.pid)))) {
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        success: true,
        message: `comparePids`,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      return true;
    }
    const newEvent: IBaseEvent = {
      subType: SubEventTypes.BASIC.STATS,
      success: false,
      message: `comparePids`,
    };
    this.eV.emit(MainEventTypes.BASIC, newEvent);
    return false;
  }

  async getSI(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getSI": Date.now() };
    si.processLoad("PalServer-Linux").then((targetProcesses) => {
      if (targetProcesses && targetProcesses.length > 0) {
        const processInfo = targetProcesses.find((p) => p.pid === this.settings.pid.pid);
        if (processInfo) {
          this.stats.si = { proc: processInfo.proc, pid: processInfo.pid, cpu: processInfo.cpu, mem: processInfo.mem };
          const newEvent: IBaseEvent = {
            subType: SubEventTypes.BASIC.STATS,
            message: `getSI`,
            success: true,
          };
          this.eV.emit(MainEventTypes.BASIC, newEvent);
          // console.dir(this.stats.si, { depth: null, colors: true });
        }
      } else {
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `getSI`,
          success: false,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
      }
    }).catch((error) => {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, `getSI`, new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`, MainEventTypes.STATS, error));
    });
  }

  async getPU(): Promise<void> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPU": Date.now() };
    if (this.settings.pid.pid !== undefined) {
      try {
        const pidInfo = await pidusage(this.settings.pid.pid);
        if (!pidInfo) throw new Error(`No pidInfo for pid: ${this.settings.pid.pid}`);
        this.stats.pu = { cpu: pidInfo.cpu, memory: pidInfo.memory, pid: pidInfo.pid, ctime: pidInfo.ctime, elapsed: pidInfo.elapsed, timestamp: pidInfo.timestamp }; // Map relevant properties
        const puEvent: IClientsEvent = {
          subType: SubEventTypes.CLIENTS.MESSAGE_READY,
          message: `pidInfo`,
          success: true,
          data: this.stats.pu,
          clientsEvent: { id: "ALL", ip: "ALL", clientType: ClientType.Basic, client: { } as MyWebSocket},
        };
        this.eV.emit(MainEventTypes.CLIENTS, puEvent);
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `getPU`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
        // console.dir(this.stats.pu, { depth: null, colors: true });
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `getPU`, new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.si.pid}`, MainEventTypes.STATS, error));
      }
    }
  }
}
/*
import { inject, injectable } from 'inversify';
import { Stats } from './stats'; 
import { Server } from '../server/server';
import { ClientType } from '../clients/clientInstance';

@injectable()
export class StatsMonitor {
    @inject(Stats) private statsService!: Stats;

    startMonitoring() {
        this.statsService.on('latencyUpdated', (event: IStatsEvent) => {
            // Handle latency updates
        });

        this.statsService.on('statsUpdated', (event: IStatsEvent) => {
            // Handle comprehensive stats updates
        });
    }
} */ 