"use strict";

import { inject, injectable } from "inversify";

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

export interface IClient {
  info: IClientInfo;
  _stats: IClientStats;
  _config: IClientConfig;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
}

// client.ts
export class clientWrapper {
  info: IClientInfo;
  _stats: IClientStats;
  _config: IClientConfig;
  _clientSettings: IClientSettings;
  _super: IClientSuper;
  protected constructor(newID: string, newIP: string, type: ClientType) {
    this.info = { id: newID, ip: newIP },
    this._stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this._config = { type: type },
    this._clientSettings = { pw_hash: null },
    this._super = { customIntervallTime: false }
  }
  static createClient(newID: string, newIP: string, type: ClientType):IClient {
    return new clientWrapper(newID, newIP, type);
  }
}

export interface IClients {
  _clients: Record<string, IClient>;
}

@injectable()
export default class clientsWrapper {
  protected _clients: Record<string, IClient>; // Clients dictionary

  public constructor(@inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, IClient>) {
    this._clients = clientsInstance || {};  // Initialize if needed
  }
  public create(newID: string, newIP: string, type: ClientType): void {
    const newClient: IClient = clientWrapper.createClient(newID, newIP, type);
    this._clients[newID] = newClient;
  }
}
export const CLIENTS_WRAPPER_TOKEN = Symbol('ClientsService');
