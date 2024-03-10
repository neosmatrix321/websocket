"use strict";
import { inject, injectable } from "inversify";
import * as clientI from "./clientInstance";
import si from 'systeminformation';
import * as eM from "../global/EventEmitterMixin";
import * as eventI from "../global/eventInterface";
import { WebSocket } from 'ws';
import { EventEmitterMixin } from "../global/EventEmitterMixin";

const EventMixin = EventEmitterMixin.getInstance();
export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');


@injectable()
export default class Clients {
  private eV: eM.EventEmitterMixin = EventMixin;
  @inject(CLIENTS_WRAPPER_TOKEN) protected clients!: clientI.clientsWrapper
  constructor() {
    this.eV.on(eventI.MainEventTypes.CLIENTS, this.handleClientsEvent.bind(this));
  }


  public isMyWebSocketWithId(ws: WebSocket): ws is clientI.MyWebSocket {
    return 'id' in ws;
  }

  private handleClientsEvent(event: eventI.IEventTypes, client: clientI.MyWebSocket, obj: any, isBinary: boolean) {
    switch (event.subType) {
      case eventI.SubEventTypes.CLIENTS.SUBSCRIBE:
        this.handleClientSubscribe(client);
        break;
      case eventI.SubEventTypes.CLIENTS.UNSUBSCRIBE:
        this.handleClientUnsubscribe(client.id);
        break;
      case eventI.SubEventTypes.CLIENTS.UPDATE_SETTINGS:
        this.handleClientModifySettings(client.id, obj);
        break;
      case eventI.SubEventTypes.CLIENTS.UPDATE_STATS:
        this.handleClientUpdateStats(client.id);
        break;
      case eventI.SubEventTypes.CLIENTS.UPDATE_ALL_STATS:
        this.handleClientsUpdateStats();
        break;
      case eventI.SubEventTypes.CLIENTS.MESSAGE:
        this.handleClientMessage(client.id, obj, isBinary);
        break;
      default:
        console.warn('Unknown clients event subtype:', event.subType);
    }
  }

  private async handleClientMessage(id: string, obj: any, isBinary: boolean) {
    const decodedData = Buffer.from(obj, 'base64').toString();
    const messageObject = JSON.parse(decodedData);

    if (messageObject.type) {
      switch (messageObject.type) {
        case 'greeting':
          this.handleGreeting(id, messageObject);
          break;
        // Add other cases for message types 
        default:
          console.log("Unknown message type");
      }
    }
  }
  handleGreeting(id: string, messageObject: any) {
    throw new Error("Method not implemented.");
  }

  public clientMessageReady(ws: eventI.IEventTypes): void {
    if (!ws) return; // Safety check
    const clientEvent = ws as eventI.BaseEvent;
    // 1. Process message (replace with your application logic)
    // const processedData = this.processClientMessage(clientEvent.message);
    // 2. Trigger other events based on the processed message
  } // Add more conditional event emissions as needed

  public handleClientSubscribe(wsClient: WebSocket) { // Adjust 'any' type later
    let typeFinal: clientI.ClientType;
    let newIP: string = '';
    if ('_socket' in wsClient) {
      newIP = (wsClient as any)._socket.remoteAddress;
    }
    switch (newIP) {
      case 'admin':
        typeFinal = clientI.ClientType.Admin;
        break;
      case '192.168.228.7':
      case 'neo.dnsfor.me':
        typeFinal = clientI.ClientType.Server;
        break;
      default:
        typeFinal = clientI.ClientType.Basic;
    }

    this.clients.stats.clientsCounter++;
    let newClient = wsClient as unknown as clientI.MyWebSocket;
    newClient.id = `${this.clients.stats.clientsCounter}`;
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: clientI.IClientInfo = { id: newClient.id, ip: newIP, type: typeFinal };
    let newResult: { errCode: number, message?: string, data?: any } = { errCode: 1 };
    try {
      this.clients.createClient(newClient.id, newIP, typeFinal, newClient);
      if (this.clients.client[`${newClient.id}`]) newResult = { errCode: 0 };
    } catch (e) {
      newResult = { errCode: 2, message: 'create client failed', data: e };
    }
    const newEvent: eventI.IBaseEvent = {
      subType: eventI.SubEventTypes.BASIC.DEFAULT,
      message: 'Create client event',
      success: newResult.errCode == 0 ? true : false,
      clientsEvent: { id: newClientInfo.id, ip: newClientInfo.ip, clientType: newClientInfo.type }
    };
    this.eV.emit(eventI.MainEventTypes.BASIC, newEvent);
  }
  public async handleClientUpdateStats(id: string): Promise<void> {
    const clientData = this.clients.client[id];
    clientData.stats.lastUpdates = { "statsUpdated": Date.now() };
    // Your existing client update logic from `createTimer` will go here
    if (clientData && clientData.ws.readyState === WebSocket.OPEN) {
      const time_diff = Date.now() - clientData.stats.lastUpdates.timerUpdated;
      if (time_diff > 20000) {
        // this.eV.emit(eventI.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
        clientData.stats.latency = await si.inetLatency(clientData.info.ip);
        clientData.stats.eventCount++;
        clientData.stats.lastUpdates['getClientLatency'] = Date.now();
        this.eV.emit(eventI.SubEventTypes.CLIENTS.UPDATE_STATS, clientData.info.id);
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
  public handleClientModifySettings(id: string, settings: clientI.IClientSettings) {
    const client = this.clients.client[id];
    if (client) {
      client.settings = { ...settings }; // Update settings
      client.stats.eventCount++;
      client.stats.lastUpdates.updateSettings = Date.now();
    }
  }

  public async handleClientsUpdateStats(): Promise<void> {
    Object.values(this.clients).forEach((client) => {
      this.handleClientUpdateStats(client);
    });
  }


  public handleClientUnsubscribe(id: string): void {
    if (this.clients.client[id]) {
      this.clients.removeClient(id);
      this.clients.stats.clientsCounter--;
      // this.eV.emit(eventI.SubEventTypes.CLIENTS.UNSUBSCRIBE, client.info.id);
    }
  }

  public removeClient(clientId: string): void {
    delete this.clients.client[clientId];
  }

  public getClient(clientId: string): clientI.clientWrapper | undefined {
    return this.clients.client[clientId];
  }
}


