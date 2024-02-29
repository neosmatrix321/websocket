"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { Container, inject, injectable } from 'inversify';
import { EventEmitterMixin } from '../global/EventHandlingMixin';
import { IStats } from './statsInstance';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import * as settingsI from '../settings/settingsInstance'; // Import settings interface/class
import * as statsI from "../stats/statsInstance";
import * as clientsC from "../clients/clients";
import * as clientsI from "../clients/clientInstance";
import * as serverC from "../server/server";
import * as serverI from "../server/serverInstance";
import * as mainC from "../main";

const PRIVATE_SETTINGS_TOKEN = Symbol('PrivateSettings');
export const GLOBAL_STATS_TOKEN = Symbol('GlobalStats');

export enum statsType {
  update,
  updated,
  pidAvailable
}


export interface IStatsEvent extends eH.IEventMap {
  cat: eH.catType.stats;
  type?: eM.eMType | statsType | clientsC.clientsType | serverC.serverType | mainC.MainType;
  message?: string;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}


class BaseStatsEvent {
}


@injectable()
export default class Stats extends eH.EventEmitterMixin<IStatsEvent>(BaseStatsEvent) {
  public stats!: statsI.IStats;
  private _settings!: settingsI.ISettings
  constructor(@inject(GLOBAL_STATS_TOKEN) statsInstance: statsI.IStats,
    @inject(PRIVATE_SETTINGS_TOKEN) settingsInstance: settingsI.ISettings) {
    super();
    this.stats = statsInstance || {
      webHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
      fileHandle: { isAlive: false, hasConnection: false, connectedClients: 0 },
      clientsCounter: 0,
      activeClients: 0,
      latencyGoogle: null,
      si: { cpu: null, memory: null, ppid: null, pid: null, ctime: null, elapsed: null, timestamp: null },
      pu: { proc: null, pid: null, pids: null, cpu: null, mem: null },
      rcon: {},
      lastUpdates: {},
      clients: {},
      interval_sendinfo: false
    };
    this._settings = settingsInstance;
    this.updateAllStats();
  }
  public async updateAllStats() {
    try {
      this.stats.lastUpdates["createstatContainer"] = Date.now();
      await this.updateAndGetPidIfNecessary(); // Fetch PID if needed
      await this.comparePids();
      await this.getLatencyGoogle();
      await this.getSI();
      await this.getPU();
      this.emit('statsUpdated', {
        type: statsType.update,
        message: 'All stats updated',
        data: { errCode: 0 } // Success
      });
    } catch (error) {
      this.emit('statsUpdated', {
        type: statsType.update,
        message: 'Error updating stats',
        data: { errCode: 1, blob: { error } }
      });
      console.error("Error fetching google ping:", error);
      this.stats.latencyGoogle = null;
    }
  }
  async getLatencyGoogle(): Promise<void> {
    try {
      const latency = await si.inetLatency();
      this.stats.latencyGoogle = latency;

      this.emit('latencyUpdated', {
          type: statsType.update,
          message: 'Google latency updated',
          data: { errCode: 0, blob: { latency } }
      });

  } catch (error) {
      this.emit('latencyUpdated', {
          type: statsType.update,
          message: 'Error fetching Google latency',
          data: { errCode: 1, blob: { error } }
      });
  }
}
  public async createstatContainer(): Promise<void> {
    this.stats.lastUpdates = { "createstatContainer": Date.now() };
  }

  public async getPid(): Promise<void> {
    try {
      const data = await readFile(this._settings.pidFile, 'utf-8' as BufferEncoding);
      const pid = parseInt(data, 10);

      this._settings.pid = pid;
      this._settings.pidFileExists = true;
      this._settings.pidFileReadable = true;
      this.emit(statsType.pidAvailable, `PID: ${pid}`);

    } catch (err) {
      this._settings.pidFileExists = false;
      this._settings.pidFileReadable = false;

      const errorData = (err instanceof Error) ? { errCode: 999, message: err.message } : null;
      this.emit("getPid error PID retrieval error", errorData);
    }
  }
  public async updateAndGetPidIfNecessary(): Promise<void> {
    if (!this._settings.pid || typeof this._settings.pid !== "number") {
      this.stats.lastUpdates.getpid = Date.now();
      await this.getPid(); 
    }
  }
  async comparePids(): Promise<void> {
    this.stats.lastUpdates['comparePids'] = Date.now();
    if (this._settings.pid) {
      try {
        this.getSI().then(() => {
          if (this.stats.si.pid == this._settings.pid) this.getPU();
        }).then(() => {
          return true;
        }).catch((e) => {
          console.error('Error fetching pid: ' + this._settings.pid, ' si_pid: ' + this.stats.si.pid, ' pu_pid: ' + this.stats.pu.pid, e);
          return false;
        });
      } catch (e) {
        console.error('Error fetching pid: ' + this._settings.pid, ' si_pid: ' + this.stats.si.pid, ' pu_pid: ' + this.stats.pu.pid, e);
      }
    }
  }
  async getSI(): Promise<void> {
    try {
      const targetProcess = (await si.processLoad("PalServer-Linux")).find((p) => p.pid === this._settings.pid);
      if (targetProcess) {
        this.stats.si = { proc: targetProcess.proc, pid: targetProcess.mem, cpu: targetProcess.pid, mem: targetProcess.mem };
      }
    } catch (e) {
      console.error("Error fetching system information:", e);
    }
    this.stats.lastUpdates = { "getLatencyGoogle": Date.now() };
  }
  async getPU(): Promise<void> {
    this.stats.lastUpdates['getPU'] = Date.now();
    try {
      const usage = await pidusage(this._settings.pid);
      this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
    } catch (e) {
      console.error("Error fetching pid usage:", e);
    }
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