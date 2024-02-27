"use strict";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "../global/globalEventHandling";
import { ClientType, clientWrapper, IClient, IClientConfig, IClientSettings } from "./client/clientInstance";
import si from 'systeminformation';
import Main from "../main";


class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();

@injectable()
export default class Clients extends Main {

  public addClient(id: string, ip: string, type: string ) { // Adjust 'any' type later
    let typeFinal: ClientType;
    switch (type) {
      case 'admin':
        typeFinal = ClientType.Admin; 
        break;
      case 'server':
        typeFinal = ClientType.Server; 
        break;
        default:
        typeFinal = ClientType.Basic;
    }
    this._clients.create(id, ip, typeFinal); // Use index notation
    globalEventEmitter.emit("addClient " + id + " ip: "+ ip); 
  }

  public updateConfig(id: string, config: IClientConfig): void { // Adjust the 'any' type later
    const client = this._clients[id];
    if (client) {
      client._config = { ...config };
      client._stats.eventCount++;
      client._stats.lastUpdates.updateConfig = Date.now();
    }
  }
  public updateClientSettings(id: string, settings: IClientSettings) {
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
}


