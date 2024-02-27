"use strict";
import { inject, injectable } from "inversify";
import * as eH from "../global/EventHandlingMixin";
import * as C from "./clientInstance";
import si from 'systeminformation';
import { ISettings, PRIVATE_SETTINGS_TOKEN } from "../settings/settingsInstance";

const CLIENTS_WRAPPER_TOKEN = Symbol('ClientsService');

export enum clientsType {
  create,
  update,
  delete,
  statsUpdated
}
export interface IClientsEvent {
  type: clientsType;
  client?: C.IClientInfo;
  data?: {
    errCode: number;
    message?: string;
  };
}
export class ClientsEvent {
  type?: clientsType;
  client?: C.IClientInfo;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}

class BaseClientsEvent implements eH.IBaseEvent{
  "cat": eH.catType = eH.catType.clients;
}

const MyClassWithMixin = eH.EventEmitterMixin(BaseClientsEvent);
const globalEventEmitter = new MyClassWithMixin();
@injectable()
export default class Clients extends eH.EventEmitterMixin<IClientsEvent>(BaseClientsEvent) {
  private _clients: Record<string, C.IClient>;
  constructor(@inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, C.IClient>) {
    super();
    this._clients = clientsInstance || {};  // Initialize if needed
  }
  public addClient(id: string, ip: string, type: string ) { // Adjust 'any' type later
    let typeFinal: C.ClientType;
    switch (type) {
      case 'admin':
        typeFinal = C.ClientType.Admin; 
        break;
      case 'server':
        typeFinal = C.ClientType.Server; 
        break;
        default:
        typeFinal = C.ClientType.Basic;
    }
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: C.IClientInfo = { id: id, ip: ip, type: typeFinal };
    let newResult: { errCode: number, message?: string, blob?: any } = { errCode: 1 };
    try {
      const newClient: C.IClient = C.clientWrapper.createClient(newClientInfo);
      this._clients[id] = newClient;
      newResult = { errCode: 0 };
    } catch (e) {
      newResult = { errCode: 2, message: 'create client failed', blob: e };
    }
    const newEvent: IClientsEvent = {
      type: clientsType.create,
      client: newClientInfo,
      data: newResult 
  };     this.emit('clientAdded', newEvent);
  }
  // public updateClientConfig(id: string, info: IClientInfo): void {
  //   const newClientInfo: IClientInfo = { id: id, ip: ip, type: typeFinal };
  //   const client = this._clients[id];
  //   if (client) {
  //     client.info.type = type;
  //     client._stats.eventCount++;
  //     client._stats.lastUpdates.updateConfig = Date.now();
  //   }
  // }
  public updateClientSettings(id: string, settings: C.IClientSettings) {
    const client = this._clients[id];
    if (client) {
      client._clientSettings = { ...settings }; // Update settings
      client._stats.eventCount++;
      client._stats.lastUpdates.updateSettings = Date.now();
    }
  }

  public async updateClientStats(id: string) {
    
    const client = this._clients[id];
    if (client) {
      client._stats.latency = await si.inetLatency(client.info.ip);
      client._stats.eventCount++;
      client._stats.lastUpdates['getClientLatency'] = Date.now();
      globalEventEmitter.emit("updateClientStats" + id);
    }
  }
  public removeClient(clientId: string): void {
    delete this._clients[clientId];
  }

  public getClient(clientId: string): C.IClient | undefined {
    return this._clients[clientId];
  }
}


