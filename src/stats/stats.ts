"use strict";

import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { inject, injectable, postConstruct } from 'inversify';
import pidusage from 'pidusage';
import si from 'systeminformation';

import { IBaseEvent, IClientsEvent, IMainEvent, IServerEvent, IStatsEvent, MainEventTypes, SubEventTypes, debugDataCallback } from "../global/eventInterface";
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IGlobalStats, globalStats, IStatsSettings, statsSettings, IHandle, Handle } from "./statsInstance";
import { RconConnection } from '../rcon/lib/server/connection';

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Stats {
  private eV: EventEmitterMixin = EventMixin;
  private stats: IGlobalStats = new globalStats();
  private settings: IStatsSettings = new statsSettings();
  private handle: IHandle = new Handle();
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
      case SubEventTypes.STATS.RCON_CONNECT:
        this.rconConnect().then(() => {
          console.log('Connected to RCON');
          this.sendRconCommand('info').then((response) => {
            console.log('RCON response:', response);
          });

        });
        // this.serverActive(event);
        break;
      case SubEventTypes.STATS.RCON_DISCONNECT:
        this.rconDisconnect();
        // this.serverActive(event);
        break;

      default:
        console.warn('Unknown stats event subtype:', event.subType);
    }
  }
  public async updateAllStats() {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAllStats": Date.now() };
    this.updateAndGetPidIfNecessary().then(() => {
      this.getPU();
      if (this.settings.rcon.isConnected) this.rconGetStats();
      console.dir(this.stats.si);
      console.dir(this.stats.pu);
    });
    const time_diff = Date.now() - this.stats.lastUpdates.getLatencyGoogle;
    if (!this.stats.lastUpdates.getLatencyGoogle || time_diff > 5000) {
      this.getLatencyGoogle();
    }
    // console.dir(this.settings);
  }
  async rconConnect() {
    this.handle.rcon = new RconConnection();
    try {
      const RCON_HOSTNAME = this.settings.rcon.host;
      const RCON_PORT = this.settings.rcon.port;
      const RCON_PASSWORD = this.settings.rcon.pw;

      if (this.handle.rcon) {
        await this.handle.rcon.connect(RCON_HOSTNAME, RCON_PORT, RCON_PASSWORD);
        this.sendRconCommand('info').then((response) => {
          console.log('RCON connected: ', response);
          this.settings.rcon.isConnected = true;
        });
      }
    } catch (error: any) {
      this.handle.rcon = undefined;
      return error.message;
    }
  }

  async rconDisconnect() {
    if (this.handle.rcon) {
      try {
        this.handle.rcon.client.resetAndDestroy();
        this.settings.rcon.isConnected = false;
      } catch (error: any) {
        return error.message;
      }
      this.handle.rcon = undefined;
    }
  }

  async rconGetStats(): Promise<void> {
    this.sendRconCommand('Info').then((info) => {
      this.stats.rcon.info = info as string;
    }).catch((error) => {
      this.eV.emit(MainEventTypes.ERROR, {
        subType: SubEventTypes.ERROR.INFO,
        message: 'Rcon info error',
        success: false,
        errorEvent: { errCode: 2, data: error }
      });
    });
    this.sendRconCommand('ShowPlayers').then((players) => {
      this.stats.rcon.players = players;
      const latencyGoogleEvent: IClientsEvent = {
        subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
        message: `extra`,
        success: true,
        data: this.stats.rcon.players,
        clientsEvent: { id: "ALL" }
      };
      this.eV.emit(MainEventTypes.CLIENTS, latencyGoogleEvent);
    }).catch((error) => {
      this.eV.emit(MainEventTypes.ERROR, {
        subType: SubEventTypes.ERROR.INFO,
        message: 'Rcon players error',
        success: false,
        errorEvent: { errCode: 2, data: error }
      });
    });
  }

  async sendRconCommand(command: string) {
    if (this.handle.rcon) {
      try {
        // Ensure RCON connection if not open? rconConnection.connect();
        const response = await this.handle.rcon.exec(command);
        return response.body; // Or format the response if needed
      } catch (error) {
        console.error("RCON Error:", error);
        return "RCON Error: " + error; // Return an error message
      }
    }
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
    readFile(this.settings.pid.file, 'utf-8' as BufferEncoding).then((data) => {
      this.settings.pid.fileExists = true;
      this.settings.pid.pid = parseInt(data, 10)
    }).then(() => {
      this.settings.pid.fileReadable = true;
      const resultData: IBaseEvent = {
        subType: SubEventTypes.BASIC.DEFAULT,
        message: `updated pid to ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, resultData);
      // this.updateAllStats();
      return true;
    }).catch((error) => {
      this.settings.pid.pid = undefined;
      const resultData: IMainEvent = {
        subType: SubEventTypes.ERROR.INFO,
        message: `pid file exists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}`,
        success: true,
        mainEvent: { pid: this.settings.pid.pid },
        errorEvent: { errCode: 2, data: error },
        debugEvent: debugDataCallback,
      };
      this.eV.emit(MainEventTypes.ERROR, resultData);
    });
    this.settings.pid.fileReadable = true;
    const resultData: IBaseEvent = {
      subType: SubEventTypes.BASIC.DEFAULT,
      message: `no pid file found or readable`,
      success: false,
    };
    this.eV.emit(MainEventTypes.BASIC, resultData);
    return false;
  }
  public async updateAndGetPidIfNecessary(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "updateAndGetPidIfNecessary": Date.now() };
    if (!this.comparePids()) {
      this.getPid().then(() => {
        this.getSI().then(() => {
          this.getPU().then(() => {
            this.comparePids().then(() => {
              return true;
            });
          });
        });
      }).catch((error) => {
        this.eV.emit(MainEventTypes.ERROR, {
          subType: "updateAndGetPidIfNecessary",
          message: `pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, si.pid: ${this.stats.si.pid}, pu.pid: ${this.stats.pu.pid}`,
          success: false,
          mainEvent: { pid: this.settings.pid.pid },
          errorEvent: { errCode: 2, data: error }
        });
      });
    }
    return false;
  }
  async comparePids(): Promise<boolean> {
    this.stats.lastUpdates = { ...this.stats.lastUpdates, "comparePids": Date.now() };
    try {
      if (this.settings.pid.fileReadable && (this.settings.pid.pid && this.stats.si.pid && ((this.stats.si.pid == this.settings.pid.pid) && (this.stats.pu.pid && this.stats.pu.pid == this.settings.pid.pid)))) {
        return true;
      }
    } catch (error) {
      this.eV.emit(MainEventTypes.ERROR, {
        subType: "comparePids",
        message: `pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, si.pid: ${this.stats.si.pid}, pu.pid: ${this.stats.pu.pid}`,
        success: false,
        mainEvent: { pid: this.settings.pid.pid },
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
        const processInfo = targetProcesses.find((p) => p.pid === this.settings.pid.pid);
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
        mainEvent: { pid: this.settings.pid.pid },
        errorEvent: { errCode: 2, data: error }
      });
    }
    return false;
  }
  async getPU(): Promise<boolean> {
    if (this.settings.pid.fileReadable && this.settings.pid.pid) {
      this.stats.lastUpdates = { ...this.stats.lastUpdates, "getPU": Date.now() };
      try {
        const usage = await pidusage(this.settings.pid.pid);
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
          mainEvent: { pid: this.settings.pid.pid },
          errorEvent: { errCode: 2, data: error }
        });
      }
    }
    return false;
  }
}

/*
import { inject, injectable } from 'inversify';
import { Stats } from './stats'; 
import { Server } from '../server/server';

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