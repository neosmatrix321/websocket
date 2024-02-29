import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { Server } from "https";
import { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import * as eH from "./EventHandlingMixin";
// import * as eM from "../global/EventHandlingManager";
import * as statsC from "../stats/stats";
// import * as statsI from "../stats/statsInstance";
import * as clientsC from "../clients/clients";
// import * as clientsI from "../clients/clientInstance";
import * as serverC from "../server/server";
// import * as serverI from "../server/serverInstance";
import * as mainC from "../main";

// ... your other imports 
export const EVENT_MANAGER_TOKEN = Symbol('eventManager');

export enum eMType {
  started,
  stopped,
  error
}

export interface IeMEvent extends eH.IEventMap {
  cat: eH.catType;
  type?: eMType | statsC.statsType | clientsC.clientsType | serverC.serverType | mainC.MainType;
  message?: string;
  data?: {
    errCode: number;
    message?: any;
    blob?: any;
  };
}

// class BaseEMEvent implements eH.IBaseEvent {
//   "cat": eH.catType = eH.catType.eventManager;
// }
class BaseEventManager implements eH.IEventMap {
  "cat": eH.catType = eH.catType.eventManager;
}

@injectable()
export class eventManager extends EventEmitterMixin<IeMEvent>(BaseEventManager) {
  @inject(EVENT_MANAGER_TOKEN) private eM!: eventManager;
  public webServer: WebSocketServer;
  constructor() {
    super();
    this.webServer = new WebSocketServer({ noServer: true });
    this.eM.setupWebSocketListeners();
    // Register event listeners
    // Stats Event Handlers
    this.eM.on(eH.catType.stats, (event: any) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case statsC.statsType.update:
          this.handleStatsUpdate(event as statsC.IStatsEvent);
          break;
        case statsC.statsType.updated:
          this.handleStatsUpdated(event as statsC.IStatsEvent);
          break;
        // ... other 'stats' event types
      }
    });

    // Client Event Handlers
    this.eM.on(eH.catType.clients, (event: any) => {
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
    this.eM.on(eH.catType.server, (event: any) => {
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
    this.eM.on(eH.catType.main, (event: any) => {
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
  handleLatencyStopped(event: any) {
    throw new Error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    throw new Error("Method not implemented.");
  }

  private setupWebSocketListeners() {
    this.webServer.on('connection', (ws: WebSocket, request: IncomingMessage): void => {
      this.emit('clientConnected', ws);
    });

    // ... other event listeners for 'close', 'message', etc.
  }

  private handleStatsUpdate(event: statsC.IStatsEvent | IeMEvent): void {
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

  private handleTimerStarted(event: statsC.IStatsEvent): void {
    if (event.data && event.data.errCode === 0) {
      this.eM.gatherAndSendStats.bind(this)
      console.log('Latency:', event.data.blob);
    } else {
      this.eM.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }

  public handleClientConnected(_ws: WebSocket): void {
    const event: IeMEvent = {
      cat: eH.catType.server,
      type: serverC.serverType.clientConnected, // or another appropriate type
      message: 'Client connected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.eM.emit(eH.catType.server, event);
  }

  public handleClientMessage(_ws: WebSocket): void {
    const event: IeMEvent = {
      cat: eH.catType.server,
      type: serverC.serverType.clientMessage, // or another appropriate type
      message: 'Client connected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.eM.emit(eH.catType.server, event);
  }

  public handleClientDisconnected(ws: WebSocket): void {
    const event: IeMEvent = {
      cat: eH.catType.server,
      type: serverC.serverType.clientDisconcted, // or another appropriate type
      message: 'Client disconnected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.handleError(new Error(event.data.message)); // Or a custom error type
  }

  private handleStatsUpdated(event: statsC.IStatsEvent): void { // Assuming IStats exists
    try {
      this.clientMessageReady(event);
    } catch (error) {
      this.handleError(new Error('statsUpdated'), error); // Or a custom error type
    }
  }
  clientMessageReady(event: statsC.IStatsEvent) {
    throw new Error("Method not implemented.");
  }
  public emitError(error: any): void {
    const event: IeMEvent = {
      cat: eH.catType.eventManager,
      type: eMType.error, // Or other relevant type
      message: 'An error occurred',
      data: {
        errCode: -1, // Replace with suitable error code if you have them
        message: error.message,
        blob: error // Include the entire error object for analysis
      }
    };

    this.emit(eH.catType.eventManager, event);
  }

  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.eM.emitError(errorData); // Emit the error for wider handling
  }
}

/* https://github.com/neosmatrix321/websocket/tree/master
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { WebSocketServer } from "ws";
import * as sI from "../stats/statsInstance";
import * as statsC from "../stats/stats";
import * as cI from "../clients/clientInstance";
import * as clientsMain from "../clients/clients";
import { IncomingMessage } from 'http';

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

  private handleStatsEvent(event: statsC.IStatsEvent) {
    switch (event.type) {
      case statsC.statsType.updated:
        this.handleStatsUpdated(event);
        break;
      case statsC.statsType.latencyUpdated:
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