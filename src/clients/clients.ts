"use strict";
import { inject, injectable, postConstruct } from "inversify";
import { clientsWrapper, MyWebSocket, ClientType, IClientInfo, IClientSettings, clientWrapper } from "./clientInstance";
import si from 'systeminformation';
import { BaseEvent, CustomErrorEvent, IBaseEvent, IClientsEvent, IEventTypes, MainEventTypes, SubEventTypes } from "../global/eventInterface";
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
      switch (event.subType) {
        case SubEventTypes.CLIENTS.PRINT_DEBUG:
          console.log("Clients:");
          console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.CLIENTS.SUBSCRIBE:
          this.handleClientSubscribe(event);
          break;
        case SubEventTypes.CLIENTS.UNSUBSCRIBE:
          this.handleClientUnsubscribe(event.clientsEvent.id);
          break;
        case SubEventTypes.CLIENTS.UPDATE_SETTINGS:
          this.handleClientModifySettings(event.clientsEvent.id, event.data);
          break;
        case SubEventTypes.CLIENTS.UPDATE_STATS:
          this.handleClientUpdateStats(event.clientsEvent.id);
          break;
        case SubEventTypes.CLIENTS.UPDATE_ALL_STATS:
          this.handleClientsUpdateStats();
          break;
        case SubEventTypes.CLIENTS.MESSAGE_PAKET_READY:
          const newEvent = event as IClientsEvent
          const newID = newEvent.clientsEvent.id;
          this.sendMessagePacket(event.clientsEvent.client, "pidInfo", event.data);
          this.sendMessagePacket(event.clientsEvent.client, "latencyGoogle", event.data);
          this.sendMessagePacket(event.clientsEvent.client, "rconInfo", event.data);
          this.sendMessagePacket(event.clientsEvent.client, "rconPlayers", event.data);
          break;
            // case SubEventTypes.CLIENTS.MESSAGE:
        //   this.handleClientMessage(event);
        //   break;
        // case SubEventTypes.CLIENTS.SERVER_MESSAGE_READY:
        //   this.clientsMessageReady(newID, event.message, event.data, event.data.isBinary);
        //   break;
        case SubEventTypes.CLIENTS.MESSAGE_PAKET_READY:
          Object.entries(event.data).map(([key, value]) => {
            const newEvent: IClientsEvent = {
              subType: SubEventTypes.CLIENTS.MESSAGE_READY,
              message: key,
              success: true,
              data: value,
              clientsEvent: { id: event.clientsEvent.id, ip: event.clientsEvent.ip, clientType: event.clientsEvent.clientType, client: event.clientsEvent.client },
            };
            this.eV.emit(MainEventTypes.CLIENTS, newEvent);
          });

        case SubEventTypes.CLIENTS.MESSAGE_READY:
          const wsClient = event.clientsEvent.client;
          if (event.clientsEvent.id == "ALL" || (wsClient && ((wsClient.type == ClientType.Admin) || (wsClient.type == ClientType.Server))))
            this.clientsMessageReady(event.clientsEvent.id, event.message, event.data, event.data.isBinary)
          else
            this.clientMessageReady(event.clientsEvent.id, event.message, event.data, event.data.isBinary);
          break;
        case SubEventTypes.CLIENTS.GREETING:
          const client = this.clients.client[event.clientsEvent.id];
          if (client) {
            const newIP = client.ws.ip;

            console.log("Client Greeting Received:", event.message, "From:", event.clientsEvent.id);
            console.dir(this.clients.client[event.clientsEvent.id].info, { depth: null, colors: true });
            // console.dir(this.clients.client[newID].stats);

            const helloEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.MESSAGE_READY}`,
              message: `chatMessage`,
              success: true,
              data: `Welcome ${event.clientsEvent.id} from ${newIP} | activeClients: ${this.clients.stats.activeClients} | clientsCounter: ${this.clients.stats.clientsCounter}`,
              clientsEvent: { id: event.clientsEvent.id, ip: event.clientsEvent.ip, clientType: event.clientsEvent.clientType, client: event.clientsEvent.client }
            };
            this.eV.emit(MainEventTypes.CLIENTS, helloEvent);
          }
          break;
        case SubEventTypes.CLIENTS.OTHER:
          console.log("other Clients Event ?", event);
          // console.dir(event);
          break;
        default:
          this.eV.emit(MainEventTypes.ERROR, `no ${event.subType} found in ${MainEventTypes.CLIENTS}`);
      }
    } else {
      this.eV.emit(MainEventTypes.ERROR, `no ${event} found in ${MainEventTypes.CLIENTS}`);
    }
  }

  async sendMessagePacket(event: MyWebSocket, type: string, data: any): Promise<void> {
    const newEvent: IClientsEvent = {
      subType: SubEventTypes.CLIENTS.MESSAGE_READY,
      message: type,
      success: true,
      data: data,
      clientsEvent: { id: event.id, ip: event.ip, clientType: event.type, client: event },
    };
    this.eV.emit(MainEventTypes.CLIENTS, newEvent);
  }

  // private async handleClientMessage(id: string, obj: any, isBinary: boolean) {
  //   const decodedData = Buffer.from(obj, 'base64').toString();
  //   const messageObject = JSON.parse(decodedData);

  //   if (messageObject.type) {
  //     switch (messageObject.type) {
  //       case 'greeting':
  //         this.handleGreeting(id, messageObject);
  //         break;
  //       // Add other cases for message types 
  //       default:
  //         console.log("handleClientMessage: Unknown message type", messageObject);
  //     }
  //   }
  // }
  handleGreeting(id: string, messageObject: any) {
    throw new Error("Method not implemented.");
  }
  public clientsMessageReady(id: string, type: string, data: string, isBinary: boolean) {
    Object.values(this.clients.client).forEach((client) => {
      if (id == "ALL" || (client.ws && ((client.ws.type === ClientType.Admin) || (client.ws.type === ClientType.Server && id != client.ws.id)))) this.clientMessageReady(client.info.id, type, data, isBinary);
    });
  }
  public clientMessageReady(id: string, type: string, data: string, isBinary: boolean): void {
    const client = this.clients.client[id];
    if (id == "ALL" && id != client.info.id || client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      switch (type) {
        case "serverMessage":
        case "pidInfo":
        case "chatMessage":
        case "rconPlayers":
        case "rconInfo":
        case "latencyGoogle":
        case "latencyUser":
          const newData = JSON.stringify(data);
          const rconInfoEvent: IBaseEvent = {
            subType: SubEventTypes.BASIC.CLIENTS,
            message: `${type} updated ${newData}`,
            success: true,
          };
          this.eV.emit(MainEventTypes.BASIC, rconInfoEvent);
          client.ws.send(JSON.stringify({ "ip": client.info.ip, "type": type, "obj": { [type]: data } }), { binary: isBinary });
          break;
        default:
          console.warn("clientMessageReady: unknown type", type);
          break;
      }
    } else { this.handleClientUnsubscribe(id); }
  }

  // this.sendMessagePacket(id, "pidInfo", this.stats.pu);
  // this.sendMessagePacket(id, "latencyGoogle", this.stats.latencyGoogle);
  // this.sendMessagePacket(id, "rconInfo", this.stats.rcon.info);
  // this.sendMessagePacket(id, "rconPlayers", this.stats.rcon.players);


  public handleClientSubscribe(client: IClientsEvent) { // Adjust 'any' type later
    //public create(newID: string, newIP: string, type: ClientType): void {
    try {
      const id = client.clientsEvent.id;
      const ip = client.data.ip;
      const type = client.data.type;

      this.clients.createClient(id, ip, type, client.clientsEvent.client);
      if (type !== ClientType.Server) {
        this.clients.stats.clientsCounter++;
        this.handleClientUpdateStats(id);
        if (++this.clients.stats.activeClients == 1)
          this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.MAIN.START_INTERVAL, message: 'Start interval', success: true });

        this.eV.emit(MainEventTypes.STATS, {
          subType: SubEventTypes.STATS.FORCE_UPDATE_ALL_FOR_ME,
          message: id,
        });
      }
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.CLIENTS,
        message: `Created client with id ${id}, type ${type}, ip ${ip}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleClientSubscribe", new CustomErrorEvent(`create client failed`, MainEventTypes.CLIENTS, error));
    }
  }

  public async handleClientUpdateStats(id: string): Promise<void> {
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
          clientsEvent: { id: clientData.info.id, ip: clientData.info.ip, clientType: clientData.info.type, client: clientData.ws}
        };
        this.eV.emit(MainEventTypes.CLIENTS, latencyUserEvent);
        //   this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.DEFAULT, message: `client ${clientData.info.id} not updated, time_diff: ${time_diff}` });
        // }
      }
    } else {
      this.handleClientUnsubscribe(clientData.info.id);
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
      const Type = this.clients.client[id].info.type;
      console.log(`bye bye... :, ${id}, type:, ${Type}`);
      if (id) {
        if (Type !== ClientType.Server) {
          console.dir(this.clients.client[id].info, { depth: null, colors: true });
          console.dir(this.clients.client[id].stats, { depth: null, colors: true });
          this.clients.stats.activeClients--;
          if (this.clients.stats.activeClients == 0) {
            this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.MAIN.STOP_INTERVAL, message: 'Stop interval' });
          }
        }
        this.clients.removeClient(id);
      } else {
        console.log("handleClientsEvent: no id found", id);
      }
    }
  }

  public removeClient(clientId: string): void {
    delete this.clients.client[clientId];
  }

  public getClient(clientId: string): clientWrapper | undefined {
    return this.clients.client[clientId];
  }
}


