"use strict";
import { injectable } from 'inversify';
import 'reflect-metadata';

import pidusage, { Status } from 'pidusage';
import si from 'systeminformation';
import { IBaseEvent, IStatsEvent, MainEventTypes, SubEventTypes } from "../global/eventInterface";
import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from "../global/statsInstance";
import { settingsContainer, statsContainer } from '../global/containerWrapper';
import { calcDurationDetailed } from '../global/functions';

@injectable()
export class Stats {
  private eV: EventEmitterMixin = mixin;
  protected gatherStatsIntval: NodeJS.Timeout = setInterval(() => { this.updateAllStats(); }, 5000);
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
      let subType = typeof event.subType === 'string' ? event.subType : 'no subtype';
      let message = typeof event.message === 'string' ? event.message : `no message | ${subType}`;
      let success = typeof event.success === 'boolean' ? event.success : false;
      let json = typeof event.json !== 'undefined' ? event.json : { "no": "json" };
  
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        success: success,
        message: message,
        json: json,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);      const type = event.subType;
      if (!type) throw new Error('No event type provided');
      switch (type) {
        case SubEventTypes.STATS.UPDATE_ALL:
          this.updateAllStats();
          break;
        case SubEventTypes.STATS.START_INTERVAL:
          this.gatherStatsIntvalToggle('start');
          break;
        case SubEventTypes.STATS.STOP_INTERVAL:
          this.gatherStatsIntvalToggle('stop');
          break;
        case SubEventTypes.STATS.IDLE_INTERVAL:
          this.gatherStatsIntvalToggle('idle');
          break;
        case SubEventTypes.STATS.RESUME_INTERVAL:
          this.gatherStatsIntvalToggle('resume');
          break;
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
    const time_diff = Date.now() - this.stats.global.lastUpdates.getLatencyGoogle.last;
    if (!this.stats.global.lastUpdates.getLatencyGoogle.last || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    if (this.stats.global.pid.processFound) {

      this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.RCON_GET_STATS, message: `STATS -> SERVER.RCON_GET_STATS` });
      Promise.all([this.getSI(), this.getPU(), this.getWidgetStats()]).then(() => {
        Promise.resolve();
        this.stats.updateLastUpdates("global", "updateAllStats", true);
      }).catch((error) => {
        Promise.reject();
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `updateAllStats`, MainEventTypes.STATS, new Error(`Promise updateStats ALL failed`), error);
      });
    }
    // console.dir(this.settings);
  }


  private async getWidgetStats() {
    this.stats.updateLastUpdates("global", "widgetStats");
    try {
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

  private async comparePids(): Promise<boolean> {
    this.stats.updateLastUpdates("global", "comparePids");
    let message = `comparePids started`;
    let success = false;
    if (!this.stats.global.pid.fileReadable || this.settings.pid.pid === -1) return false;
    await this.getSI().then(() => {
      message = `comparePids getSI finished`;
      if (this.stats.global.si.pid === -1) throw new Error(`comparePids getSI pid not found`);
      if (this.stats.global.si.pid != this.settings.pid.pid) throw new Error(`comparePids pid mismatch`);

      message = `comparePids success`;
      success = true;
      this.stats.updateLastUpdates("global", "comparePids", true);
      this.stats.updateLastUpdates("main", "start", true);
    }).catch(() => {
      this.settings.pid.pid = -1;
      success = false;
    }).finally(() => {
      this.stats.global.pid.processFound = success;
      const processFoundEvent: IBaseEvent = {
        subType: SubEventTypes.MAIN.PROCESS_FOUND,
        message: message,
        success: success,
      };
      this.eV.emit(MainEventTypes.MAIN, processFoundEvent);
    });
    return success;
  }

  private async getSI(): Promise<void> {
    this.stats.updateLastUpdates("global", "getSI");
    let success = false;
    let message = "getSI started"
    await si.processLoad("PalServer-Linux", (targetProcesses: si.Systeminformation.ProcessesProcessLoadData[]) => {
      if (this.settings.pid.pid === -1) return message = `getSI pid is -1`;
      if (!targetProcesses || !(targetProcesses.length > 0))
        return message = `getSI targetProcesses not found`;

      const processInfo = targetProcesses.find((p) => p.pid === settingsContainer.getSetting('pid', 'pid'));
      if (!processInfo) return message = `getSI processInfo not found`;

      message = `getSI processInfo found`;
      const memFormatedValue = Intl.NumberFormat('en-US', { notation: "compact", style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', maximumFractionDigits: 0 });
      const memFormated = memFormatedValue.format(processInfo.mem / 1024 / 1024);
      this.stats.global.si = { ...processInfo, memFormated: memFormated };
      // console.dir(this.stats.global.si, { depth: null, colors: true });
      this.stats.updateLastUpdates("global", "getSI", true);
      message = `getSI finished`;
      success = true;
      return { message: message, success: success }
    }).catch((error) => {
      message = `getSI error ${error.message ? error.message : `getSI failed with no error`}`;
      this.settings.pid.pid = -1;
      success = false;
    }).finally(() => {
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `${message}`,
        success: success,
      };
      if (!success) this.eV.emit(MainEventTypes.BASIC, newEvent);
    });
  }

  async getPU(): Promise<void> {
    this.stats.updateLastUpdates("global", "getPU");
    if (!this.stats.global.pid.processFound) return;
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
      this.stats.updateLastUpdates("global", "getPU", true);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, `getPU`, MainEventTypes.STATS, new Error(`pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
    }
  }
  private gatherStatsIntvalToggle(action: string) {
    switch (action) {
      case 'start':
        this.stats.updateLastUpdates('global', 'gatherIntval', true);
        this.eV.emitOnce(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `intervalStart | Interval started, idle time: ${Date.now() - this.stats.global.lastUpdates.gatherStatsIntval.last} ms.`, success: true, });
        // console.log(`intervalStart: Interval started, idle time: ${this.intvalStats.idleEnd - this.intvalStats.idleStart}ms.`);
        this.updateAllStats();
        this.gatherStatsIntval = setInterval(() => {
          this.updateAllStats();
          // this.clients.handleClientsUpdateStats();
        }, this.settings.pid.period);
        this.settings.pid.shouldStop = false;
        this.stats.global.isGathering = true;
        break;
      case 'stop':
        this.settings.pid.shouldStop = true;
        this.stats.global.isGathering = false;

        this.stats.updateLastUpdates('global', 'gatherIntval');
        // console.log("intervalStart: no action taken. clientsCounter:");
        clearInterval(this.gatherStatsIntval);
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `intervalStop | Interval stopped.`, success: true, });
        this.stats.global.isGathering = false;
        break;
      case 'idle':
        this.settings.pid.shouldIdle = true;
        this.settings.pid.shouldStop = false;
        this.stats.global.isGathering = true;
        this.stats.updateLastUpdates('global', 'gatherIntval', true);
        // console.log("intervalStart: no action taken. clientsCounter:");
        clearInterval(this.gatherStatsIntval);
        this.gatherStatsIntval = setInterval(() => {
          this.updateAllStats();
          // this.clients.handleClientsUpdateStats();
        }, 30000);
        
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `intervalIdle | Interval idle.`, success: true, });
        break;
      case 'resume':
        this.settings.pid.shouldIdle = false;
        this.settings.pid.shouldStop = false;
        this.stats.global.isGathering = true;
        this.stats.updateLastUpdates('global', 'gatherIntval', true);
        // console.log("intervalStart: no action taken. clientsCounter:");
        this.updateAllStats();
        clearInterval(this.gatherStatsIntval);
        this.gatherStatsIntval = setInterval(() => {
          this.updateAllStats();
          // this.clients.handleClientsUpdateStats();
        }, this.settings.pid.period);
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `intervalResume | Interval resumed.`, success: true, });
        break;
      case 'change':
        this.settings.pid.shouldStop = false;
        this.settings.pid.shouldIdle = false;
        this.stats.global.isGathering = true;
        this.stats.updateLastUpdates('global', 'gatherIntval');
        clearInterval(this.gatherStatsIntval);
        this.gatherStatsIntval = setInterval(() => {
          this.updateAllStats();
          // this.clients.handleClientsUpdateStats();
        }, this.settings.pid.period);
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `intervalChange | Interval changed.`, success: true, });
        break;
      default:
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `gatherStatsIntvalToggle`, MainEventTypes.STATS, new Error(`Unknown status: ${this.stats.global.lastUpdates.gatherStatsIntval.success}`));
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