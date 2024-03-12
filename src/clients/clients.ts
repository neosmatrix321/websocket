"use strict";
import { inject, injectable, postConstruct } from "inversify";
import { clientsWrapper, MyWebSocket, ClientType, IClientInfo, IClientSettings, clientWrapper } from "./clientInstance";
import si from 'systeminformation';
import { BaseEvent, IBaseEvent, IEventTypes, MainEventTypes, SubEventTypes, createCustomDebugEvent } from "../global/eventInterface";
import { WebSocket } from 'ws';
import { EventEmitterMixin } from "../global/EventEmitterMixin";


const myDebugConsolePrint = () => {
  console.log('myDebugConsolePrint has been triggered!');
};

@injectable()
export class Clients {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  protected clients: clientsWrapper;
  constructor() {
    this.clients = new clientsWrapper();
    this.eV.on(MainEventTypes.CLIENTS, this.handleClientsEvent.bind(this));
  }

  public isMyWebSocketWithId(ws: WebSocket): ws is MyWebSocket {
    return 'id' in ws;
  }

  private handleClientsEvent(event: IEventTypes) {
    // console.log("Clients event received:", event);
    if (event) {
      switch (event.subType) {
        case SubEventTypes.CLIENTS.SUBSCRIBE:
          this.handleClientSubscribe(event);
          break;
        case SubEventTypes.CLIENTS.UNSUBSCRIBE:
          const newID = event.clientsEvent?.id;
          if (newID) this.handleClientUnsubscribe(newID);
          else console.log("handleClientsEvent: no id found", event.clientsEvent);
          break;
        case SubEventTypes.CLIENTS.UPDATE_SETTINGS:
          this.handleClientModifySettings(event.data.id, event.data);
          break;
        case SubEventTypes.CLIENTS.UPDATE_STATS:
          this.handleClientUpdateStats(event);
          break;
        case SubEventTypes.CLIENTS.UPDATE_ALL_STATS:
          this.handleClientsUpdateStats();
          break;
        case SubEventTypes.CLIENTS.MESSAGE:
          this.handleClientMessage(event.data.id, event.data, event.data.isBinary);
          break;
        case SubEventTypes.CLIENTS.GREETING:
          console.log("Client Greeting Received:", event.message, "From:", event.clientsEvent?.id, "Stats:", this.clients.stats);
          break;
        case SubEventTypes.CLIENTS.OTHER:
          console.log("other Clients Event ?");
          break;
        default:
          this.eV.emit(MainEventTypes.ERROR, createCustomDebugEvent(event, "no subType found"));	
      }
    } else {
      this.eV.emit(MainEventTypes.ERROR, createCustomDebugEvent(event, "no event found"));	
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
          console.log("handleClientMessage: Unknown message type", messageObject);
      }
    }
  }
  handleGreeting(id: string, messageObject: any) {
    throw new Error("handleGreeting: Method not implemented.");
  }

  public clientMessageReady(ws: IEventTypes): void {
    if (!ws) return; // Safety check
    const clientEvent = ws as BaseEvent;
    // 1. Process message (replace with your application logic)
    // const processedData = this.processClientMessage(clientEvent.message);
    // 2. Trigger other events based on the processed message
  } // Add more conditional event emissions as needed

  public handleClientSubscribe(event: IEventTypes) { // Adjust 'any' type later
    let typeFinal: ClientType;
    let newIP: string = ''; //  sessionIdContext: '390d00b3ece4b72c30c8da7f7862c2ea'
    const wsClient = event.clientsEvent?.client;
    if (!wsClient) {
      console.log("handleClientSubscribe: unknown event", event); // Safety check
      return
    }
    if ('_socket' in wsClient) {
      newIP = (wsClient as any)._socket.remoteAddress;
    }
    switch (newIP) {
      case 'admin':
        typeFinal = ClientType.Admin;
        break;
      case '192.168.228.7':
      case 'neo.dnsfor.me':
        typeFinal = ClientType.Server;
        break;
      default:
        typeFinal = ClientType.Basic;
    }
    const id = event.clientsEvent?.id;
    this.clients.stats.clientsCounter++;
    let newClient = wsClient as unknown as MyWebSocket;
    newClient.id = `${id}`;
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: IClientInfo = { id: newClient.id, ip: newIP, type: typeFinal };
    let newResult: { errCode: number, message?: string, data?: any } = { errCode: 1 };
    try {
      this.clients.createClient(newClient.id, newIP, typeFinal, newClient);
      if (this.clients.client[newClient.id]) newResult = { errCode: 0 };
    } catch (error) {
      newResult = { errCode: 2, message: `create client with id ${newClient.id} failed`, data: error };
    }
    const newEvent: IBaseEvent = {
      subType: SubEventTypes.BASIC.DEFAULT,
      message: `Created client with id ${newClient.id}`,
      success: newResult.errCode == 0 ? true : false,
      clientsEvent: { id: newClientInfo.id, ip: newClientInfo.ip, clientType: newClientInfo.type }
    };
    if (this.clients.stats.clientsCounter > 0)
      this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.MAIN.START_INTERVAL, message: 'Start interval' });
    this.eV.emit(MainEventTypes.BASIC, newEvent);
  }
  public async handleClientUpdateStats(event: IEventTypes): Promise<void> {
    const id = event.clientsEvent?.id;
    if (id) {
      const clientData = this.clients.client[id];
      clientData.stats.lastUpdates = { "statsUpdated": Date.now() };
      // Your existing client update logic from `createTimer` will go here
      if (clientData && clientData.ws.readyState === WebSocket.OPEN) {
        const time_diff = Date.now() - clientData.stats.lastUpdates.timerUpdated;
        if (time_diff > 20000) {
          // this.eV.emit(SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
          clientData.stats.latency = await si.inetLatency(clientData.info.ip);
          clientData.stats.eventCount++;
          clientData.stats.lastUpdates['getClientLatency'] = Date.now();
          this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.DEFAULT, message: `client ${clientData.info.id} updated`});
        }
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
  public handleClientModifySettings(id: string, settings: IClientSettings) {
    const client = this.clients.client[id];
    if (client) {
      client.settings = { ...settings }; // Update settings
      client.stats.eventCount++;
      client.stats.lastUpdates.updateSettings = Date.now();
    }
  }

  public async handleClientsUpdateStats(): Promise<void> {
    console.log("Update all clients stats, clientsCount: ", this.clients.stats.clientsCounter);
    Object.values(this.clients).forEach((client) => {
      this.handleClientUpdateStats(client);
    });
  }


  public handleClientUnsubscribe(id: string): void {
    if (this.clients.client[id]) {
      this.clients.removeClient(id);
      this.clients.stats.clientsCounter--;
      if (this.clients.stats.clientsCounter == 0)
        this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.MAIN.STOP_INTERVAL, message: 'Stop interval' });

      // this.eV.emit(SubEventTypes.CLIENTS.UNSUBSCRIBE, client.info.id);
    }
  }

  public removeClient(clientId: string): void {
    delete this.clients.client[clientId];
  }

  public getClient(clientId: string): clientWrapper | undefined {
    return this.clients.client[clientId];
  }
}


