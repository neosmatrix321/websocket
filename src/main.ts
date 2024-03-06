"use strict";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { WebSocket } from 'ws'
import { Server as httpsServer } from "http";
import * as eM from "./global/EventHandlingManager";
import * as eH from "./global/EventHandlingMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import * as statsI from "./stats/statsInstance";
import * as serverI from "./server/serverInstance";
import * as clientsI from "./clients/clientInstance";
import * as settingsI from "./settings/settingsInstance";
import Stats from "./stats/stats";
import Server from "./server/server";
import Clients from "./clients/clients";



const EventMixin = eH.SingletonEventManager.getInstance();

@injectable()
export class Main {
  private eV: typeof EventMixin;
  private stats!: statsI.IStats;
  private server!: serverI.IHandleWrapper;
  private clients!: clientsI.IClientsWrapper;
  private settings!: settingsI.ISettings;

  public constructor(
    @inject(statsI.STATS_WRAPPER_TOKEN) statsInstance: statsI.IStats,
    @inject(serverI.SERVER_WRAPPER_TOKEN) serverInstance: serverI.IHandleWrapper,
    @inject(clientsI.CLIENTS_WRAPPER_TOKEN) clientsInstance: clientsI.IClientsWrapper,
    @inject(settingsI.PRIVATE_SETTINGS_TOKEN) settingsInstance: settingsI.ISettings,
    @inject(Stats) private statsService: Stats,
    @inject(Server) private serverService: Server,
    @inject(Clients) private clientsService: Clients
  ) {
    this.eV = EventMixin;
    this.stats = statsInstance;
    this.server = serverInstance;
    this.clients = clientsInstance;
    this.settings = settingsInstance;
    this.initialize();
  }

  static startIntervalIfNeeded() {
    throw new Error("Method not implemented.");
  }

  private async gatherAndSendStats() {
    await this.statsService.updateAllStats(updatedStats);

    this.clients.forEach((client: any) => {
      if (client.readyState === client.OPEN) {
        // . detailed logic to build and send the stats payload.
        client.send('client aagdssdaf');
      }
    });
  }

  private async updateStats() {
    await this.stats.updateAllStats();
    this.eV.emit('statsUpdated', this.stats.stats);
  }
  private async handleClose(ws: any, code: any) {
    console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
    await this.clients.removeClient(ws.id); // Assuming you have removeClient
    this.server._handle.web.destroyClient(ws.ip); // If applicable
    ws.terminate();
    this.startIntervalIfNeeded();
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

  private async handleGreeting(client: WebSocket, obj: any) {
    const newIP = client.socket.remoteAddress;
    const type = 'basic'
    if (!isMyWebSocketWithId(client)) {
      this.stats.clientsCounter++;
      const newIP = client.socket.remoteAddress;
      const newID = this.stats.clientsCounter;
      const type = 'basic'
      this.clients.addClient(newIP, newID, type);
    }
    if (isMyWebSocketWithId(client)) {
      const ID = client.id;
      // this.clients[client.info.id]._config.type = ClientType.Admin; // Update isAdmin
      await this.clients.updateClientStats(this.clients[ID]);
    } else {
      console.error("Could not create Client " + newIP)
    }
  }

  private async handleMessage(ws: any, data: any, isBinary: any) {
    console.log('dummy');
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

  public startIntervalIfNeeded() {
    if (this.stats.clientsCounter > 0 && !this.stats.interval_sendinfo) {
      this.stats.interval_sendinfo = setInterval(() => {
        this.gatherAndSendStats();
      }, 1000);
    }
  }

  public async initialize() {
    console.log(this);
    try {
      await Server.createServer();

    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }
}

// Instantiate the main object to start your application
