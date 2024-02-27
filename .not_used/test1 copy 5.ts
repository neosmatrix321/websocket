"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { Container, inject, injectable } from 'inversify';
import { EventEmitterMixin } from '../global/globalEventHandling';
import { IStats } from './statsInstance';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as settings from '../settings/settingsInstance'; 
import * as eH from "../global/globalEventHandling";

export enum statsType {
  update,
  timerCreated,
  timerStarted,
  timerStopped,
  pidAvailable // Added an event type for pid availability
}

// Combined interfaces for streamlined event data
export interface IStatsEvent extends eH.IEventMap {
  type: statsType;
  message?: string; // Optional message for flexibility
  data?: {
    errCode?: number;
    blob?: any;
  };
}

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
    this.stats.lastUpdates["createstatContainer"] = Date.now();
    this.emit('update'); // Emit a generic 'update' event
  }

  public async getPid(): Promise<void> {
    try {
      const data = await readFile(this._settings.pidFile, 'utf-8' as BufferEncoding);
      const pid = parseInt(data, 10);

      this._settings.pid = pid;
      this._settings.pidFileExists = true;
      this._settings.pidFileReadable = true;
      this.emit('pidAvailable', pid); // Emit a specific event

    } catch (err) {
      // Improved error handling for clarity
      if (err instanceof Error && err.code === 'ENOENT') { 
        this._settings.pidFileExists = false;
      } else {
        console.error('Error opening file:', err);
        this._settings.pidFileExists = true; 
        this._settings.pidFileReadable = false;
      }
      this.emit('update'); // Emit update after potential changes 
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
      await this.updateAndGetPidIfNecessary();
      await this.comparePids();
      await this.getLatencyGoogle();
      await this.getSI();
      await this.getPU();

      this.emit('update'); // Emit the 'update' event at the end
    } catch (e) {
      console.error("Error fetching google ping:", e);
      this.stats.latencyGoogle = null;
      this.emit('update'); // Emit 'update' even if there's an error
    }
  }

  // ... (Rest of your Stats class methods) 
}
