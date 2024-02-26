"use strict";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./global/globalEventHandling.js";
import { IStats } from "./stats/statsInstance.js";
import { IHandleWrapper } from "./server/serverInstance.js";
import { ISettings } from "./settings/settingsInstance.js";
import { IClientsService } from "./clients/clientsInstance.js";

const GLOBAL_STATS_TOKEN = Symbol('GlobalStats');
const SERVER_WRAPPER_TOKEN = Symbol('ServerWrapper');
const PRIVATE_SETTINGS_TOKEN = Symbol('PrivateSettings');
const CLIENTS_WRAPPER_TOKEN = Symbol('ClientsWrapper');
export const MAIN_SERVICE_TOKEN = Symbol('Main');


class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();

@injectable()
export default class Main extends EventEmitterMixin(MyClass) {
  @inject(GLOBAL_STATS_TOKEN) stats!: IStats;
  @inject(SERVER_WRAPPER_TOKEN) _server!: IHandleWrapper;
  @inject(PRIVATE_SETTINGS_TOKEN) _settings!: ISettings;
  @inject(CLIENTS_WRAPPER_TOKEN) _clients!: IClientsService;
    public constructor() {
    super();
    this.initialize();
  }

  public async initialize() {
    console.log(this);
    try {
      await this._server.create();
      this._server.on('connection', this.handleConnection.bind(this));
      this.setupGlobalEventListeners();
      this.gatherAndSendStats();

    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private setupGlobalEventListeners() {
    // Event handling for client connections, messages, errors
    globalEventEmitter.on('clientConnected', this.handleConnection.bind(this));
    globalEventEmitter.on('close', this.handleClose.bind(this));
    globalEventEmitter.on('message', this.handleMessage.bind(this));
    globalEventEmitter.on('error', console.error);
    // this.main._server.on('message', this.handleMessage.bind(this)); // Assuming ServerWrapper emits 'message'
    // this.main._server.on('close', this.handleClose.bind(this));
  }

  private async handleConnection(ws: any) {
    this.stats.clientsCounter++;
    // const client1 = new Client({ /* Client Data */ });

    // // Add clients to the container
    // clientsContainer.addClient(client1);
    await this._clients.addClient(ws); // Integrate with your client management 
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
  private async setupWebSocketEvents(ws: any) {
    ws.on('close', this.handleClose.bind(this, ws));
    ws.on('message', this.handleMessage.bind(this, ws));
    ws.on('greeting', this.handleGreeting.bind(this, ws));
    this.startIntervalIfNeeded();
  }

  private async handleGreeting(client: IClient, obj: any) {
    this._clients[client.info.id].isAdmin = !!obj.admin; // Update isAdmin
    await this._clients.updateClientStats(this._clients[client.info.id]);
  }

  private async handleMessage(ws: any, data: any, isBinary: any) {
    console.log('dummy');
  }

  private async handleClose(ws: any, code: any) {
    console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.main.stats.clientsCounter + ")");
    await this.main._clients.removeClient(ws.id); // Assuming you have removeClient
    this.main._server._handle.web.destroyClient(ws.ip); // If applicable
    ws.terminate();
    this.clearIntervalIfNeeded();
  }

  private startIntervalIfNeeded() {
    if (this.main.stats.clientsCounter > 0 && !this.main.stats._interval_sendInfo) {
      this.main.stats._interval_sendInfo = setInterval(() => {
        this.gatherAndSendStats();
      }, 1000);
    }
  }

  private clearIntervalIfNeeded() {
    if (this.main.stats._interval_sendInfo) {
      clearInterval(this.main.stats._interval_sendInfo);
      this.main.stats._interval_sendInfo = undefined;
    }
  }

  private async gatherAndSendStats() {
    const updatedStats = await this.main._systemMonitor.getUpdatedStats();
    this.main.updateGlobalStats(updatedStats);

    this.main._clients.forEach((client: any) => {
      if (client.readyState === client.OPEN) {
        // ... detailed logic to build and send the stats payload...
        client.send('client aagdssdaf');
      }
    });
  }
}

// Instantiate the main object to start your application
