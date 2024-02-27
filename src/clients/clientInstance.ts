"use strict";

export enum ClientType {
  Basic,
  Admin,
  Server
  // ...
}

export interface IClientInfo {
  id: string;
  ip: string;
  type: ClientType; // 'basic' | 'advanced' | ...
}
export interface IClientStats {
  eventCount: number;
  lastUpdates: Record<string, number>;
  messagesReceived: string[];
  messagesToSend: string[];
  latency: number | undefined;
}
export interface IClientSettings {
  pw_hash: string | null;
}
export interface IClientSuper {
  customIntervallTime: number | false;
}

export interface IClient {
  info: IClientInfo;
  _stats: IClientStats;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
}

// client.ts
export class clientWrapper {
  info: IClientInfo;
  _stats: IClientStats;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
  protected constructor(clientInfo: IClientInfo) {
    this.info = { id: clientInfo.id, ip: clientInfo.ip, type: clientInfo.type },
    this._stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this._clientSettings = { pw_hash: null },
    this._super = { customIntervallTime: false }
  }
  static createClient(clientInfo: IClientInfo):IClient {
    return new clientWrapper(clientInfo);
  }
}

export interface IClients {
  id: IClient;
}
