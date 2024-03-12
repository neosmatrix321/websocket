"use strict";
import 'reflect-metadata';
import { Clients } from './clients';
import { WebSocket } from 'ws';

export enum ClientType {
  Basic,
  Admin,
  Server,
  Unknown
  // ...
}

export interface MyWebSocket extends WebSocket {
  id: string | undefined;
  ip: string | undefined;
  type: string | undefined;
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


export interface IClientWrapper {
  info: IClientInfo;
  stats: IClientStats;
  settings: IClientSettings;
  super: IClientSuper;
  ws: MyWebSocket;
}

// client.ts
export class clientWrapper implements IClientWrapper {
   info: IClientInfo;
   stats: IClientStats;
   settings: IClientSettings;
   super: IClientSuper;
   ws: MyWebSocket;

   constructor(id: string, ip: string, type: ClientType, ws: MyWebSocket) {
       this.info = { id: id, ip: ip, type: type };
       this.stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined };
       this.settings = { pw_hash: null };
       this.super = { customIntervallTime: false };
       this.ws = ws;
   }
}

interface IwebHandleStats {
  connectedClients: number
}

interface IfileHandleStats {
  connectedClients: number
}

interface IClientsStats {
  webHandle: IwebHandleStats,
  fileHandle: IfileHandleStats,
  clientsCounter: number,
  activeClients: number,
}

export interface IClientIndex {
  [id: string]: IClientWrapper;
}

export interface IClientsWrapper {
  client: Record<string, IClientWrapper>;
  stats: IClientsStats;
}

export class clientsWrapper {
  client: Record<string, IClientWrapper> = {};
  stats: IClientsStats = {
    webHandle: { connectedClients: 0 },
    fileHandle: { connectedClients: 0 },
    clientsCounter: 0,
    activeClients: 0,
  }
  constructor() { }
  public createClient(id: string, ip: string, type: ClientType, ws: MyWebSocket): void {
    this.client[id] = new clientWrapper(id, ip, type, ws);
  }
  public removeClient(id: string): void {
    delete this.client[id];
  }
}

