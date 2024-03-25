"use strict";
import { inject, injectable } from "inversify";
import 'reflect-metadata';

import { clientsWrapper, MyWebSocket, ClientType, IClientSettings, clientWrapper } from "./clientInstance";
import si from 'systeminformation';
import { IBaseEvent, IClientsEvent, MainEventTypes, SubEventTypes } from "../global/eventInterface";
import { WebSocket } from 'ws';
import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IPU, statsWrapper, IRconStatsPlayers, IRconStatsInfo } from '../global/statsInstance';
import { CLIENTS_WRAPPER_TOKEN } from "../main";
import { statsContainer } from "../global/containerWrapper";

interface IClientMessagePaket {
  "serverMessage": string;
  "pidInfo": IPU;
  "extras": { activeClients: number, clientsCounter: number };
  "chatMessage": string;
  "rconPlayers": IRconStatsPlayers[];
  "rconInfo": IRconStatsInfo;
  "latencyGoogle": string;
  "latencyUser": string;
  "ALL": boolean;
  [key: string]: any;
}

@injectable()
export class Clients {
  private eV: EventEmitterMixin = mixin;
  protected sendMessageIntval: NodeJS.Timeout = setInterval(() => { }, 10000);

  @inject(() => CLIENTS_WRAPPER_TOKEN) protected clients!: clientsWrapper;
  protected stats: statsWrapper = statsContainer;
  constructor() {
    clearInterval(this.sendMessageIntval);
    this.clients = new clientsWrapper();
    this.setupEventHandlers();
  }

  public isMyWebSocketWithId(ws: WebSocket): ws is MyWebSocket {
    return 'id' in ws;
  }

  private setupEventHandlers() {
    this.eV.on(MainEventTypes.CLIENTS, (event: IClientsEvent): void => {
      // console.log("Clients event received:", event);
      const newID = event.id;
      switch (event.subType) {
        case SubEventTypes.CLIENTS.PRINT_DEBUG:
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `CLIENTS` });

          // console.log("Clients:");
          // console.dir(this.clients, { depth: 3, colors: true });
          break;
        case SubEventTypes.CLIENTS.START_INTERVAL:
          this.sendMessageIntvalToggle('start');
          break;
        case SubEventTypes.CLIENTS.STOP_INTERVAL:
          this.sendMessageIntvalToggle('stop');
          break;
        case SubEventTypes.CLIENTS.SUBSCRIBE:
          this.handleClientSubscribe(event);
          break;
        case SubEventTypes.CLIENTS.UNSUBSCRIBE:
          this.handleClientUnsubscribe(newID);
          break;
        case SubEventTypes.CLIENTS.UPDATE_SETTINGS:
          this.handleClientModifySettings(newID, event.data);
          break;
        case SubEventTypes.CLIENTS.UPDATE_STATS:
          this.handleClientUpdateStats(newID);
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
        case SubEventTypes.CLIENTS.MESSAGE_READY:
          const wsClient = this.clients.client[newID].ws;
          if (newID == "ALL" || (wsClient && ((wsClient.type == ClientType.Admin) || (wsClient.type == ClientType.Server))))
            this.clientsMessageReady(newID, event.type, event.data);
          else
            this.clientMessageReady(newID, event.type, event.data);
          break;
        case SubEventTypes.CLIENTS.GREETING:
          const client = this.clients.client[newID];
          // console.dir(event.data, { depth: null, colors: true });
          if (client) {
            if (client.ws.type != ClientType.Server) { // handle client greeting && send initial data
              this.handleClientUpdateStats(newID).then(() => {

                this.clientMessageReady(newID, ["ALL"], { serverMessage: "Welcome to the server" });
              }).catch((error) => {
                this.eV.handleError(SubEventTypes.ERROR.WARNING, `handleClientUpdateStats`, MainEventTypes.CLIENTS, error, event);
              });
            }
          }
          break;
        default:
          this.eV.handleError(SubEventTypes.ERROR.INFO, `createServer`, MainEventTypes.CLIENTS, new Error(`no ${event.subType} found in ${MainEventTypes.CLIENTS}`), event);
          break;
      }
    });
  }


  public clientsMessageReady(id: string, type: string[], data: Partial<IClientMessagePaket>): any {
    Object.values(this.clients.client).forEach((client) => {
      if (id == "ALL" || (client.ws && ((client.ws.type === ClientType.Admin) || (client.ws.type === ClientType.Server && id != client.ws.id)))) this.clientMessageReady(client.info.id, type, data);
    });
  }

  private clientMessageReady(id: string, type: string[], data: Partial<IClientMessagePaket>): void {
    if (!this.stats.server.webHandle.isAlive || !this.stats.server.webHandle.hasConnection) return;

    const client = this.clients.client[id];
    this.stats.updateLastUpdates("clients", "messagePayload");
    const chooseDataToSend = (type: string[], data: Partial<IClientMessagePaket>): Partial<IClientMessagePaket> => {
      const client = this.clients.client[id];

      const chatMessage = (data?: string) => { return { chatMessage: (data && data != "default" ? data : `Welcome ${wsclient.id} from ${wsclient.ip}`) } };
      const extras = () => { return { extras: { activeClients: this.stats.clients.activeClients, clientsCounter: this.stats.clients.clientsCounter } } };
      const serverMessage = (data?: any) => { return { serverMessage: (data && data != "default" ? data : "Welcome to the server") } };
      const pidInfo = () => { return { pidInfo: { ...this.stats.global.pu } } };
      const rconPlayers = () => { return { rconPlayers: { ...this.stats.global.rcon.players } } };
      const rconInfo = () => { return { rconInfo: { ...this.stats.global.rcon.info } } };
      const latencyGoogle = () => { return { latencyGoogle: this.stats.global.latencyGoogle } };
      const latencyUser = () => { return { latencyUser: client.stats.latency } };
      let newData: Partial<IClientMessagePaket> = {};
      type.forEach((singleType) => {
        switch (singleType) {
          case "serverMessage":
            Object.assign(newData, serverMessage(data.serverMessage));
            break;
          case "extras":
            Object.assign(newData, extras());
            break;
          case "pidInfo":
            Object.assign(newData, pidInfo());
            break;
          case "chatMessage":
            Object.assign(newData, chatMessage(data.chatMessage));
            break;
          case "rconPlayers":
            Object.assign(newData, rconPlayers());
            break;
          case "rconInfo":
            Object.assign(newData, rconInfo());
            break;
          case "latencyGoogle":
            Object.assign(newData, latencyGoogle());
            break;
          case "latencyUser":
            Object.assign(newData, latencyUser());
            break;
          default:
            Object.assign(newData, { "serverMessage": `undefined | id: ${id}` });
        }
      });
      return newData;
    }
    // const typeArray = Array.isArray(type) ? type : [type];
    // this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: 'No Client, message not sent', success: true });
    const wsclient = client.ws;
    if (!wsclient || wsclient.readyState !== WebSocket.OPEN) {
      this.handleClientUnsubscribe(id);
      throw new Error(`client id: ${id} | wsID: ${wsclient.id} not found or not open`);
    }

    const newType = type[0] == "ALL" ? ["serverMessage", "extras", "pidInfo", "chatMessage", "rconPlayers", "rconInfo", "latencyGoogle", "latencyUser"] : type;
    const newData = JSON.stringify({ "ip": wsclient.ip, "type": newType, "obj": { ...chooseDataToSend(newType, data) } });
    try {
      wsclient.send(newData, { binary: false });
      // const defaultEvent: IBaseEvent = {
      //   subType: SubEventTypes.BASIC.CLIENTS,
      //   message: `stats updated ${newData.length}`,
      //   success: true,
      // };
      // this.eV.emit(MainEventTypes.BASIC, defaultEvent);
      this.stats.clients.messageCounter++;
      this.stats.updateLastUpdates("clients", "messagePayload", true);

    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, `clientMessageReady`, MainEventTypes.CLIENTS, new Error(`clientMessageReady ${id} ${type[0]}`), { ...data, error: error });
    }
  }

  // this.sendMessagePacket(id, "pidInfo", this.stats.clients.pu);
  // this.sendMessagePacket(id, "latencyGoogle", this.stats.clients.latencyGoogle);
  // this.sendMessagePacket(id, "rconInfo", this.stats.clients.rcon.info);
  // this.sendMessagePacket(id, "rconPlayers", this.stats.clients.rcon.players);


  public async handleClientSubscribe(client: IClientsEvent): Promise<boolean> { // Adjust 'any' type later
    this.stats.updateLastUpdates("clients", "subscribe");

    try {
      const id = client.id;
      const ip = client.client.ip;
      const type = client.client.type;
      this.stats.clients.clientsCounter++;
      this.clients.createClient(id, ip, type, client.client);
      if (type != ClientType.Server) {
        if (++this.stats.clients.activeClients == 1) {
          this.stats.server.webHandle.hasConnection = true;
          this.sendMessageIntvalToggle('start');
        }
      }
      this.eV.emit(`${MainEventTypes.PROMISE}.${SubEventTypes.PROMISE.CLIENT_SUBSCRIBE}`, true);
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.CLIENTS,
        message: `Created client with id ${id}, type ${type}, ip ${ip}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.stats.updateLastUpdates("clients", "subscribe", true);
      return true;
    } catch (error) {
      this.eV.emit(`${MainEventTypes.PROMISE}.${SubEventTypes.PROMISE.CLIENT_SUBSCRIBE}`, false);
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleClientSubscribe", MainEventTypes.CLIENTS, new Error(`create client failed`), client);
      return false;
    }
  }

  public async handleClientUpdateStats(id: string): Promise<void> {
    const clientData = this.clients.client[id];
    // Your existing client update logic from `createTimer` will go here
    if (!clientData || clientData.ws.readyState !== WebSocket.OPEN)
      this.handleClientUnsubscribe(clientData.ws.id);

    const time_diff = Date.now() - clientData.stats.lastUpdates.statsUpdated;
    if (clientData.stats.lastUpdates.statsUpdated === 0 || time_diff > 20000) {
      // this.eV.emit(SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, client.info.id);
      clientData.stats.latency = await si.inetLatency(clientData.info.ip);
      clientData.stats.eventCount++;
      clientData.stats.lastUpdates['statsUpdated'] = Date.now();
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
    this.stats.updateLastUpdates("clients", "statsUpdated");
    this.stats.clients.lastUpdates.statsUpdated.last = Date.now();
    // this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `Update ALL clients stats, clientsCount: ${this.stats.clients.clientsCounter} | activeClients: ${this.stats.clients.activeClients}`, success: true });
    if (!this.stats.server.webHandle.hasConnection) return;
    Object.values(this.clients.client).forEach((client) => {
      this.handleClientUpdateStats(client.info.id);
    });
    this.stats.updateLastUpdates("clients", "statsUpdated", true);
  }


  public handleClientUnsubscribe(id: string): void {
    if (id == "ALL") return;
    this.stats.updateLastUpdates("clients", "unsubscribe");
    const client = this.clients.client[id];
    if (client) {
      this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `Unsubscribed client ${id}, ip: ${client.ws.ip}, type: ${client.ws.type}`, success: true });
      if (client.ws.type !== ClientType.Server) {
        // console.dir(this.clients.client[id].info, { depth: null, colors: true });
        // console.dir(this.clients.client[id].stats, { depth: null, colors: true });
        if (--this.stats.clients.activeClients == 0) {
          this.stats.server.webHandle.hasConnection = false;
          this.sendMessageIntvalToggle('stop');
        }
      }
      this.clients.removeClient(id);
      this.stats.updateLastUpdates("clients", "unsubscribe", true);
    } else {
      this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleClientUnsubscribe", MainEventTypes.CLIENTS, new Error(`client ${id} not found`));
    }
  }

  public removeClient(clientId: string): void {
    delete this.clients.client[clientId];
  }

  public getClient(clientId: string): clientWrapper | undefined {
    return this.clients.client[clientId];
  }

  private sendMessageIntvalToggle(action: string): void {
    switch (action) {
      case 'start':
        this.stats.updateLastUpdates('clients', 'sendMessageIntval', true);
        this.eV.emitOnce(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `sendMessageIntvalToggle | started, idle time: ${Date.now() - this.stats.clients.lastUpdates.sendMessageIntval.last} ms.`, success: true, });
        // console.log(`intervalStart: Interval started, idle time: ${this.intvalStats.idleEnd - this.intvalStats.idleStart}ms.`);
        this.sendMessageIntval = setInterval(() => {
          this.clientsMessageReady("ALL", ["extras", "pidInfo", "rconPlayers", "rconInfo", "latencyGoogle", "latencyUser"], {});
          // this.clients.handleClientsUpdateStats();
        }, 1000);
        break;
      case 'stop':
        this.stats.updateLastUpdates('clients', 'sendMessageIntval');
        // console.log("intervalStart: no action taken. clientsCounter:");
        clearInterval(this.sendMessageIntval);
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.CLIENTS, message: `sendMessageIntvalToggle | stopped.`, success: true, });
        break;
      default:
        this.eV.handleError(SubEventTypes.ERROR.WARNING, `sendMessageIntvalToggle`, MainEventTypes.CLIENTS, new Error(`Unknown status: ${this.stats.clients.lastUpdates.sendMessageIntval.success}`));
    }
  }


}


