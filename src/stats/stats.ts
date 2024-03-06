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
import Main from '../main';


@injectable()
export default class Stats extends eH.EventEmitterMixin<eH.IEventTypes>{
  public stats!: statsI.IStats;
  private _settings!: settingsI.ISettings
  constructor(@inject(eM.EVENT_MANAGER_TOKEN) eV: eM.eventManager,
  @inject(statsI.GLOBAL_STATS_TOKEN) statsInstance: statsI.IStats,
    @inject(settingsI.PRIVATE_SETTINGS_TOKEN) settingsInstance: settingsI.ISettings) {
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
    let statsUpdated: eH.IBaseEvent;
    try {
      this.stats.lastUpdates["createstatContainer"] = Date.now();
      await this.updateAndGetPidIfNecessary(); // Fetch PID if needed
      await this.comparePids();
      await this.getLatencyGoogle();
      await this.getSI();
      await this.getPU();
      statsUpdated = {
        types: [eH.SubEventTypes.STATS.ALL_STATS_UPDATED],
        message: 'Error updating stats',
        success: false,
        data: { errCode: 1, blob: { error } }
      };
    } catch (error) {
      statsUpdated = {
        types: [eH.SubEventTypes.STATS.ALL_STATS_UPDATED],
        message: 'Error updating stats',
        success: false,
        data: { errCode: 1, blob: { error } }
      };
      console.error("Error fetching google ping:", error);
      this.stats.latencyGoogle = null;
    }
    this.emit('statsUpdated', statsUpdated);
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