"use strict";
import 'reflect-metadata';
import { inject, injectable } from "inversify";

export enum ClientType {
  Basic,
  Admin,
  Server,
  Unknown
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

export interface IWS {
  id: string;
  ws: WebSocket;
}

export interface IClient {
  info: IClientInfo;
  stats: IClientStats;
  clientSettings: IClientSettings;
  super: IClientSuper;
  ws?: IWS;
}

// client.ts
export class clientWrapper {
  info: IClientInfo;
  stats: IClientStats;
  clientSettings: IClientSettings;
  super: IClientSuper;
  ws: IWS | undefined;
  protected constructor(clientInfo: IClientInfo) {
    this.info = { id: clientInfo.id, ip: clientInfo.ip, type: clientInfo.type },
    this.stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this.clientSettings = { pw_hash: null },
    this.super = { customIntervallTime: false }
  }
  static createClient(clientInfo: IClientInfo):IClient {
    return new clientWrapper(clientInfo);
  }
}

export interface IClients {
  id: IClient;
}

export interface IClientsWrapper {
  clients: Record<string, IClient>;
}

@injectable()
export class clientsWrapper {
  protected clients: IClientsWrapper;
  constructor(@inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: IClientsWrapper) {
    this.clients = clientsInstance || {};  // Initialize if needed
  }
}

export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
