"use strict";
import si from 'systeminformation';
import IClient from "../clients";


class updateClientStats extends IClient {
  constructor() {
    super();
  }

  async getClientLatency(): Promise<void> { // Method returns a promise
    this.stats.latency = await si.inetLatency(this.info.ip);
    this.stats.eventCount++;
    this.stats.lastUpdates = { 'getClientLatency': Date.now() };
  }
}

export default updateClientStats;