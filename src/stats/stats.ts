"use strict";
import { Container, inject, injectable } from 'inversify';
import 'reflect-metadata';

import { readFile } from 'node:fs/promises';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as fs from 'fs';
import { BaseEvent, CustomErrorEvent, IBaseEvent, IClientsEvent, IEventTypes, IMainEvent, IServerEvent, IStatsEvent, MainEventTypes, SubEventTypes } from "../global/eventInterface";
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { ClientType, MyWebSocket } from '../clients/clientInstance';
import { SettingsWrapperSymbol, settingsWrapper } from '../settings/settingsInstance';
import { StatsWrapperSymbol, statsWrapper } from "../stats/statsInstance";
import { settingsContainer, statsContainer } from '../global/containerWrapper';

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Stats {
  private eV: EventEmitterMixin = EventMixin;
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;
  constructor() {
    this.eV = EventMixin;
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "createStats": Date.now() };
    // this.updateAllStats();
    this.eV.on(MainEventTypes.STATS, this.handleStatsEvent.bind(this));
  }

  private handleStatsEvent(event: IEventTypes) {
    const type = event.subType;
    if (!type) throw new Error('No event type provided');
    switch (type) {
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
        // console.log("Stats:");
        // console.dir(this.stats.global, { depth: null, colors: true });
        // console.dir(this.settings, { depth: null, colors: true });
        // console.dir(this.handle, { depth: 2, colors: true });
        break;
      case SubEventTypes.STATS.PREPARE:
        this.updateAndGetPidIfNecessary();
        break;
      default:
        this.eV.handleError(MainEventTypes.ERROR, `Unknown stats event subtype: ${event.subType}`, new CustomErrorEvent(`Unknown stats event subtype: ${event.subType}`, MainEventTypes.STATS, event));
      // console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  private async updateAllStats(): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "updateAllStats": Date.now() };
    if (this.settings.pid.processFound) {
      this.getSI();
      this.getPU();
      // this.rconGetStats(); // TODO: Fix this
    }

    const time_diff = Date.now() - this.stats.global.lastUpdates.getLatencyGoogle;
    if (!this.stats.global.lastUpdates.getLatencyGoogle || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    // console.dir(this.settings);
  }

  private async forceUpdateAllStats(id: string = "ALL"): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "forceUpdateAllStats": Date.now() };
    if (!this.settings.pid.processFound) return this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `forceUpdateAllStats | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}, processFound: ${this.settings.pid.processFound}`, success: false });
    await Promise.all([this.getPU(), this.getLatencyGoogle(true)]); // TODO: fix this , this.rconGetStats(true)
    this.eV.emit(MainEventTypes.STATS, {
      subType: SubEventTypes.CLIENTS.MESSAGE_PAKET_READY,
      message: `allStatsUpdated`,
      data: [{ "pidInfo": { ...this.stats.global.pu } }, { "latencyGoogle": this.stats.global.latencyGoogle }, { "rconInfo": { ...this.stats.global.rcon.info } }, { "rconPlayers": { ...this.stats.global.rcon.players } }],
      clientsEvent: { id: id, ip: "ALL", clientType: ClientType.Basic, client: {} as MyWebSocket },
    });
  }


  async getLatencyGoogle(force: boolean = false): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "getLatencyGoogle": Date.now() };
    try {
      const latency = await si.inetLatency();
      this.stats.global.latencyGoogle = latency;
      const latencyGoogleEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `latencyGoogle updated ${this.stats.global.lastUpdates.getLatencyGoogle}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, latencyGoogleEvent);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `getLatencyGoogle`, new CustomErrorEvent(`Error`, MainEventTypes.STATS, error));
      this.stats.global.latencyGoogle = "NaN";
    }
  }

  // this.settings.pid.fileReadable = true;
  // const pidEvent: IBaseEvent = {
  //   subType: SubEventTypes.MAIN.PID_AVAILABLE, // Define an appropriate subType
  //   message: 'pidAvailable',
  // };
  // this.eV.emit(MainEventTypes.MAIN, pidEvent);
  public async updateAndGetPidIfNecessary(): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "updateAndGetPidIfNecessary": Date.now() };
    this.getSI().then(() => {
      if (!this.comparePids()) throw new Error(`updateAndGetPidIfNecessary | Pid mismatch`);
      this.settings.pid.processFound = true;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `updateAndGetPidIfNecessary | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    }).catch((error) => {
      this.settings.pid.processFound = false;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `updateAndGetPidIfNecessary | pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "updateAndGetPidIfNecessary", new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`, MainEventTypes.STATS, error));
    });
  }

  comparePids(): boolean {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "comparePids": Date.now() };
    if (this.settings.pid.fileReadable && (this.settings.pid.pid !== "NaN" && this.stats.global.si.pid !== "NaN" && ((this.stats.global.si.pid == this.settings.pid.pid)))) {
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
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "getSI": Date.now() };
    si.processLoad("PalServer-Linux").then((targetProcesses) => {
      if (!targetProcesses || !(targetProcesses.length > 0)) throw new Error(`No targetProcesses found`);
      const processInfo = targetProcesses.find((p) => p.pid === this.settings.pid.pid);
      if (processInfo) {
        this.stats.global.si = { ...processInfo };
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `getSI`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
        // console.dir(this.stats.global.si, { depth: null, colors: true });
      }
    }).catch((error) => {
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `getSI`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.eV.handleError(SubEventTypes.ERROR.WARNING, `getSI`, new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`, MainEventTypes.STATS, error));
    });
  }

  async getPU(): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "getPU": Date.now() };
    if (this.settings.pid.pid !== undefined) {
      try {
        const pidInfo = await pidusage(this.settings.pid.pid);
        if (!pidInfo) throw new Error(`No pidInfo for pid: ${this.settings.pid.pid}`);
        this.stats.global.pu = { ...pidInfo }; // Map relevant properties
        const puEvent: IClientsEvent = {
          subType: SubEventTypes.CLIENTS.MESSAGE_READY,
          message: `pidInfo`,
          success: true,
          data: this.stats.global.pu,
          clientsEvent: { id: "ALL", ip: "ALL", clientType: ClientType.Basic, client: {} as MyWebSocket },
        };
        this.eV.emit(MainEventTypes.CLIENTS, puEvent);
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `getPU`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
        // console.dir(this.stats.global.pu, { depth: null, colors: true });
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `getPU`, new CustomErrorEvent(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`, MainEventTypes.STATS, error));
      }
    }
  }
}
/*
import { inject, injectable } from 'inversify';
import { Stats } from './stats'; 
import { Server } from '../server/server';
import { ClientType } from '../clients/clientInstance';
import { globalStats } from './statsInstance';
import { settings } from '../global/containerWrapper';
import { StatsType } from '../../.not_used/test1 copy 4';

@injectable()
export class StatsMonitor {
    @inject(Stats) private statsService!: Stats;

    startMonitoring() {
        this.stats.globalService.on('latencyUpdated', (event: IStatsEvent) => {
            // Handle latency updates
        });

        this.stats.globalService.on('statsUpdated', (event: IStatsEvent) => {
            // Handle comprehensive stats updates
        });
    }
} */ 