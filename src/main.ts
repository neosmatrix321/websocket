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

const EventMixin = eM.SingletonEventManager.getInstance();

@injectable()
export default class Main {
  private eV: typeof EventMixin;
  private stats!: statsI.IStats;
  private server!: serverI.IHandleWrapper;
  private clients!: clientsI.IClientsWrapper['clients'];
  private settings!: settingsI.ISettings;

  public constructor(
    @inject(statsI.STATS_WRAPPER_TOKEN) statsInstance: statsI.IStats,
    @inject(serverI.SERVER_WRAPPER_TOKEN) serverInstance: serverI.IHandleWrapper,
    @inject(clientsI.CLIENTS_WRAPPER_TOKEN) clientsInstance: clientsI.IClientsWrapper['clients'],
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
    // this.eV.on('createTimer', () => {
    //   this.startTimer();
    // });  
  }

  public async initialize() {
    console.log(this);
    try {
      await this.serverService.createServer();
      this.setupGlobalEventListeners();
    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private setupGlobalEventListeners() {
    // Event handling for client connections, messages, errors
    this.server._handle.web.on('clientConnected', this.handleConnection.bind(this));
    this.server._handle.web.on('close', this.handleClose.bind(this));
    this.server._handle.web.on('message', this.handleMessage.bind(this));
    this.server._handle.web.on('error', console.error);
    // this.main._server.on('message', this.handleMessage.bind(this)); // Assuming ServerWrapper emits 'message'
    // this.main._server.on('close', this.handleClose.bind(this));
  }

  public startIntervalIfNeeded() {
    if (this.stats.clientsCounter > 0 && !this.stats.interval_sendinfo) {
      this.stats.interval_sendinfo = setInterval(() => {
        this.gatherAndSendStats();
        this.clientsService.updateClientsStats();
      }, 5000);
    }
  }
  // public startTimer() {
  //   this.startIntervalIfNeeded();
  //   setInterval(() => {
  //     this.eV.emit('createTimer');
  
  //       updateStats();
  //       updateClients();
  //   }, 20000); // Adjust interval as needed
  // }
// Event listener to start the timer (from EventManager)

  private async gatherAndSendStats() {
    await this.statsService.updateAllStats();

    Object.values(this.clients).forEach((client: any) => {
      if (client.readyState === client.OPEN) {
        // . detailed logic to build and send the stats payload.
        client.send('client aagdssdaf');
      }
    });
  }

  private async updateStats() {
    await this.statsService.updateAllStats();
    this.eV.emit('statsUpdated', { message: 'stats updated' });
  }
  private async handleClose(ws: any, code: any) {
    console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
    await this.clientsService.removeClient(ws.id); // Assuming you have removeClient
    this.serverService.destroyClient(ws.id); // If applicable
    ws.terminate();
    this.startIntervalIfNeeded();
  }

  private async handleConnection(ws: serverI.MyWebSocket) {
    this.handleGreeting(ws); // Integrate with your client management 
    this.setupWebSocketEvents(ws);

  }

  private async setupWebSocketEvents(ws: serverI.MyWebSocket) {
    ws.on('close', this.handleClose.bind(this, ws));
    ws.on('message', this.handleMessage.bind(this, ws));
    ws.on('greeting', this.handleGreeting.bind(this, ws));
    this.startIntervalIfNeeded();
    WebSocket.OPEN;
  }

  private async handleGreeting(client: serverI.MyWebSocket) {
    let newIP: string = '';
  if ('_socket' in client) {
    newIP = (client as any)._socket.remoteAddress;
  }
    const type = 'basic'
    if (!this.serverService.isMyWebSocketWithId(client)) {
      this.stats.clientsCounter++;
      const newID = this.stats.clientsCounter;
      const type = 'basic'
      this.clientsService.addClient(`${newID}`, newIP, type, client);
    }
    if (this.serverService.isMyWebSocketWithId(client)) {
      const createdClient = this.clients[client.id];
      if (createdClient) {
        // createdClient.info.type = ; // Update isAdmin
        await this.clientsService.updateClientStats(createdClient);
      }
    } else {
      console.error("Could not create Client " + newIP)
    }
  }

  private async handleMessage(ws: any, data: any, isBinary: any) {
    console.log('dummy');
  }

  // private async handleWebSocketMessage(ws: any, data: any, isBinary: any) {
  //   const decodedData = Buffer.from(data, 'base64').toString();
  //   const messageObject = JSON.parse(decodedData);

  //   if (messageObject.type) {
  //     switch (messageObject.type) {
  //       case 'greeting':
  //         this.handleGreeting(ws, messageObject);
  //         break;
  //       // Add other cases for message types 
  //       default:
  //         console.log("Unknown message type");
  //     }
  //   }
  // }


}

// Instantiate the main object to start your application
