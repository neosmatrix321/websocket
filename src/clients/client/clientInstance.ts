"use strict";
import si from 'systeminformation';
import Clients from '../clients';
export enum ClientType {
  Basic,
  Admin,
  Server
  // ...
}

export interface IClientInfo {
  id: string;
  ip: string;
}
export interface IClientStats {
  eventCount: number;
  lastUpdates: Record<string, number>;
  messagesReceived: string[];
  messagesToSend: string[];
  latency: number | undefined;
}
export interface IClientConfig {
  type: ClientType; // 'basic' | 'advanced' | ...
}
export interface IClientSettings {
  pw_hash: string | null;
}
export interface IClientSuper {
  customIntervallTime: number | false;
}

export interface IClient extends clientWrapper {
  info: IClientInfo;
  _stats: IClientStats;
  _config: IClientConfig;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
}

export interface IClientService {
  create(newID: string, newIP: string): IClient;
  connect(): void;
  disconnect(): void;
  sendMessage(message: string): void;
  receiveMessage(message: string, data?: object | null): void;
  getClientLatency(client: IClient, callback: () => void): Promise<void>;
  updateSettings(settings: IClientSettings): void;
  updateConfig(config: any): void;
}

// client.ts
export class clientWrapper {
  info: IClientInfo;
  _stats: IClientStats;
  _config: IClientConfig;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
  constructor(newID: string, newIP: string) {
    this.info = { id: newID, ip: newIP },
    this._stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this._config = { type: ClientType.Basic },
    this._clientSettings = { pw_hash: null },
    this._super = { customIntervallTime: false }
  };
  public create(newID: string, newIP: string): IClient {
    const newClient = new clientWrapper(newID, newIP);
    return newClient;
  }
  public connect(): void {
    console.log('lets connect!');
  }
  public disconnect(): void {
    return;
  }
  public sendMessage(message: string): void {
    return;
  }
  public receiveMessage(message: string, data?: object | null): void {
    return;
  }
  public updateSettings(settings: IClientSettings): void {
    this._clientSettings = { ...settings }; // Update settings with spread
    this._stats.eventCount++;
    this._stats.lastUpdates = { updateSettings: Date.now() };
  }

  public updateConfig(config: any): void { // Adjust the 'any' type later
    if (config !== '{}') {
      // Update logic if needed
      this._stats.eventCount++;
      this._stats.lastUpdates.updateConfig = Date.now();
    }
  }

  public async getClientLatency(client: IClient, callback: () => void): Promise<void> {
    this._stats.latency = await si.inetLatency(client.info.ip);
    this._stats.eventCount++;
    this._stats.lastUpdates = { 'getClientLatency': Date.now() };
    callback(); 
  }
}
