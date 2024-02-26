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
  pw_hash: string | false;
}
export interface IClientSuper {
  customIntervallTime: number | false;
}

export interface IClient {
  info: IClientInfo;
  _stats?: IClientStats;
  _config?: IClientConfig; // Generisches Objekt für Konfiguration
  _settings?: IClientSettings;
  _super?: IClientSuper;
}
export interface IClientService extends IClient {
  create(newID: string, newIP: string): IClient;
  connect(): void;
  disconnect(): void;
  sendMessage(message: string): void;
  receiveMessage(message: string, data?: object | null): void;
  getClientLatency(client: IClient): Promise<void>;
  updateSettings(settings: IClientSettings): void;
  updateConfig(config: any): void;
}


// client.ts
export class clientWrapper implements IClientService {
  info: IClientInfo;
  _stats: IClientStats;
  _config: IClientConfig; // Generisches Objekt für Konfiguration
  _settings: IClientSettings;
  _super: IClientSuper;
  protected constructor(newID: string, newIP: string) {
    this.info = { id: newID, ip: newIP },
    this._stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this._config = { type: ClientType.Basic },
    this._settings = { pw_hash: false },
    this._super = { customIntervallTime: false }
  };
  public static create(newID: string, newIP: string): IClient {
    const newClient = new clientWrapper(newID, newIP);
    return newClient;
  }
  public static connect(): void {
    console.log('lets connect!');
  }
  public static disconnect(): void {
    return;
  }
  public static sendMessage(message: string): void {
    return;
  }
  public static receiveMessage(message: string, data?: object | null): void {
    return;
  }
  public static updateSettings(settings: IClientSettings): void {
    this._settings = { ...settings }; // Update settings with spread
    this._stats.eventCount++;
    this._stats.lastUpdates = { updateSettings: Date.now() };
  }

  public static updateConfig(config: any): void { // Adjust the 'any' type later
    if (config !== '{}') {
      // Update logic if needed
      this._stats.eventCount++;
      this._stats.lastUpdates.updateConfig = Date.now();
    }
  }

  public static async getClientLatency(client: IClient): Promise<void> { // Method returns a promise
    this._stats.latency = await si.inetLatency(client.info.ip);
    this._stats.eventCount++;
    this._stats.lastUpdates = { 'getClientLatency': Date.now() };
  }
}
