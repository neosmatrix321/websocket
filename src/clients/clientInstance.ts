"use strict";
import 'reflect-metadata';
import { inject, injectable } from "inversify";
import { MyWebSocket } from '../server/serverInstance';

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


// client.ts
export class clientWrapper {
  info: IClientInfo;
  stats: IClientStats;
  clientSettings: IClientSettings;
  super: IClientSuper;
  ws: MyWebSocket | undefined;
  protected constructor(clientInfo: IClientInfo, ws?: MyWebSocket) {
    this.info = { id: clientInfo.id, ip: clientInfo.ip, type: clientInfo.type },
    this.stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined },
    this.clientSettings = { pw_hash: null },
    this.super = { customIntervallTime: false },
    this.ws = ws || undefined;
  }
  static createClient(clientInfo: IClientInfo, wsClient: MyWebSocket): clientWrapper {
    return new clientWrapper(clientInfo, wsClient);
  }
}

export interface IClients {
  id: clientWrapper;
}

export interface IClientsWrapper {
  clients: Record<string, clientWrapper>;
}

@injectable()
export class clientsWrapper {
  protected clients: IClientsWrapper;
  constructor(@inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: IClientsWrapper) {
    this.clients = clientsInstance || {};  // Initialize if needed
  }
}

export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
