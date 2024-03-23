"use strict";
import { injectable } from 'inversify';
import 'reflect-metadata';

import pidusage, { Status } from 'pidusage';
import si from 'systeminformation';
import { IBaseEvent, IClientsEvent, IStatsEvent, MainEventTypes, SubEventTypes } from "../global/eventInterface";
import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { MyWebSocket } from '../clients/clientInstance';
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from "../stats/statsInstance";
import { settingsContainer, statsContainer } from '../global/containerWrapper';
import { calcDurationDetailed } from '../global/functions';

@injectable()
export class Stats {
  private eV: EventEmitterMixin = mixin;
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;
  constructor() {
    this.stats.global.widget.pid = process.pid;
    this.stats.updateLastUpdates("global", "initStats", true);
    // this.updateAllStats();
    this.setupEventHandlers();
  }

 
  private setupEventHandlers() {
    this.eV.on(MainEventTypes.STATS, (event: IStatsEvent) => {
      const type = event.subType;
      if (!type) throw new Error('No event type provided');
      switch (type) {
        case SubEventTypes.STATS.UPDATE_ALL:
          this.updateAllStats();
          break;
        // case SubEventTypes.STATS.FORCE_UPDATE_ALL:
        //   this.forceUpdateAllStats();
        //   break;
        // case SubEventTypes.STATS.FORCE_UPDATE_ALL_FOR_ME:
        //   this.forceUpdateAllStats(event.message);
        //   break;
        case SubEventTypes.STATS.PRINT_DEBUG:
          // console.log("Stats:");
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `STATS` });
          // console.dir(this.handle, { depth: 2, colors: true });
          break;
        case SubEventTypes.STATS.PREPARE:
          this.stats.updateLastUpdates("server", "startPidWatcher", true);
          this.stats.updateLastUpdates("main", "start");
          this.comparePids();
          break;
        default:
          this.eV.handleError(SubEventTypes.ERROR.WARNING, `Unknown stats event subtype: ${event.subType}`, MainEventTypes.STATS, new Error(`Unknown stats event subtype: ${event.subType}`), event);
        // console.warn('Unknown stats event subtype:', event.subType);
      }
    });
  }

  private async updateAllStats(): Promise<void> {
    this.stats.updateLastUpdates("global", "updateAllStats");
    if (this.stats.global.pid.processFound) {
      // this.rconGetStats(); // TODO: Fix this
      Promise.all([this.getSI(), this.getPU(), this.getWidgetStats()]).then(() => {;
        this.stats.updateLastUpdates("global", "updateAllStats", true);
      }).catch((error) => {
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `updateAllStats`, MainEventTypes.STATS, new Error(`Promise updateStats all failed`), error);
      });
    }
    const time_diff = Date.now() - this.stats.global.lastUpdates.getLatencyGoogle.last;
    if (!this.stats.global.lastUpdates.getLatencyGoogle.last || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    // console.dir(this.settings);
  }


  private async getWidgetStats() {
    this.stats.updateLastUpdates("global", "widgetStats");
    try {
      this.eV.emit(MainEventTypes.GUI, { subType: SubEventTypes.GUI.UPDATE_STATS, message: `updateAllStats` });
      const widgetStats = await pidusage(this.stats.global.widget.pid);
      const cpuValueFormat = Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const cpu = cpuValueFormat.format(widgetStats.cpu / 100)
      const memoryValueFormat = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', maximumFractionDigits: 0 });
      const memory = memoryValueFormat.format(widgetStats.memory / 1024 / 1024);
      const ctimeFormated = new Date(widgetStats.ctime).toISOString().substr(11, 8);
      const elapsedFormated = new Date(widgetStats.elapsed).toISOString().substr(11, 8);
      const formattedTime = calcDurationDetailed(widgetStats.timestamp);
      this.stats.global.widget = { ...widgetStats, formattedTime: formattedTime, cpuLoad: cpu, memoryFormated: memory, elapsedFormated: elapsedFormated, ctimeFormated: ctimeFormated };
      this.stats.updateLastUpdates("global", "widgetStats", true);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `getWidgetStats`, MainEventTypes.ERROR, new Error(`Error`), error);
    }
  }

  async getLatencyGoogle(): Promise<void> {
    this.stats.updateLastUpdates("global", "getLatencyGoogle");
    try {
      const letenceFormatedValue = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'millisecond', unitDisplay: 'narrow', maximumFractionDigits: 0 });
      const latency = await si.inetLatency();
      this.stats.global.latencyGoogle = letenceFormatedValue.format(latency);
      // const latencyGoogleEvent: IBaseEvent = {
      //   subType: SubEventTypes.BASIC.STATS,
      //   message: `latencyGoogle updated ${this.stats.global.lastUpdates.getLatencyGoogle}`,
      //   success: true,
      // };
      // this.eV.emit(MainEventTypes.BASIC, latencyGoogleEvent);
      this.stats.updateLastUpdates("global", "getLatencyGoogle", true);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `getLatencyGoogle`, MainEventTypes.STATS, new Error(`Error`), error);
      this.stats.global.latencyGoogle = "NaN";
    }
  }

  comparePids(): boolean {
    this.stats.updateLastUpdates("global", "comparePids");
    let success = false;
    this.getSI().then(() => {
      if (this.stats.global.pid.fileReadable && (this.settings.pid.pid !== "NaN" && this.stats.global.si.pid !== -1 && ((this.stats.global.si.pid == this.settings.pid.pid)))) {
        success = true;
        const processFoundEvent: IBaseEvent = {
          subType: SubEventTypes.MAIN.PROCESS_FOUND,
          message: `processFound`,
          success: success,
        };
        this.eV.emit(MainEventTypes.MAIN, processFoundEvent);
        this.stats.updateLastUpdates("global", "comparePids", true);
        this.stats.updateLastUpdates("main", "start", true);
      }
    }).catch((error) => {
      success = false;
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "comparePids", MainEventTypes.STATS, new Error(`pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
    }).finally(() => {
      this.stats.global.pid.processFound = success;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        success: success,
        message: `comparePids`,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    });
    return success;
  }

  async getSI(): Promise<void> {
    this.stats.updateLastUpdates("global", "getSI");
    await si.processLoad("PalServer-Linux", (targetProcesses) => {
      if (!targetProcesses || !(targetProcesses.length > 0)) throw new Error(`No targetProcesses found`);
      const processInfo = targetProcesses.find((p) => p.pid === this.settings.pid.pid);
      if (processInfo) {
        const memFormatedValue = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', maximumFractionDigits: 0 });
        const memFormated = memFormatedValue.format(processInfo.mem / 1024 / 1024);
        this.stats.global.si = { ...processInfo, memFormated: memFormated };
        // console.dir(this.stats.global.si, { depth: null, colors: true });
        this.stats.updateLastUpdates("global", "getSI", true);
      } else {
        throw new Error(`No processInfo found for pid: ${this.settings.pid.pid} in targetProcesses: ${targetProcesses}`);
      }

    }).catch((error) => {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, `getSI`, MainEventTypes.STATS, new Error(`pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
    });
    // .finally(() => {
    //   const newEvent: IBaseEvent = {
    //     subType: SubEventTypes.BASIC.STATS,
    //     message: `getSI`,
    //     success: success,
    //   };
    //   this.eV.emit(MainEventTypes.BASIC, newEvent);
    // });
  }

  async getPU(): Promise<void> {
    this.stats.updateLastUpdates("global", "getPU");
    if (this.settings.pid.pid !== undefined) {
      try {
        const pidInfo: Status = await pidusage(this.settings.pid.pid);
        if (!pidInfo) throw new Error(`No pidInfo for pid: ${this.settings.pid.pid}`);
        const cpuFormatedValue = Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const cpuFormated = cpuFormatedValue.format(pidInfo.cpu / 8 / 100);
        const memFormatedValue = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', maximumFractionDigits: 0 });
        const memFormated = memFormatedValue.format(pidInfo.memory / 1024 / 1024);
        const elapsedFormated = new Date(pidInfo.elapsed).toISOString().substr(11, 8);
        const ctimeFormated = new Date(pidInfo.ctime).toISOString().substr(11, 8);
        this.stats.global.pu = { ...pidInfo, elapsedFormated: elapsedFormated, ctimeFormated: ctimeFormated, cpuFormated: cpuFormated, memFormated: memFormated, }; // Map relevant properties
        const puEvent: IClientsEvent = {
          subType: SubEventTypes.CLIENTS.MESSAGE_READY,
          message: `pidInfo`,
          success: true,
          data: this.stats.global.pu,
          id: "ALL",
          client: {} as MyWebSocket,
        };
        this.eV.emit(MainEventTypes.CLIENTS, puEvent);
        // const newEvent: IBaseEvent = {
        //   subType: SubEventTypes.BASIC.STATS,
        //   message: `getPU`,
        //   success: true,
        // };
        // this.eV.emit(MainEventTypes.BASIC, newEvent);
        // console.dir(this.stats.global.pu, { depth: null, colors: true });
        this.stats.updateLastUpdates("global", "getPU", true);
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `getPU`, MainEventTypes.STATS, new Error(`pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
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
import { calcDurationDetailed } from '../global/functions';

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