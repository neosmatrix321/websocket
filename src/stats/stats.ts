"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { Container, inject, injectable } from 'inversify';
import { EventEmitterMixin } from '../global/globalEventHandling';
import { IStats } from './statsInstance';
import * as settings from '../settings/settingsInstance'; // Import settings interface/class
class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();
const PRIVATE_SETTINGS_TOKEN = Symbol('PrivateSettings');
const GLOBAL_STATS_TOKEN = Symbol('GlobalStats');

@injectable()
export default class Stats extends EventEmitterMixin(MyClass) {
  @inject(GLOBAL_STATS_TOKEN) stats!: IStats;
  @inject(PRIVATE_SETTINGS_TOKEN) _settings!: settings.ISettings;
  constructor(
  ) {
    super();
    this.updateAllStats();
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
      this.emit('pidAvailable ' + pid);
      // this.updateAndGetPidIfNecessary();
    } catch (err: unknown) {
      // TODO node-specific types:  Über @types/node importieren ? npm install @types/node
      // TODO: Typanpassung für weitere Fehlerbehandlung
      // TODO const nodeError = err as NodeJS.ErrnoException;
      // TODO if (nodeError.code === 'ENOENT')
      // TODO && err.code === 'ENOENT'
      if (err instanceof Error) {
        this._settings.pidFileExists = false;
      } else {
        console.error('Fehler beim Öffnen der Datei:', err);
        this._settings.pidFileExists = true;
      }
      this._settings.pidFileReadable = false;
    }
  }
  public async updateAndGetPidIfNecessary(): Promise<void> {
    if (!this._settings.pid || typeof this._settings.pid !== "number") {
      this.stats.lastUpdates.getpid = Date.now();
      console.log("getPid found " + this._settings.pidFile);
      // this.emit("getPid", "pid: " + this._settings.pid);
    }
  }
  public  async updateAllStats() {
    try {
      this.getPid().then(() => {
        this.comparePids();
      }).then(() => {
        this.stats.getLatencyGoogle();
        this.stats.getSI()
        this.stats.getPU()
      }).then(() => {
        // EventEmitterMixin.emit('updateAllStats', Date.now());
      });
    } catch (e) {
      console.error("Error fetching google ping:", e);
      this.stats.latencyGoogle = null;
    }
  }
  async comparePids(): Promise<void> {
    this.stats.lastUpdates['comparePids'] = Date.now();
    if (this._settings.pid) {
      try {
        this.getSI().then(() => { 
          if (this.stats.si.pid == this._settings.pid) this.getPu(); 
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
}
