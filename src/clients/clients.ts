"use strict";
import { inject, injectable } from "inversify";
import * as clientsI from "./clientInstance";
import si from 'systeminformation';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";


@injectable()
export default class Clients {
  private _clients: Record<string, clientsI.IClient>;
  eM: eM.eventManager;
  constructor(@inject(clientsI.CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, clientsI.IClient>,
  @inject(eM.EVENT_MANAGER_TOKEN) eMInstance: eM.eventManager) {
    super();
    this._clients = clientsInstance || {};  // Initialize if needed
    this.eM = eMInstance;
  }
  public addClient(id: string, ip: string, type: string ) { // Adjust 'any' type later
    let typeFinal: clientsI.ClientType;
    switch (type) {
      case 'admin':
        typeFinal = clientsI.ClientType.Admin; 
        break;
      case 'server':
        typeFinal = clientsI.ClientType.Server; 
        break;
        default:
        typeFinal = clientsI.ClientType.Basic;
    }
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: clientsI.IClientInfo = { id: id, ip: ip, type: typeFinal };
    let newResult: { errCode: number, message?: string, blob?: any } = { errCode: 1 };
    try {
      const newClient: clientsI.IClient = clientsI.clientWrapper.createClient(newClientInfo);
      this._clients[id] = newClient;
      newResult = { errCode: 0 };
    } catch (e) {
      newResult = { errCode: 2, message: 'create client failed', blob: e };
    }
    const newEvent: clientsI.IClientsEvent = {
      type: clientsI.clientsType.create,
      client: newClientInfo,
      data: newResult 
  };     this.eM.emit('clientAdded', newEvent);
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
  public updateClientSettings(id: string, settings: clientsI.IClientSettings) {
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
      this.eM.emit("updateClientStats" + id);
    }
  }
  public removeClient(clientId: string): void {
    delete this._clients[clientId];
  }

  public getClient(clientId: string): clientsI.IClient | undefined {
    return this._clients[clientId];
  }
}


