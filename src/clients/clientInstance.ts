"use strict";
import { Injectable } from "@angular/core";
import * as eM from "../global/EventHandlingManager";
import * as eH from "../global/EventHandlingMixin";
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

export enum clientsType {
  create,
  update,
  delete,
  statsUpdated
}
export interface IClientsEvent extends eH.IEventMap{
  message?: string;
  type?: clientsType;
  client: IClientInfo;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}
export class BaseClientsEvent {
  "cat": eH.catType = eH.catType.clients;
}

// client.ts
@Injectable()
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

@injectable()
export default class clientsWrapper {
  protected _clients: Record<string, IClient>;
  constructor(@inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, IClient>) {
    this._clients = clientsInstance || {};  // Initialize if needed
  }
}

export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
