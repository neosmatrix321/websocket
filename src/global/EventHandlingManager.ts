import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { Server } from "https";
import { WebSocketServer } from "ws";
import * as eH from "./EventHandlingMixin";
import * as statsC from "../stats/stats";
import * as statsI from "../stats/statsInstance";
import * as clientsC from "../clients/clients";
import * as clientsI from "../clients/clientInstance";
import * as serverC from "../server/server";
import * as serverI from "../server/serverInstance";
import * as mainC from "../main";

// ... your other imports 
export const EVENT_MANAGER_TOKEN = Symbol('eventManager');

export enum eMType {
  started,
  stopped,
  error
}

export interface IeMEvent extends eH.IBaseEvent {
  type: eMType;
  message: string;
  data: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}

// class BaseEMEvent implements eH.IBaseEvent {
//   "cat": eH.catType = eH.catType.eventManager;
// }
class MyClass {}

@injectable()
export class eventManager extends EventEmitterMixin(MyClass) {
  @inject(EVENT_MANAGER_TOKEN) private eM!: eventManager;
  public webServer: WebSocketServer;
  constructor() {
    super();
    this.webServer = new WebSocketServer({ noServer: true });
    this.eM.setupWebSocketListeners();
    // Register event listeners
    // Stats Event Handlers
    this.eM.on(eH.catType.stats, (event: statsC.IStatsEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event) {
        case statsC.statsType.update:
          this.handleStatsUpdate(event as statsC.IStatsEvent);
          break;
        case statsC.statsType.updated:
          this.handleStatsUpdate(event as statsC.IStatsEvent);
          break;
        // ... other 'stats' event types
      }
    });

    // Client Event Handlers
    this.eM.on(eH.catType.clients, (event: clientsC.IClientsEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case clientsC.clientsType.create:
          break;
        case clientsC.clientsType.update:
          this.clientSettingsUpdated(event);
          break;
        case clientsC.clientsType.delete:
          this.clientBye(event);
          break;
        case clientsC.clientsType.statsUpdated:
          this.clientMessageReady(event);
          break;
        // ... other 'client' event types
      }
    });
    this.eM.on(eH.catType.server, (event: serverC.IServerEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case serverC.serverType.listen:
          this.serverActive(event);
          break;
        case serverC.serverType.clientConnected:
          this.handleClientConnected(event);
          break;
        case serverC.serverType.clientMessageReady:
          this.handleClientMessage(event);
          break;
        case serverC.serverType.clientDisconcted:
          this.clientBye(event);
          this.handleClientConnected(event);
          break;
        // ... other 'client' event types
      }
    });
    this.eM.on(eH.catType.main, (event: mainC.IMainEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case mainC.MainType.timerCreated:
          this.handleTimerCreated(event);
          break;
        case mainC.MainType.timerStarted:
          this.handleTimerStarted(event);
          break;
        case mainC.MainType.timerStopped:
          this.handleLatencyStopped(event);
          break;
        // ... other 'client' event types
      }
    });
    // this.eM.on('clientConnected', this.handleClientConnected.bind(this));
    // this.eM.on('clientDisconnected', this.handleClientDisconnected.bind(this));

    // Process the updated stats object (this.stats)

  }

  private setupWebSocketListeners() {
    this.webServer.on('connection', (ws: WebSocket, request: IncomingMessage): void => {
      this.emit('clientConnected', ws);
    });

    // ... other event listeners for 'close', 'message', etc.
  }

  private handleStatsUpdate(event: statsMain.IStatsEvent | IeMEvent): void {
    if (event.data.errCode === 0) {
      this.eM.on('statsUpdated', this.handleStatsUpdated.bind(this));
      console.log('Latency:', event.data.blob);
    } else {
      this.eM.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }

  private handleClientstats(event: IeMEvent) {
    console.log('Client Latency Exceeded:', event.data);
    // ... React to client latency (e.g., send warning, log data)
  }

  private handleTimerStarted(event: statsMain.IStatsEvent): void {
    if (event.data && event.data.errCode === 0) {
      this.eM.gatherAndSendStats.bind(this)
      console.log('Latency:', event.data.blob);
    } else {
      this.eM.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }

  private handleStatsUpdate(event: statsMain.IStatsEvent | IeMEvent): void {
    if (event.data.errCode === 0) {
    } else {
      this.handleError(new Error(event.data?.message)); // Or a custom error type
    }

  }
  private handleClientConnected(ws: WebSocket): void {
      this.handleError(new Error(event.data.message)); // Or a custom error type

  }

  private handleClientDisconnected(ws: WebSocket): void {
      this.handleError(new Error(event.data.message)); // Or a custom error type
  }

  private handleStatsUpdated(event: statsMain.IStatsEvent): void { // Assuming IStats exists
    if (event.data.errCode === 0) {
      this.clientMessageReady(event);
    } else {
      this.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }
  public emitError(error: any, errorEventName: string = 'error'): void {
    const event: IeMEvent = {
      type: eMType.error, // Or other relevant type
      message: 'An error occurred',
      data: {
        errCode: -1, // Replace with suitable error code if you have them
        message: error.message,
        blob: error // Include the entire error object for analysis
      }
    };

    this.emit(errorEventName, event);
  }

  public handleError(error: any): void {
    console.error('Error from eventManager:', error);
    this.eM.emitError(error); // Emit the error for wider handling
  }
}

/* https://github.com/neosmatrix321/websocket/tree/master
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { WebSocketServer } from "ws";
import * as sI from "../stats/statsInstance";
import * as statsMain from "../stats/stats";
import * as cI from "../clients/clientInstance";
import * as clientsMain from "../clients/clients";

// ... other imports 

@injectable()
export class eventManager extends EventEmitterMixin<IeMEvent>(BaseEMEvent) {
  // ... properties

  constructor() {
    super();
    this.webServer = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
    this.registerEventHandlers(); 
  }

  private registerEventHandlers() {
    this.on('stats', this.handleStatsEvent); 
    this.on('client', this.handleClientEvent);

    // Consider registering server handlers separately if needed:
    // this.on('server', this.handleServerEvent); 
  }

  private handleStatsEvent(event: statsMain.IStatsEvent) {
    switch (event.type) {
      case statsMain.statsType.updated:
        this.handleStatsUpdated(event);
        break;
      case statsMain.statsType.latencyUpdated:
        this.handleLatencyUpdated(event);
        break;
      // ... other stats cases
      default: 
        console.warn('Unhandled stats event type:', event.type);
    }
  }

  private handleClientEvent(event: clientsMain.IClientEvent) {
    // ... similar structure as handleStatsEvent
  }

  // ... other handlers and helper functions */