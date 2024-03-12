"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable, postConstruct } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';

import * as eventI from "../global/eventInterface";
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IStats, statsWrapper } from "./statsInstance";
import { IprivateSettings, privateSettings } from '../settings/settingsInstance';

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Stats {
  private eV: EventEmitterMixin = EventMixin;
  public stats: IStats = new statsWrapper();
  private settings: IprivateSettings = new privateSettings();
  constructor() {
    this.eV = EventMixin;
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "createStats": Date.now() };
    // this.updateAllStats();
    this.eV.on(eventI.MainEventTypes.STATS, (data: eventI.IEventTypes) => { this.handleStatsEvent(data); });
  }
  private handleStatsEvent(event: eventI.IEventTypes) {
    const type = event.subType;
    if (!type) throw new Error('No event type provided');
    switch (type) {
      case eventI.SubEventTypes.STATS.UPDATE_ALL:
        this.updateAndGetPidIfNecessary().then(() => this.updateAllStats());
        break;
      default:
        console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  public async updateAllStats() {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAllStats": Date.now() };
    // let statsUpdated: eventI.IBaseEvent = {
    //   subType: eventI.SubEventTypes.STATS.ALL_STATS_UPDATED,
    //   message: '',
    //   success: false,
    // };
    let result: boolean = false;
    try {
      result = await this.getLatencyGoogle();
      result = await this.getSI();
      result = await this.getPU();
    } catch (error) {
      const statsUpdated = {
        subType: eventI.SubEventTypes.ERROR.INFO,
        message: 'Error updating stats',
        success: false,
        errorEvent: { errCode: 2, data: error }
      };
      console.error(eventI.MainEventTypes.ERROR, statsUpdated);
      this.stats.latencyGoogle = null;
    }
    // console.dir(this.settings);
    // console.dir(this.stats);
  }

  async getLatencyGoogle(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getLatencyGoogle": Date.now() };
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;
      return true;
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        subType: eventI.SubEventTypes.ERROR.INFO,
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: error }
      });
    }
    return false;
  }

  public async getPid(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPid": Date.now() };
    readFile(this.settings.pidFile, 'utf-8' as BufferEncoding).then((data) => { this.settings.pid = parseInt(data, 10) }).then(() => {
      this.settings.pidFileExists = true;
      this.settings.pidFileReadable = true;
      // const resultData: eventI.IBaseEvent = {
      //   mainTypes: [eventI.MainEventTypes.MAIN],
      //   subType: ["getPid"],
      //   message: '',
      //   success: true,
      // };
      //   this.eV.emit(eventI.MainEventTypes.MAIN, resultData);
      return true;
    }).catch((error) => {
      this.settings.pidFileExists = false;
      this.settings.pidFileReadable = false;
      const resultData: eventI.IBaseEvent = {
        subType: eventI.SubEventTypes.ERROR.INFO,
        message: '',
        success: true,
        mainEvent: { pid: this.settings.pid },
        errorEvent: { errCode: 2, data: error }
      };
      this.eV.emit(eventI.MainEventTypes.ERROR, resultData);
    });
    return false;
  }
  public async updateAndGetPidIfNecessary(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAndGetPidIfNecessary": Date.now() };
    if (!this.settings.pid || typeof this.settings.pid !== "number" || !this.comparePids()) {
      this.getPid().then(() => { this.comparePids() }).then(() => { return true; }).catch((error) => {
        this.eV.emit(eventI.MainEventTypes.ERROR, {
          subType: "updateAndGetPidIfNecessary",
          message: '',
          success: false,
          mainEvent: { pid: this.settings.pid },
          errorEvent: { errCode: 2, data: error }
        });
      });
    }
    return false;
  }
  async comparePids(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "comparePids": Date.now() };
    try {
      if (this.settings.pid) {
        this.getSI().then(() => {
          if (this.stats.si.pid == this.settings.pid) this.getPU();
        }).then(() => {
          return true;
        });
      }
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        subType: "comparePids",
        message: '',
        success: false,
        mainEvent: { pid: this.settings.pid },
        errorEvent: { errCode: 2, data: error }
      });
    }
    return false;
  }
  async getSI(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getSI": Date.now() };
    try {
      const targetProcesses = await si.processLoad("PalServer-Linux");
    if (targetProcesses && targetProcesses.length > 0) {
    const processInfo = targetProcesses.find((p) => p.pid === this.settings.pid);
        if (processInfo) {
          this.stats.si = { proc: processInfo.proc, pid: processInfo.pid, cpu: processInfo.cpu, mem: processInfo.mem };
          return true;
        }
      }
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        subType: "getSI",
        message: '',
        success: false,
        mainEvent: { pid: this.settings.pid },
        errorEvent: { errCode: 2, data: error }
      });
    }
    return false;
  }
  async getPU(): Promise<boolean> {
    if (this.settings.pidFileReadable && this.settings.pid) {
      this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPU": Date.now() };
      try {
        const usage = await pidusage(this.settings.pid);
        if (usage) {
          this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
          return true;
        }
      } catch (error) {
        this.eV.emit(eventI.MainEventTypes.ERROR, {
          subType: "getPU",
          message: '',
          success: false,
          data: this.stats,
          mainEvent: { pid: this.settings.pid },
          errorEvent: { errCode: 2, data: error }
        });
      }
    }
    return false;
  }
  private setupGlobalEventListeners() {
    // Event handling for client connections, messages, errors

  }

}

/*
import { inject, injectable } from 'inversify';
import { Stats } from './stats'; 

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