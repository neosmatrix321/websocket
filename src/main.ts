"use strict";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { ISettings, PRIVATE_SETTINGS_TOKEN } from "./settings/settingsInstance.js";
import { WebSocket } from 'ws'
import { Server } from "https";
import * as eM from "./global/EventHandlingManager";
import * as eH from "./global/EventHandlingMixin";
import * as statsC from "./stats/stats";
import * as statsI from "./stats/statsInstance";

export enum MainType {
  timerCreated,
  timerStarted,
  timerStopped
}

export interface IMainEvent extends eH.IBaseEvent {
  type: MainType;
  message: string;
  data: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}


class BaseMainEvent implements eH.IBaseEvent {
  "cat": eH.catType = eH.catType.main;
}


@injectable()
export default class Main extends eH.EventEmitterMixin<statsC.IStatsEvent>(BaseMainEvent) {
  @inject(statsC.GLOBAL_STATS_TOKEN) stats!: statsI.IStats;
  @inject(PRIVATE_SETTINGS_TOKEN) _settings!: ISettings;
  @inject(eM.EVENT_MANAGER_TOKEN) eM!: eM.eventManager;
  public constructor() {
    super();
    this.initialize();
  }
  public async initialize() {
    console.log(this);
    try {
      await Server.createServer();

    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private async handleConnection(ws: any) {
    this.stats.clientsCounter++;
    // const client1 = new Client({ /* Client Data */ });

    // // Add clients to the container
    // clientsContainer.addClient(client1);
    this.handleGreeting(ws, 'greeting'); // Integrate with your client management 
    this.setupWebSocketEvents(ws);
    this.startIntervalIfNeeded();
  }
  private async handleWebSocketMessage(ws: any, data: any, isBinary: any) {
    const decodedData = Buffer.from(data, 'base64').toString();
    const messageObject = JSON.parse(decodedData);

    if (messageObject.type) {
      switch (messageObject.type) {
        case 'greeting':
          this.handleGreeting(ws, messageObject);
          break;
        // Add other cases for message types 
        default:
          console.log("Unknown message type");
      }
    }
  }
  private async handleGreeting(client: WebSocket, obj: any) {
    const newIP = client.socket.remoteAddress;
    const type = 'basic'
    if (!isMyWebSocketWithId(client)) {
      this.stats.clientsCounter++;
      const newIP = client.socket.remoteAddress;
      const newID = this.stats.clientsCounter;
      const type = 'basic'
      this._clients.addClient(newIP, newID, type);
    }
    if (isMyWebSocketWithId(client)) {
      const ID = client.id;
      // this._clients[client.info.id]._config.type = ClientType.Admin; // Update isAdmin
      await this._clients.updateClientStats(this._clients[ID]);
    } else {
      console.error("Could not create Client " + newIP)
    }
  }

  private async handleMessage(ws: any, data: any, isBinary: any) {
    console.log('dummy');
  }

  private async handleClose(ws: any, code: any) {
    console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
    await this._clients.removeClient(ws.id); // Assuming you have removeClient
    this._server._handle.web.destroyClient(ws.ip); // If applicable
    ws.terminate();
    this.startIntervalIfNeeded();
  }

  private startIntervalIfNeeded() {
    if (this.stats.clientsCounter > 0 && !this.stats.interval_sendinfo) {
      this.stats.interval_sendinfo = setInterval(() => {
        this.gatherAndSendStats();
      }, 1000);
    }
  }

  private async gatherAndSendStats() {
    const updatedStats = await this._systemMonitor.getUpdatedStats();
    this.updateGlobalStats(updatedStats);

    this._clients.forEach((client: any) => {
      if (client.readyState === client.OPEN) {
        // . detailed logic to build and send the stats payload.
        client.send('client aagdssdaf');
      }
    });
  }
}

// Instantiate the main object to start your application
