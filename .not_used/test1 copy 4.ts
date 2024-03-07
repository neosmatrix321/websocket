"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { Container, inject, injectable } from 'inversify';
import { EventEmitterMixin } from '../global/globalEventHandling';
import { IStats } from './statsInstance';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as settings from '../settings/settingsInstance'; // Import settings interface/class
import * as eH from "../global/globalEventHandling";
import * as S from "../stats/statsInstance";

// **Revised statsType enum for clarity**
export enum StatsType {
  UPDATE = 'update',
  TIMER_CREATED = 'timerCreated',
  TIMER_STARTED = 'timerStarted',
  TIMER_STOPPED = 'timerStopped'  
}

// **Interfaces for consistent event structure**
export interface IStatsEvent extends eH.IEventMap {
  type: StatsType;
  message?: string; // Optional message
  data?: {
    errCode?: number;
    message?: string;
    blob?: any;
  };
}

// **BaseStatsEvent class for consistent event foundation**
class BaseStatsEvent implements eH.IBaseEvent {
  "cat": eH.catType = eH.catType.stats;
}

const MyClassWithMixin = EventEmitterMixin(BaseStatsEvent);
const globalEventEmitter = new MyClassWithMixin();
const PRIVATE_SETTINGS_TOKEN = Symbol('PrivateSettings');
const GLOBAL_STATS_TOKEN = Symbol('GlobalStats');

@injectable()
export default class Stats extends eH.EventEmitterMixin<IStatsEvent>(BaseStatsEvent) {
  @inject(GLOBAL_STATS_TOKEN) stats!: IStats;
  @inject(PRIVATE_SETTINGS_TOKEN) _settings!: settings.ISettings;

  constructor() {
    super();
    this.updateAllStats(); 
  }

  public async createstatContainer(): Promise<void> {
    this.stats.lastUpdates = { "createstatContainer": Date.now() };
    this.emit(StatsType.UPDATE, "Container creation status update"); // Emit an event
  }

  public async getPid(): Promise<void> {
    try {
      const data = await readFile(this._settings.pidFile, 'utf-8' as BufferEncoding);
      const pid = parseInt(data, 10);

      this._settings.pid = pid;
      this._settings.pidFileExists = true;
      this._settings.pidFileReadable = true;
      this.emit('pidAvailable', `PID: ${pid}`);

    } catch (err) {
      this._settings.pidFileExists = false;
      this._settings.pidFileReadable = false;

      const errorData = (err instanceof Error) ? { errCode: 999, message: err.message } : null;
      this.emit(StatsType.UPDATE, "PID retrieval error", errorData);
    }
  }

  public async updateAndGetPidIfNecessary(): Promise<void> {
    if (!this._settings.pid || typeof this._settings.pid !== "number") {
      this.stats.lastUpdates.getpid = Date.now();
      await this.getPid(); 
    }
  }

  public async updateAllStats() {
    try {
      await this.updateAndGetPidIfNecessary(); // Fetch PID if needed
      await this.comparePids();
      await this.getLatencyGoogle();
      await this.getSI();
      await this.getPU();

    } catch (e) {
      this.emit(StatsType.UPDATE, "Error updating all stats", { errCode: 998, message: e.message });
    }
  }

  // ... (Rest of your functions with emit functionality) 
}
