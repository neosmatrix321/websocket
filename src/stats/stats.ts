"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable, postConstruct } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';

import { IBaseEvent, IClientsEvent, IMainEvent, IStatsEvent, MainEventTypes, SubEventTypes, debugDataCallback } from "../global/eventInterface";
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
    this.eV.on(MainEventTypes.STATS, (data: IStatsEvent) => { this.handleStatsEvent(data); });
  }
  private handleStatsEvent(event: IStatsEvent) {
    const type = event.subType;
    if (!type) throw new Error('No event type provided');
    switch (type) {
      case SubEventTypes.STATS.UPDATE_ALL:
        this.updateAndGetPidIfNecessary().then(() => this.updateAllStats());
        break;
      default:
        console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  public async updateAllStats() {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAllStats": Date.now() };
    // let statsUpdated: IBaseEvent = {
    //   subType: SubEventTypes.STATS.ALL_STATS_UPDATED,
    //   message: '',
    //   success: false,
    // };
    const time_diff = Date.now() - this.stats.lastUpdates.getLatencyGoogle;
    if (!this.stats.lastUpdates.getLatencyGoogle || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    this.getPU();
    // console.dir(this.settings);
    // console.dir(this.stats.si);
    // console.dir(this.stats.pu);
  }

  async getLatencyGoogle(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getLatencyGoogle": Date.now() };
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;
      const latencyGoogleEvent: IClientsEvent = {
        subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
        message: `latencyGoogle`,
        success: true,
        data: this.stats.latencyGoogle,
        clientsEvent: { id: "ALL" }
      };
      this.eV.emit(MainEventTypes.CLIENTS, latencyGoogleEvent);
      return true;
    } catch (error) {
      this.eV.emit(MainEventTypes.ERROR, {
        subType: SubEventTypes.ERROR.INFO,
        message: '',
        success: false,
        errorEvent: { errCode: 2, data: error }
      });
      this.stats.latencyGoogle = null;
    }
    return false;
  }

  public async getPid(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPid": Date.now() };
    readFile(this.settings.pidFile, 'utf-8' as BufferEncoding).then((data) => { this.settings.pid = parseInt(data, 10) }).then(() => {
      this.settings.pidFileExists = true;
      this.settings.pidFileReadable = true;
      const resultData: IBaseEvent = {
        subType: SubEventTypes.BASIC.DEFAULT,
        message: `updated pid to ${this.settings.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, resultData);
      this.updateAllStats();
      return true;
    }).catch((error) => {
      this.settings.pidFileExists = false;
      this.settings.pidFileReadable = false;
      const resultData: IMainEvent = {
        subType: SubEventTypes.ERROR.INFO,
        message: '',
        success: true,
        mainEvent: { pid: this.settings.pid },
        errorEvent: { errCode: 2, data: error },
        debugEvent: debugDataCallback,
      };
      this.eV.emit(MainEventTypes.ERROR, resultData);
    });
    return false;
  }
  public async updateAndGetPidIfNecessary(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAndGetPidIfNecessary": Date.now() };
    if (!this.settings.pid || typeof this.settings.pid !== "number" || !this.comparePids()) {
      this.getPid().then(() => { this.comparePids() }).then(() => { return true; }).catch((error) => {
        this.eV.emit(MainEventTypes.ERROR, {
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
      this.eV.emit(MainEventTypes.ERROR, {
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
      this.eV.emit(MainEventTypes.ERROR, {
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
          const puEvent: IClientsEvent = {
            subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
            message: `pidInfo`,
            success: true,
            data: this.stats.pu,
            clientsEvent: { id: "ALL" }
          };
          this.eV.emit(MainEventTypes.CLIENTS, puEvent);
          return true;
        }
      } catch (error) {
        this.eV.emit(MainEventTypes.ERROR, {
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