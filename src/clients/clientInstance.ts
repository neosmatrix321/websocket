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

export const packetHandlers = {
  serverMessage: "serverMessage",
  pidInfo: "pidInfo",
  chatMessage: "chatMessage",
  extras: "extras",
  latencyGoogle: "latencyGoogle",
  latencyUser: "latencyUser",
  rconInfo: "rconInfo",
  rconPlayers: "rconPlayers",
};

export interface MyWebSocket extends WebSocket {
  id: string;
  ip: string;
  type: ClientType;
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
export interface IClientSettings {
  pw_hash?: string;
  type?: ClientType;
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
       this.info = { id: id, ip: ip };
       this.stats = { eventCount: 0, lastUpdates: { 'create': Date.now() }, messagesReceived: [], messagesToSend: [], latency: undefined };
       this.settings = { pw_hash: "NaN", type: type };
       this.super = { customIntervallTime: false };
       this.ws = ws;
   }
}

export interface IClientIndex {
  [id: string]: IClientWrapper;
}

export interface IClientsWrapper {
  client: Record<string, IClientWrapper>;
}

export class clientsWrapper {
  client: Record<string, IClientWrapper> = {};
  constructor() { }
  public createClient(id: string, ip: string, type: ClientType, ws: MyWebSocket): void {
    this.client[id] = new clientWrapper(id, ip, type, ws);
  }
  public removeClient(id: string): void {
    delete this.client[id];
  }
}

