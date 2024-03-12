"use strict";
import { inject, injectable, postConstruct } from "inversify";
import { clientsWrapper, MyWebSocket, ClientType, IClientInfo, IClientSettings, clientWrapper } from "./clientInstance";
import si from 'systeminformation';
import { BaseEvent, IClientsEvent, IEventTypes, MainEventTypes, SubEventTypes } from "../global/eventInterface";
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

  private handleClientsEvent(event: IClientsEvent) {
    // console.log("Clients event received:", event);
    if (event) {
      const newID = event.clientsEvent?.id;
      switch (event.subType) {
        case SubEventTypes.CLIENTS.SUBSCRIBE:
          this.handleClientSubscribe(event);
          break;
        case SubEventTypes.CLIENTS.UNSUBSCRIBE:
          console.log("bye bye... :", event.message, "From:", newID);
          console.dir(this.clients.client[newID].info);
          console.dir(this.clients.client[newID].stats);
          if (newID) this.handleClientUnsubscribe(newID);
          else console.log("handleClientsEvent: no id found", event.clientsEvent);
          break;
        case SubEventTypes.CLIENTS.UPDATE_SETTINGS:
          this.handleClientModifySettings(newID, event.data);
          break;
        case SubEventTypes.CLIENTS.UPDATE_STATS:
          if (newID) this.handleClientUpdateStats(newID);
          break;
        case SubEventTypes.CLIENTS.UPDATE_ALL_STATS:
          this.handleClientsUpdateStats();
          break;
        case SubEventTypes.CLIENTS.MESSAGE:
          this.handleClientMessage(newID, event.data, event.data.isBinary);
          break;
        case SubEventTypes.CLIENTS.MESSAGE_READY:
          if (newID == "ALL") this.clientsMessageReady(event.message, event.data, event.data.isBinary)
          else this.clientMessageReady(newID, event.message, event.data, event.data.isBinary);
          break;
        case SubEventTypes.CLIENTS.GREETING:
          const client = this.clients.client[newID];
          if (client) {
            const newIP = client.ws.ip;

            console.log("Client Greeting Received:", event.message, "From:", newID);
            console.dir(this.clients.client[newID].info);
            // console.dir(this.clients.client[newID].stats);

            const helloEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
              message: `chatMessage`,
              success: true,
              data: `Welcome ${newID} from ${newIP} | activeClients: ${this.clients.stats.activeClients} | clientsCounter: ${this.clients.stats.clientsCounter}`,
              clientsEvent: { id: newID as string }
            };
            this.eV.emit(MainEventTypes.CLIENTS, helloEvent);
          }
          break;
        case SubEventTypes.CLIENTS.OTHER:
          console.log("other Clients Event ?");
          break;
        default:
          this.eV.emit(MainEventTypes.ERROR, `no ${event.subType} found in ${MainEventTypes.CLIENTS}`);
      }
    } else {
      this.eV.emit(MainEventTypes.ERROR, `no ${event} found in ${MainEventTypes.CLIENTS}`);
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
    throw new Error("Method not implemented.");
  }
  public clientsMessageReady(type: string, data: string, isBinary: boolean) {
    Object.values(this.clients.client).forEach((client) => {
      this.clientMessageReady(client.info.id, type, data, isBinary);
    });
  }
  public clientMessageReady(id: string, type: string, data: string, isBinary: boolean): void {
    const client = this.clients.client[id];
    if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      console.log(`sending ${JSON.stringify(data)} to client ${id}`);
      switch (type) {
        case "pidInfo":
        case "chatMessage":
        case "extras":
        case "latencyGoogle":
        case "latencyUser":
          client.ws.send(JSON.stringify({ "ip": client.info.ip, "type": type, "obj": { [type]: data } }), { binary: isBinary });
          break;
        default:
          console.warn("clientMessageReady: unknown type", type);
          break;
      }
    } else { console.log("clientMessageReady: no ws obj found with id", id); }
  }

  public handleClientSubscribe(event: IClientsEvent) { // Adjust 'any' type later
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
    this.clients.stats.activeClients++;
    let newClient = wsClient as unknown as MyWebSocket;
    newClient.id = `${id}`;
    newClient.ip = `${newIP}`;
    //public create(newID: string, newIP: string, type: ClientType): void {
    const newClientInfo: IClientInfo = { id: newClient.id, ip: newIP, type: typeFinal };
    let newResult: { errCode: number, message?: string, data?: any } = { errCode: 1 };
    try {
      this.clients.createClient(newClient.id, newIP, typeFinal, newClient);
      if (this.clients.client[newClient.id]) newResult = { errCode: 0 };
    } catch (error) {
      newResult = { errCode: 2, message: `create client with id ${newClient.id} failed`, data: error };
    }
    const newEvent: IClientsEvent = {
      subType: SubEventTypes.BASIC.DEFAULT,
      message: `Created client with id ${newClient.id}`,
      success: newResult.errCode == 0 ? true : false,
      clientsEvent: { id: newClientInfo.id, ip: newClientInfo.ip, clientType: newClientInfo.type }
    };
    this.handleClientUpdateStats(newClient.id);

    if (this.clients.stats.activeClients == 1)
      this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.MAIN.START_INTERVAL, message: 'Start interval' });
    this.eV.emit(MainEventTypes.BASIC, newEvent);
  }
  public async handleClientUpdateStats(id: string): Promise<void> {
    if (id) {
      const clientData = this.clients.client[id];
      // Your existing client update logic from `createTimer` will go here
      if (clientData && clientData.ws.readyState === WebSocket.OPEN) {
        const time_diff = Date.now() - clientData.stats.lastUpdates.statsUpdated;
        if (!clientData.stats.lastUpdates.statsUpdated || time_diff > 20000) {
          // this.eV.emit(SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
          clientData.stats.latency = await si.inetLatency(clientData.info.ip);
          clientData.stats.eventCount++;
          clientData.stats.lastUpdates['statsUpdated'] = Date.now();
          this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.DEFAULT, message: `ID: ${clientData.info.id} updated, time_diff: ${time_diff}` });
          const latencyUserEvent: IClientsEvent = {
            subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
            message: `latencyUser`,
            success: true,
            data: clientData.stats.latency,
            clientsEvent: { id: id }
          };
          this.eV.emit(MainEventTypes.CLIENTS, latencyUserEvent);
          }
        //  else {
        //   this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.DEFAULT, message: `client ${clientData.info.id} not updated, time_diff: ${time_diff}` });
        // }
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
    console.log(`Update all clients stats, clientsCount: ${this.clients.stats.clientsCounter} | activeClients: ${this.clients.stats.activeClients}`);
    Object.values(this.clients.client).forEach((client) => {
      this.handleClientUpdateStats(client.info.id);
    });
  }


  public handleClientUnsubscribe(id: string): void {
    if (this.clients.client[id]) {
      this.clients.removeClient(id);
      this.clients.stats.activeClients--;
      if (this.clients.stats.activeClients == 0)
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


