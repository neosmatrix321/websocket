"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';

import * as eventI from "../global/eventInterface";
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import * as settingsI from '../settings/settingsInstance'; // Import settings interface/class
import * as statsI from "./statsInstance";
import { Settings, PRIVATE_SETTINGS_TOKEN } from "../settings/settings";

export const STATS_WRAPPER_TOKEN = Symbol('Stats');

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Stats {
  private eV: EventEmitterMixin = EventMixin;
  private stats!: statsI.IStats;
  constructor(
    @inject(STATS_WRAPPER_TOKEN) statsInstance: statsI.IStats,
    @inject(Settings) private settingsService: Settings,
  ) {
    this.eV = EventMixin;
    this.stats = statsInstance;
    
    this.stats.lastUpdates = { "createStats": Date.now() };
    this.updateAllStats();
    this.eV.on(eventI.MainEventTypes.STATS, this.handleStatsEvent);
  }
  private handleStatsEvent(event: eventI.IEventTypes) {
    switch (event.subType) {
      case eventI.SubEventTypes.STATS.UPDATE_ALL:
        this.updateAllStats();
        break;
      default:
        console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  public async updateAllStats() {
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
        errorEvent: { errCode: 2, data: { error } }
      };
      console.error(eventI.MainEventTypes.ERROR, statsUpdated);
      this.stats.latencyGoogle = null;
    }
  }
  async getLatencyGoogle(): Promise<boolean> {
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;
      return true;
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        subType: eventI.SubEventTypes.ERROR.INFO,
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
    }
    return false;
  }

  public async getPid(): Promise<boolean> {
    this.stats.lastUpdates = { "getPid": Date.now() };
    readFile(this.settingsService.settings.pidFile, 'utf-8' as BufferEncoding).then((data) => { this.settingsService.settings.pid = parseInt(data, 10) }).then(() => {
      this.settingsService.settings.pidFileExists = true;
      this.settingsService.settings.pidFileReadable = true;
      // const resultData: eventI.IBaseEvent = {
      //   mainTypes: [eventI.MainEventTypes.MAIN],
      //   subType: ["getPid"],
      //   message: '',
      //   success: true,
      // };
      //   this.eV.emit(eventI.MainEventTypes.MAIN, resultData);
      return true;
      }).catch((error) => {
      this.settingsService.settings.pidFileExists = false;
      this.settingsService.settings.pidFileReadable = false;
      const resultData: eventI.IBaseEvent = {
        subType: eventI.SubEventTypes.ERROR.INFO,
        message: '',
        success: true,
        errorEvent: { errCode: 2, data: { error } }
      };
      this.eV.emit(eventI.MainEventTypes.ERROR, resultData);
    });
    return false;
  }
  public async updateAndGetPidIfNecessary(): Promise<boolean> {
    this.stats.lastUpdates = { "updateAndGetPidIfNecessary": Date.now() };
    if (!this.settingsService.settings.pid || typeof this.settingsService.settings.pid !== "number" || !this.comparePids()) {
      this.stats.lastUpdates = { getpid: Date.now() };
      await this.getPid().then(() => {this.comparePids()}).then(() => { return true; }).catch((error) => {
        this.eV.emit(eventI.MainEventTypes.ERROR, {
          mainTypes: [eventI.SubEventTypes.ERROR.INFO],
          subType: ["updateAndGetPidIfNecessary"],
          message: '',
          success: false,
          errorEvent: { errCode: 2, data: { error } }
        });
        return false;
      });
    }
    return false;
  }
  async comparePids(): Promise<boolean> {
    this.stats.lastUpdates['comparePids'] = Date.now();
    try {
      if (this.settingsService.settings.pid) {
        this.getSI().then(() => {
          if (this.stats.si.pid == this.settingsService.settings.pid) this.getPU();
        }).then(() => {
          return true;
        });
      }
      return false;
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        mainTypes: [eventI.MainEventTypes.MAIN],
        subType: ["comparePids"],
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
    }
    return false;
  }
  async getSI(): Promise<boolean> {
    this.stats.lastUpdates = { "getLatencyGoogle": Date.now() };
    try {
      const targetProcess = (await si.processLoad("PalServer-Linux")).find((p) => p.pid === this.settingsService.settings.pid);
      if (targetProcess) {
        this.stats.si = { proc: targetProcess.proc, pid: targetProcess.mem, cpu: targetProcess.pid, mem: targetProcess.mem };
        return true;
      }
      return false;
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        mainTypes: [eventI.MainEventTypes.STATS],
        subType: ["getSI"],
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
    }
    return false;
  }
  async getPU(): Promise<boolean> {
    this.stats.lastUpdates = { 'getPU': Date.now() };
    try {
      const usage = await pidusage(this.settingsService.settings.pid);
      if (usage) {
        this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
        return true;
      }
    } catch (error) {
      this.eV.emit(eventI.MainEventTypes.ERROR, {
        mainTypes: [eventI.MainEventTypes.STATS],
        subType: ["getSI"],
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
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