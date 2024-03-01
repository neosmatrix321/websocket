import { IncomingMessage } from "http";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { WebSocketServer } from "ws";
// import * as statsC from "../stats/stats";
import * as statsI from "../stats/statsInstance";
// import * as clientsC from "../clients/clients";
// import * as serverC from "../server/server";
// import * as clientsC from "../clients/clients";
import * as eH from "./EventHandlingMixin";

export const EVENT_MANAGER_TOKEN = Symbol('eventManager');

@injectable()
export default class eventManager {
  private webServer: WebSocketServer;
  private evMan: typeof eH.EventEmitterMixin;
  public constructor(
    @inject(eH.EVENT_HANDLER_TOKEN) {
      eventManagerInstance,
    }: {
      evMan: eventManager;
    },
    @inject(EVENT_MANAGER_TOKEN) {
      webServerInstance
    }: {
      webServerInstance: WebSocketServer
    }
  ) {
    this.evMan = eventManagerInstance || eH.EventEmitterMixin(eH.EmptyClass);
    this.webServer = webServerInstance || new WebSocketServer({ noServer: true });
    this.setupEventListeners();
    this.storeEvent(eM.DefaultIEvent);
    this.on("eH.MAIN", (event: eH.IEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      // Access properties safely (assuming your IStatsEvent interface is correct)
      switch (event.type) {
        case eH.STATS.PID_AVAILABLE:
          this.handleStatsUpdate(event);
          break;
        case eH.STATS.UPDATED: // Or any other relevant type that might be emitted
          this.handleStatsUpdated(event);
          break;        // ... other 'stats' event types
      }
    });

    // Client Event Handlers
    this.on('type', (event: IEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case eH.CLIENTS.CREATE:
          break;
        case eH.CLIENTS.MODIFY:
          this.clientSettingsUpdated(event);
          break;
        case eH.CLIENTS.DELETE:
          this.clientBye(event);
          break;
        case eH.CLIENTS.STATS_UPDATED:
          this.clientMessageReady(event);
          break;
        // ... other 'client' event types
      }
    });
    this.on('serverEvent', (event: IEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event.type) {
        case eH.SERVER.LISTEN:
          this.serverActive(event);
          break;
        case eH.SERVER.CLIENT_CONNECTED:
          this.handleClientConnected(event);
          break;
        case eH.SERVER.CLIENT_MESSAGE_READY:
          this.handleClientMessage(event);
          break;
        case eH.SERVER.CLIENT_DISCONNECTED:
          this.clientBye(event);
          this.handleClientConnected(event);
          break;
        // ... other 'client' event types
      }
    });
    this.on('BASIC', (event: IEvent) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      switch (event[eH.MAIN.BASIC]) {
        case eH.MAIN.BASIC:
          this.handleTimerCreated(event);
          break;
        case eH.MAIN.BASIC:
          this.handleTimerStarted(event);
          break;
        case eH.MAIN.BASIC:
          this.handleLatencyStopped(event);
          break;
        // ... other 'client' event types
      }
    });
    // this.on('clientConnected', this.handleClientConnected.bind(this));
    // this.on('clientDisconnected', this.handleClientDisconnected.bind(this));
  }
  handleLatencyStopped(event: any) {
    throw new Error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    throw new Error("Method not implemented.");
  }

  private setupWebSocketListeners() {
    this.webServer.on('connection', (ws: WebSocket, request: IncomingMessage): void => {
      this.eventManager.emit(eH.SERVER.CLIENT_CONNECTED, ws);
    });
  }
  private clientSettingsUpdated(event: IEvent): void {
    // implement this method
  }

  private clientBye(event: IEvent): void {
    // implement this method
  }
  // ... other event listeners for 'close', 'message', etc.

  private serverActive(event: IEvent): void {
    // implement this method
  }

  private gatherAndSendStats(): void {
    // implement this method
  }
  private handleStatsUpdate(event: IEvent): void {
    if (event.data.errCode === 0) {
      this.on(eH.STATS.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
      console.log('Latency:', event.data.blob);
    } else {
      this.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }

  private handleClientstats(event: IEvent) {
    console.log('Client Latency Exceeded:', event.data);
    // ... React to client latency (e.g., send warning, log data)
  }

  private handleTimerStarted(event: statsI.IStatsEvent): void {
    if (event.data && event.data.errCode === 0) {
      this.gatherAndSendStats.bind(this)
      console.log('Latency:', event.data.blob);
    } else {
      this.handleError(new Error(event.data.message)); // Or a custom error type
    }
  }

  public handleClientConnected(_ws: WebSocket): void {
    const event: IEvent = {
      cat: eH.SERVER.LISTEN,
      type: eH.SERVER.CLIENT_CONNECTED, // or another appropriate type
      message: 'Client connected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.emit(eH.SERVER.LISTEN, event);
  }

  public handleClientMessage(_ws: WebSocket): void {
    const event: IEvent = {
      cat: eH.SERVER.LISTEN,
      type: eH.SERVER.CLIENT_MESSAGE, // or another appropriate type
      message: 'Client connected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.emit(eH.SERVER.LISTEN, event);
  }

  public handleClientDisconnected(ws: WebSocket): void {
    const event: IEvent = {
      cat: eH.SERVER.LISTEN,
      type: eH.SERVER.CLIENT_DISCONNECTED, // or another appropriate type
      message: 'Client disconnected',
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.handleError(new Error(event.data.message)); // Or a custom error type
  }

  private handleStatsUpdated(event: statsI.IStatsEvent): void { // Assuming IStats exists
    try {
      this.clientMessageReady(event);
    } catch (error) {
      this.handleError(new Error('statsUpdated'), error); // Or a custom error type
    }
  }
  clientMessageReady(event: statsI.IStatsEvent) {
    throw new Error("Method not implemented.");
  }
  public emitError(error: any): void {
    const event: IEvent = {
      cat: eH.EVENT.ERROR,
      type: eH.EVENT.ERROR, // Or other relevant type
      message: 'An error occurred',
      data: {
        errCode: -1, // Replace with suitable error code if you have them
        message: error.message,
        blob: error // Include the entire error object for analysis
      }
    };

    this.emit(eH.EVENT.ERROR, event);
  }

  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.emitError(errorData); // Emit the error for wider handling
  }
}

/* 
https://github.com/neosmatrix321/websocket/tree/master
*/