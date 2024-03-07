"use strict";
import { inject, injectable } from "inversify";
import * as clientI from "./clientInstance";
import si from 'systeminformation';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import Main from "../main";
import * as serverI from "../server/serverInstance";
import Server from "../server/server";

const EventMixin = eM.SingletonEventManager.getInstance();

@injectable()
export default class Clients {
  private eV: eM.eventManager;
  private clients: Record<string, clientI.clientWrapper>;
  constructor(@inject(clientI.CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, clientI.clientWrapper>) {
    this.eV = EventMixin;
    this.clients = clientsInstance || {};  // Initialize if needed
  }
  public addClient(id: string, ip: string, type: string, wsClient: serverI.MyWebSocket) { // Adjust 'any' type later
    let typeFinal: clientI.ClientType;
    switch (type) {
      case 'admin':
        typeFinal = clientI.ClientType.Admin; 
        break;
      case 'server':
        typeFinal = clientI.ClientType.Server; 
        break;
        default:
        typeFinal = clientI.ClientType.Basic;
    }
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: clientI.IClientInfo = { id: id, ip: ip, type: typeFinal};
    let newResult: { errCode: number, message?: string, data?: any } = { errCode: 1 };
    try {
      const newWsClient = wsClient as serverI.MyWebSocket || undefined;
      const newClient: clientI.clientWrapper = clientI.clientWrapper.createClient(newClientInfo, newWsClient);
      this.clients[id] = newClient;
      newResult = { errCode: 0 };
    } catch (e) {
      newResult = { errCode: 2, message: 'create client failed', data: e };
    }
    const newEvent: eH.IBaseEvent = {
      mainTypes: [eH.MainEventTypes.CLIENTS],
      subTypes: [eH.SubEventTypes.CLIENTS.CREATED],
      message: 'Create client event',
      success: newResult.errCode == 0 ? true : false, 
      clientsEvent: { id: newClientInfo.id, ip: newClientInfo.ip, clientType: newClientInfo.type }
   };
   this.eV.emit(eH.SubEventTypes.CLIENTS.CREATE, newEvent);
  }
  public async updateClientStats(client: clientI.clientWrapper): Promise<void> {
    if (client) {
      const time_diff = Date.now() - client.stats.lastUpdates.timerUpdated;
      if (time_diff > 20000) {
        // this.eV.emit(eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
        client.stats.latency = await si.inetLatency(client.info.ip);
        client.stats.eventCount++;
        client.stats.lastUpdates['getClientLatency'] = Date.now();
        this.eV.emit(eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
      }

    }

  }
  // public updateClientConfig(id: string, info: IClientInfo): void {
  //   const newClientInfo: IClientInfo = { id: id, ip: ip, type: typeFinal };
  //   const client = this.clients[id];
  //   if (client) {
  //     client.info.type = type;
  //     client.stats.eventCount++;
  //     client.stats.lastUpdates.updateConfig = Date.now();
  //   }
  // }
  public updateClientSettings(id: string, settings: clientI.IClientSettings) {
    const client = this.clients[id];
    if (client) {
      client.clientSettings = { ...settings }; // Update settings
      client.stats.eventCount++;
      client.stats.lastUpdates.updateSettings = Date.now();
    }
  }

  public async updateClientsStats(): Promise<void> {
    Object.values(this.clients).forEach((client) => {
      client.stats.lastUpdates = { "statsUpdated": Date.now() };
      // Your existing client update logic from `createTimer` will go here
      if (client.ws?.readyState === WebSocket.OPEN) {
        // ... your logic ...
        const choosenClient = this.clients[client.info.id];
        if (choosenClient) {
          this.updateClientStats(client);
        }
      }
    });
  }
  public removeClient(clientId: string): void {
    delete this.clients[clientId];
  }

  public getClient(clientId: string): clientI.clientWrapper | undefined {
    return this.clients[clientId];
  }
}


