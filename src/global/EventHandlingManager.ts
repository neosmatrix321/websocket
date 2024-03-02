import { IncomingMessage } from "http";
import { inject, injectable, interfaces } from "inversify";
import "reflect-metadata";
import { WebSocketServer } from "ws";
// import * as statsC from "../stats/stats";
import * as statsI from "../stats/statsInstance";
// import * as clientsC from "../clients/clients";
// import * as serverC from "../server/server";
// import * as clientsC from "../clients/clients";
import * as eH from "./EventHandlingMixin";

export const EVENT_MANAGER_TOKEN = Symbol('eventManager');


class BaseClass {

}
@injectable()
export class eventManager extends eH.EventEmitterMixin<eH.IEventRoot<eH.IEvent>>(BaseClass) {
  private webServer: WebSocketServer;
  public constructor(
    @inject(EVENT_MANAGER_TOKEN) webServer: WebSocketServer
  ) {
    super();
    this.webServer = webServer || new WebSocketServer({ noServer: true });
    // this.setupEventListeners();
    this.setupEventHandlers();
    this.emit(eH.EventTypes.STATS, new eH.EventClass(eH.FirstIEvent));
  }
  private setupEventHandlers() {

    // Client Event Handlers
    this.on(eH.EventTypes.STATS, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      // Access properties safely (assuming your IStatsEvent interface is correct)
      if (event[eH.EventTypes.STATS]) {
        switch (event[eH.EventTypes.STATS].type) {
          case eH.SubEventTypes.UPDATE_ALL_STATS:
            this.handleStatsUpdate(event);
            break;
          case eH.SubEventTypes.ALL_STATS_UPDATED: // Or any other relevant type that might be emitted
            this.handleStatsUpdated(event);
            break;        // ... other 'stats' event types
        }
      }
    });
    this.on(eH.EventTypes.CLIENTS, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.EventTypes.CLIENTS]) {
        switch (event[eH.EventTypes.CLIENTS].type) {
          case eH.SubEventTypes.CREATE:
            break;
          case eH.SubEventTypes.MODIFY:
            this.clientSettingsUpdated(event);
            break;
          case eH.SubEventTypes.DELETE:
            this.clientBye(event);
            break;
          case eH.SubEventTypes.ALL_STATS_UPDATED:
            this.clientMessageReady(event);
            break;
          // ... other 'client' event types
        }
      }
    });
    // rest of the class

    this.on(eH.EventTypes.SERVER, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.EventTypes.SERVER]) {
        switch (event[eH.EventTypes.SERVER].type) {
          case eH.SubEventTypes.LISTEN:
            this.serverActive(event);
            break;
          case eH.SubEventTypes.CLIENT_CONNECTED:
            this.handleClientConnected(event);
            break;
          case eH.SubEventTypes.CLIENT_MESSAGE_READY:
            this.handleClientMessage(event);
            break;
          case eH.SubEventTypes.CLIENT_DISCONNECTED:
            this.clientBye(event);
            this.handleClientConnected(event);
            break;
          // ... other 'client' event types
        }
      }
    });
    this.on(eH.EventTypes.MAIN, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.EventTypes.MAIN]) {
        switch (event[eH.EventTypes.MAIN].type) {
          case eH.SubEventTypes.START_TIMER:
            this.handleStartTimer(event);
            break;
          case eH.SubEventTypes.TIMER_CREATED:
            this.handleTimerCreated(event);
            break;
          case eH.SubEventTypes.TIMER_STARTED:
            this.handleTimerStarted(event);
            break;
          case eH.SubEventTypes.TIMER_STOPPED:
            this.handleLatencyStopped(event);
            break;
          // ... other 'client' event types
        }
      }
    });
  }

  private handleStatsUpdate(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private handleStartTimer(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private clientSettingsUpdated(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private clientBye(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private serverActive(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private handleTimerStarted(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  public handleClientConnected(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  public handleClientMessage(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  public handleClientDisconnected(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  private handleStatsUpdated(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }

  public clientMessageReady(event: eH.IEventRoot<eH.IEvent>): void {
    throw new Error("Method not implemented.");
  }
  // this.on('clientConnected', this.handleClientConnected.bind(this));
  // this.on('clientDisconnected', this.handleClientDisconnected.bind(this));

  handleLatencyStopped(event: any) {
    throw new Error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    throw new Error("Method not implemented.");
  }

  // private setupWebSocketListeners() {
  //   this.webServer.on(eH.SubEventTypes.connection, (ws: WebSocket, request: IncomingMessage): void => {
  //     this.emit(eH.SubEventTypes.CLIENT_CONNECTED, { ...ws });
  //   });
  // }
  private clientSettingsUpdated(event: eH.IEventRoot<eH.IEvent>): void {
    // implement this method
  }

  private clientBye(event: eH.IEventRoot<eH.IEvent>): void {
    if (event[eH.EventTypes.CLIENTS]) {
      // Example logic - you'll need to replace with your specific functionality
      console.log(eH.EventTypes.CLIENTS, `Client disconnected: ${event[eH.EventTypes.CLIENTS]}`);
    } else {
      console.error("Client disconnection event missing clientId");
    }
  }  // ... other event listeners for 'close', 'message', etc.

  private serverActive(event: eH.IEventRoot<eH.IEvent>): void {
    // implement this method
  }

  private gatherAndSendStats(): void {
    // implement this method
  }
  // private handleStatsUpdate(event: eH.IEventRoot<eH.IEvent>): void {
  //   if (event.success === true) {
  //     this.on(eH.EventTypes.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
  //     console.log('Latency:', event.data.blob);
  //   } else {
  //     this.handleError(new Error(event.data.message)); // Or a custom error type
  //   }
  // }

  // private handleClientstats(event: eH.IEventRoot<eH.IEvent>) {
  //   console.log('Client Latency Exceeded:', event.data);
  //   // ... React to client latency (e.g., send warning, log data)
  // }

  private handleTimerStarted(event: statsI.IStatsEvent): void {
    if (event.data && event.data.errCode === 0) {
      this.gatherAndSendStats.bind(this)
      console.log('Latency:', event.data.blob);
    } else {
      this.handleError(new Error(event.message)); // Or a custom error type
    }
  }

  public handleClientConnected(_ws: WebSocket): void {
    const event: eH.IEvent = {
      type: eH.SubEventTypes.CLIENT_CONNECTED, // or another appropriate type
      message: 'Client connected',
      success: false,
      timestamp: Date.now(),
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.emit(eH.EventTypes.SERVER, event);
  }

  public handleClientMessage(_ws: WebSocket): void {
    const event: eH.IEvent = {
      message: 'Client message ready',
      type: eH.SubEventTypes.CLIENT_MESSAGE_READY,
      success: true,
      timestamp: Date.now(),
      data: {
        errCode: 0, // or another appropriate code
        blob: _ws
      }
    };
    this.emit(eH.EventTypes.SERVER, event);
  }

  public handleClientDisconnected(_ws: WebSocket): void {
    const event: eH.IEvent = {
      type: eH.SubEventTypes.CLIENT_DISCONNECTED, // or another appropriate type
      message: 'Client disconnected',
      success: true,
      timestamp: Date.now(),
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
    const event: eH.IEvent = {
      type: eH.SubEventTypes.ERROR, // Or other relevant type
      message: 'An error occurred',
      success: false,
      timestamp: Date.now(),
      data: {
        errCode: -1, // Replace with suitable error code if you have them
        message: error.message,
        blob: error // Include the entire error object for analysis
      }
    };

    this.emit(eH.EventTypes.ERROR, event);
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