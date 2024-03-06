"use strict";
import { inject, injectable } from "inversify";
import * as clientI from "./clientInstance";
import si from 'systeminformation';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import * as mainC from "../main";

const EventMixin = eH.SingletonEventManager.getInstance();

@injectable()
export default class Clients {
  private eV: typeof EventMixin;
  private clients: Record<string, clientI.IClient>;
  eM: eM.eventManager;
  constructor(@inject(clientI.CLIENTS_WRAPPER_TOKEN) clientsInstance: Record<string, clientI.IClient>,
  @inject(eM.EVENT_MANAGER_TOKEN) eMInstance: eM.eventManager) {
    this.eV = EventMixin;
    this.clients = clientsInstance || {};  // Initialize if needed
    this.eM = eMInstance;
  }
  public addClient(id: string, ip: string, type: string ) { // Adjust 'any' type later
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
    const newClientInfo: clientI.IClientInfo = { id: id, ip: ip, type: typeFinal };
    let newResult: { errCode: number, message?: string, data?: any } = { errCode: 1 };
    try {
      const newClient: clientI.IClient = clientI.clientWrapper.createClient(newClientInfo);
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

  public async updateClientStats(id: string) {
    
    Object.values(this.clients).forEach((client) => {
      client.stats.lastUpdates["timerUpdated"] = Date.now();
      // Your existing client update logic from `createTimer` will go here
      if (client.readyState === WebSocket.OPEN) {
        // ... your logic ...
        this.eV.emit(eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
      }
    });
    const client = this.clients[id];
    if (client) {
      client.stats.latency = await si.inetLatency(client.info.ip);
      client.stats.eventCount++;
      client.stats.lastUpdates['getClientLatency'] = Date.now();
      this.eM.emit("updateClientStats" + id);
    }
  }
  public removeClient(clientId: string): void {
    delete this.clients[clientId];
  }

  public getClient(clientId: string): clientI.IClient | undefined {
    return this.clients[clientId];
  }
}


