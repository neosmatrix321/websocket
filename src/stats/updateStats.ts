"use strict";
// updatestatContainer.ts
import pidusage from 'pidusage';
import { processLoad, inetLatency } from 'systeminformation';
import Stats from "./stats";

export default class updateGlobalStats {
  async getLatencyGoogle(): Promise<void> {
    this.stats.lastUpdates = { "getLatencyGoogle": Date.now() };
    try {
      this.stats.latencyGoogle = await inetLatency();
      this.emit("getLatencyGoogle" + this.stats.latencyGoogle);
    } catch (e) {
      console.error("Error fetching google ping:", e);
      this.stats.latencyGoogle = null;
    }
  }
  async getSi(): Promise<void> {
    try {
      const targetProcess = (await processLoad("PalServer-Linux")).find((p) => p.pid === this._settings.pid); 
      if (targetProcess) {
        this.stats.si = targetProcess;
      }
    } catch (e) {
      console.error("Error fetching system information:", e);
    }
    this.stats.lastUpdates = { "getLatencyGoogle": Date.now() };
  }
  async getPu(): Promise<void> {
    this.stats.lastUpdates['getPu'] = Date.now();
    try {
      const usage = await pidusage(this._settings.pid); 
      this.stats.pu = { cpu: usage.cpu, memory: usage.memory, pid: usage.pid, ctime: usage.ctime, elapsed: usage.elapsed, timestamp: usage.timestamp }; // Map relevant properties
    } catch (e) {
      console.error("Error fetching pid usage:", e);
    }
  }
}
