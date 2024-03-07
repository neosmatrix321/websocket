"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import * as settingsI from '../settings/settingsInstance'; // Import settings interface/class
import * as statsI from "./statsInstance";
import { Main } from '../main';

const EventMixin = eM.SingletonEventManager.getInstance();

@injectable()
export default class Stats {
  private eV: eM.eventManager;
  private stats!: statsI.IStats;
  private settings!: settingsI.ISettings;
  constructor(
    @inject(statsI.STATS_WRAPPER_TOKEN) statsInstance: statsI.IStats,
    @inject(settingsI.PRIVATE_SETTINGS_TOKEN) settingsInstance: settingsI.ISettings
  ) {
    this.eV = EventMixin;
    this.stats = statsInstance;
    this.settings = settingsInstance;
    this.updateAllStats();
  }
  public async updateAllStats() {
    let statsUpdated: eH.IBaseEvent = {
      mainTypes: [eH.MainEventTypes.STATS],
      subTypes: [eH.SubEventTypes.STATS.ALL_STATS_UPDATED],
      message: '',
      success: false,
    };
    let result: boolean = false;
    try {
      this.stats.lastUpdates["createstatContainer"] = Date.now();
      result = await this.updateAndGetPidIfNecessary(); // Fetch PID if needed
      result = await this.comparePids();
      result = await this.getLatencyGoogle();
      result = await this.getSI();
      result = await this.getPU();
      statsUpdated = {
        message: 'all stats updated',
        success: result,
      };
    } catch (error) {
      statsUpdated = {
        subTypes: [eH.SubEventTypes.STATS.ALL_STATS_UPDATED, eH.MainEventTypes.GENERIC],
        message: 'Error updating stats',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      };
      console.error("Error fetching google ping:", error);
      this.stats.latencyGoogle = null;
    }
    this.eV.emit(eH.MainEventTypes.STATS, statsUpdated);
  }
  async getLatencyGoogle(): Promise<boolean> {
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;
      return true;
    } catch (error) {
      this.eV.emit(eH.MainEventTypes.ERROR, {
        mainTypes: [eH.MainEventTypes.STATS],
        subTypes: [eH.MainEventTypes.GENERIC],
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
    }
    return false;
  }
  public async createstatContainer(): Promise<void> {
    this.stats.lastUpdates = { "createstatContainer": Date.now() };
  }

  public async getPid(): Promise<boolean> {
    this.stats.lastUpdates = { "getPid": Date.now() };
    let resultData: eH.IBaseEvent = {
      mainTypes: [eH.MainEventTypes.MAIN],
      subTypes: ["getPid"],
      message: '',
      success: false,
    };
    try {
      const data = await readFile(this.settings.pidFile, 'utf-8' as BufferEncoding);
      const pid = parseInt(data, 10);

      this.settings.pid = pid;
      this.settings.pidFileExists = true;
      this.settings.pidFileReadable = true;
      resultData = { success: true };
      this.eV.emit(eH.MainEventTypes.MAIN, resultData);
      return true;

    } catch (error) {
      this.settings.pidFileExists = false;
      this.settings.pidFileReadable = false;
      resultData = { errorEvent: { errCode: 2, data: { error } } };

      this.eV.emit(eH.MainEventTypes.ERROR, resultData);
    }
    return false;
  }
  public async updateAndGetPidIfNecessary(): Promise<boolean> {
    this.stats.lastUpdates = { "updateAndGetPidIfNecessary": Date.now() };
    try {
      if (!this.settings.pid || typeof this.settings.pid !== "number") {
        this.stats.lastUpdates = { getpid: Date.now() };
        await this.getPid();
        return true;
      }
      return false;
    } catch (error) {
      this.eV.emit(eH.MainEventTypes.ERROR, {
        mainTypes: [eH.MainEventTypes.MAIN],
        subTypes: ["updateAndGetPidIfNecessary"],
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: { error } }
      });
    }
    return false;
  }
  async comparePids(): Promise<boolean> {
    this.stats.lastUpdates['comparePids'] = Date.now();
    try {
      if (this.settings.pid) {
        this.getSI().then(() => {
          if (this.stats.si.pid == this.settings.pid) this.getPU();
        }).then(() => {
          return true;
        });
      }
      return false;
    } catch (error) {
      this.eV.emit(eH.MainEventTypes.ERROR, {
        mainTypes: [eH.MainEventTypes.MAIN],
        subTypes: ["comparePids"],
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
      const targetProcess = (await si.processLoad("PalServer-Linux")).find((p) => p.pid === this.settings.pid);
      if (targetProcess) {
        this.stats.si = { proc: targetProcess.proc, pid: targetProcess.mem, cpu: targetProcess.pid, mem: targetProcess.mem };
        return true;
      }
      return false;
    } catch (error) {
      this.eV.emit(eH.MainEventTypes.ERROR, {
        mainTypes: [eH.MainEventTypes.STATS],
        subTypes: ["getSI"],
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
      const usage = await pidusage(this.settings.pid);
      if (usage) {
        this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
        return true;
      }
    } catch (error) {
      this.eV.emit(eH.MainEventTypes.ERROR, {
        mainTypes: [eH.MainEventTypes.STATS],
        subTypes: ["getSI"],
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