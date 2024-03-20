"use strict";
import { inject, injectable, postConstruct } from "inversify";
import 'reflect-metadata';

import { clientsWrapper, MyWebSocket, ClientType, IClientInfo, IClientSettings, clientWrapper } from "./clientInstance";
import si from 'systeminformation';
import { BaseEvent, IBaseEvent, IClientsEvent, IEventTypes, MainEventTypes, SubEventTypes } from "../global/eventInterface";
import { WebSocket } from 'ws';
import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { StatsWrapperSymbol, statsWrapper } from "../stats/statsInstance";
import { CLIENTS_WRAPPER_TOKEN } from "../main";
import { statsContainer } from "../global/containerWrapper";



@injectable()
export class Clients {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  @inject(() => CLIENTS_WRAPPER_TOKEN) protected clients!: clientsWrapper;
  protected stats: statsWrapper = statsContainer;
  constructor() {
    this.clients = new clientsWrapper();
    this.setupEventHandlers();
  }

  public isMyWebSocketWithId(ws: WebSocket): ws is MyWebSocket {
    return 'id' in ws;
  }

  private setupEventHandlers() {
    this.eV.on(MainEventTypes.CLIENTS, (event: IClientsEvent) => {
      // console.log("Clients event received:", event);
      if (event) {
        switch (event.subType) {
          case SubEventTypes.CLIENTS.PRINT_DEBUG:
            this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `CLIENTS` });

            // console.log("Clients:");
            // console.dir(this.clients, { depth: 3, colors: true });
            break;
          case SubEventTypes.CLIENTS.SUBSCRIBE:
            try {
              this.handleClientSubscribe(event);
              return true;
            } catch (error) {
              this.eV.handleError(SubEventTypes.ERROR.WARNING, `handleClientSubscribe`, MainEventTypes.CLIENTS, new Error(`create client failed`), error);
              // return Promise.resolve('clientSubscribed');
            }
            return false; 
          case SubEventTypes.CLIENTS.UNSUBSCRIBE:
            this.handleClientUnsubscribe(event.client.id);
            break;
          case SubEventTypes.CLIENTS.UPDATE_SETTINGS:
            this.handleClientModifySettings(event.client.id, event.data);
            break;
          case SubEventTypes.CLIENTS.UPDATE_STATS:
            this.handleClientUpdateStats(event.client.id);
            break;
          case SubEventTypes.CLIENTS.UPDATE_ALL_STATS:
            this.handleClientsUpdateStats();
            break;
          // case SubEventTypes.CLIENTS.MESSAGE:
          //   this.handleClientMessage(event);
          //   break;
          // case SubEventTypes.CLIENTS.SERVER_MESSAGE_READY:
          //   this.clientsMessageReady(newID, event.message, event.data, event.data.isBinary);
          //   break;
          case SubEventTypes.CLIENTS.MESSAGE_PAKET_READY:
            Object.entries(event.data).map(([key, value]) => {
              this.sendMessagePacket(event.client, key, value);
            });

          case SubEventTypes.CLIENTS.MESSAGE_READY:
            const wsClient = event.client;
            if (wsClient.id == "ALL" || (wsClient && ((wsClient.type == ClientType.Admin) || (wsClient.type == ClientType.Server))))
              this.clientsMessageReady(event.client.id, event.message, event.data, event.data.isBinary)
            else
              this.clientMessageReady(event.client.id, event.message, event.data, event.data.isBinary);
            break;
          case SubEventTypes.CLIENTS.GREETING:
            const client = this.clients.client[event.client.id];
            // console.dir(event.data, { depth: null, colors: true });
            if (client) {
              const newIP = client.ws.ip;
              if (client.ws.type != ClientType.Server) { // handle client greeting && send initial data
                this.handleClientUpdateStats(client.ws.id);
                this.eV.emit(MainEventTypes.CLIENTS, {
                  subType: SubEventTypes.CLIENTS.MESSAGE_PAKET_READY,
                  message: `allStatsUpdated`,
                  data: [{
                    "chatMessage": `Welcome ${event.client.id} from ${newIP} | activeClients: ${this.stats.client.activeClients} | clientsCounter: ${this.stats.client.clientsCounter}`,
                    "pidInfo": { ...this.stats.global.pu }
                  },
                  { "latencyGoogle": this.stats.global.latencyGoogle },
                  { "rconInfo": { ...this.stats.global.rcon.info } },
                  {
                    "rconPlayers": { ...this.stats.global.rcon.players }
                  }],
                  id: client.ws.id,
                  client: client.ws as MyWebSocket,
                });
              }
            }
            break;
          default:
            this.eV.emit(MainEventTypes.ERROR, `no ${event.subType} found in ${MainEventTypes.CLIENTS}`);
        }
      } else {
        this.eV.handleError(SubEventTypes.ERROR.INFO, `createServer`, MainEventTypes.CLIENTS, new Error(`no ${event} found in ${MainEventTypes.CLIENTS}`), event);
      }
    });
  }

  async sendMessagePacket(event: MyWebSocket, type: string, data: any): Promise<void> {
    const newEvent: IClientsEvent = {
      subType: SubEventTypes.CLIENTS.MESSAGE_READY,
      message: type,
      success: true,
      data: data,
      id: event.id,
      client: event,
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
  //         // console.log("handleClientMessage: Unknown message type", messageObject);
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
  public clientMessageReady(id: string, type: string, data: string, isBinary: boolean): any {
    if (!this.stats.server.webHandle.isAlive || !this.stats.server.webHandle.hasConnection) return;
    // this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: 'No Client, message not sent', success: true });
    const client = this.clients.client[id];
    if (client && ((id == "ALL" && id != client.ws.id) || (client.ws.readyState === WebSocket.OPEN))) {
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
          // console.warn("clientMessageReady: unknown type", type);
          break;
      }
    } else { this.handleClientUnsubscribe(id); }
  }

  // this.sendMessagePacket(id, "pidInfo", this.stats.client.pu);
  // this.sendMessagePacket(id, "latencyGoogle", this.stats.client.latencyGoogle);
  // this.sendMessagePacket(id, "rconInfo", this.stats.client.rcon.info);
  // this.sendMessagePacket(id, "rconPlayers", this.stats.client.rcon.players);


  public async handleClientSubscribe(client: IClientsEvent): Promise<boolean> { // Adjust 'any' type later
    try {
      const id = client.client.id;
      const ip = client.client.ip;
      const type = client.client.type;
      this.stats.client.clientsCounter++;

      this.clients.createClient(id, ip, type, client.client);
      if (type != ClientType.Server) {
        if (++this.stats.client.activeClients == 1) {
          this.stats.server.webHandle.hasConnection = true;
        }
      }
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.CLIENTS,
        message: `Created client with id ${id}, type ${type}, ip ${ip}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.eV.emit('clientSubscribeResult', true);
      return true;
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleClientSubscribe", MainEventTypes.CLIENTS, new Error(`create client failed`), error);
    }
    this.eV.emit('clientSubscribeResult', false);
    return false;
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
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `ID: ${clientData.info.id} updated, time_diff: ${time_diff}`, success: true });
        const latencyUserEvent: IClientsEvent = {
          subType: SubEventTypes.CLIENTS.MESSAGE_READY,
          message: `latencyUser`,
          success: true,
          data: clientData.stats.latency,
          id: clientData.info.id,
          client: clientData.ws
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
  //     client.settings.type = type;
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
      this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `Updated client ${id} settings`, success: true });
    }
  }

  public async handleClientsUpdateStats(): Promise<void> {
    // this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `Update all clients stats, clientsCount: ${this.stats.client.clientsCounter} | activeClients: ${this.stats.client.activeClients}`, success: true });
    Object.values(this.clients.client).forEach((client) => {
      this.handleClientUpdateStats(client.info.id);
    });
  }


  public handleClientUnsubscribe(id: string): void {
    if (this.clients.client[id]) {
      const Type = this.clients.client[id].settings.type;
      this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `Unsubscribed client ${id}, ip: ${this.clients.client[id].info.ip}, type: ${Type}`, success: true });
      if (id) {
        if (Type !== ClientType.Server) {
          // console.dir(this.clients.client[id].info, { depth: null, colors: true });
          // console.dir(this.clients.client[id].stats, { depth: null, colors: true });
          if (!(--this.stats.client.activeClients > 0)) {
            this.stats.server.webHandle.hasConnection = false;
            this.eV.emit(MainEventTypes.MAIN, { subType: SubEventTypes.SERVER.STOP_INTERVAL, message: 'Stop interval' });
          }
        }
        this.clients.removeClient(id);
      } else {
        // console.log("handleClientsEvent: no id found", id);
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


