import { IncomingMessage } from "http";
import { inject, injectable, interfaces } from "inversify";
import "reflect-metadata";
import { WebSocket, WebSocketServer } from "ws";
// import * as statsC from "../stats/stats";
import * as statsI from "../stats/statsInstance";
import * as serverI from "../server/serverInstance";
import * as clientsI from "../clients/clientInstance";
import * as settingsI from "../settings/settingsInstance";
// import * as serverC from "../server/server";
// import * as clientsC from "../clients/clients";
import * as eH from "./EventHandlingMixin";
import Stats from "../stats/stats";
import Server from "../server/server";
import Clients from "../clients/clients";
import mainApp from "../main";

// export interface IeventManager {
//   stats: { eventCounter: number; activeEvents: number; };
//   handleTimerCreated(event: eH.IEventTypes): void;
//   handleStartTimer(event: eH.IEventTypes): void;
//   handleTimerStarted(event: eH.IEventTypes): void;
//   handleStartStopTimer(event: eH.IEventTypes): void;
//   gatherAndSendStats(): void;
//   handleStatsUpdated(event: eH.IEventTypes): void;
//   serverActive(event: eH.IEventTypes): void;
//   handleClientConnected(event: eH.IEventTypes): void;
//   clientMessageReady(event: eH.IEventTypes): void;
//   updateClientStats(): void;
//   broadcastMessage(clientId: string, message?: string): void;
//   handleClientDisconnected(event: eH.IEventTypes): void;
//   handleLatencyStopped(event: eH.IEventTypes): void;
//   clientBye(event: eH.IEventTypes): void;
//   clientSettingsUpdated(event: eH.IEventTypes): void;
// }

export interface IEventTypes {
  [key: string]: { // Main event categories
    [key: string]: any; // Subtypes
    BASIC: {
      FIRST: any;
      LAST: any;
      DEFAULT: any;
    }
    MAIN: {
      START_INTERVAL: any;
      STOP_INTERVAL: any;
      PID_AVAILABLE: any;
    };
    STATS: {
      UPDATE_ALL: any;
      UPDATE_PI: any;
      UPDATE_PU: any;
      UPDATE_OTHER: any;
    };
    SERVER: {
      LISTEN: any;
    };
    CLIENTS: {
      CREATE: any;
      DELETE: any;
      MODIFY: any;
    };
    CLIENT: {
      CONNECT: any;
      DISCONNECT: any;
      MESSAGE: any;
      UPDATE_STATS: any;
      UPDATE_SETTINGS: any;
    };
    DEBUG: {
      START: any;
      STOP: any;
    };
    ERROR: {
      GLOBAL: any;
    }
  };
}

export class eventManager extends eH.EventEmitterMixin {
  public constructor(
  ) {
    super();
    this.setupEventHandlers();
    this.emit('someEvent', { debug: { enabled: true } });
  }

  // private setupEventHandlers() {
  //   this.registerEventHandler(eH.MainEventTypes.MAIN, this.handleMainEvent);
  //   this.registerEventHandler(eH.MainEventTypes.STATS, this.handleStatsEvent);
  //   this.registerEventHandler(eH.MainEventTypes.SERVER, this.handleServerEvent);
  //   // ... register other top-level event handlers 
  // }

  // private registerEventHandler(eventType: string, handler: (event: eH.IEventTypes) => void) {
  //   this.on(eventType, (event: eH.IEventTypes) => {
  //     if (event.subTypes[0]) { // Assuming your events have subTypes
  //       handler.call(this, event); // Call the handler in the context of 'this'
  //     } else {
  //       this.handleError(new Error(`${eventType} event data missing`));
  //     }
  //   });
  // }
  protected setupEventHandlers() {
    // ... (your other event handlers)
    // Main event handler
    this.on(eH.MainEventTypes.MAIN, this.handleMainEvent);
    // Stats event handler
    this.on(eH.MainEventTypes.STATS, this.handleStatsEvent);
    // Server event handler
    this.on(eH.MainEventTypes.SERVER, this.handleServerEvent);
    // Client event handler
    this.on(eH.MainEventTypes.CLIENTS, this.handleClientEvent);
    // Debug event handler
    this.on('DEBUG',  (event: IEventTypes) => {
      if (event.subTypes[0] === 'START') {
        console.log(`Debug event started: ${event.debug.eventName}`);
      } else if (event.subTypes[0] === 'STOP') {
        const duration = event.debug.endTime - event.debug.startTime;
        console.log(`Debug event '${event.debug.eventName}' completed in ${duration}ms`);
      }
    });

    // Global error handler
    this.on('ERROR', (event: IEventTypes) => {
      if (event.subTypes[0] === 'GLOBAL') {
        console.error(`${event.subTypes[0]} Error Event: `, event.error); 
      }
    });

    // Unknown event handler // TODO: catch rest of events
    // this.onAny((mainType: string, event: IEventTypes) => {
    //   if (!event.subTypes) return; // Safety check

    //   console.warn(`Unknown event: ${mainType}.${event.subTypes[0]}`);
    // });
  }

  private handleMainEvent(event: eH.IEventTypes) {
    switch (event.subTypes[0]) {
      case eH.SubEventTypes.MAIN.TIMER_CREATED:
        this.handleTimerCreated(event);
        break;
      case eH.SubEventTypes.MAIN.START_INTERVAL:
        this.handleStartTimer(event);
        break;
      case eH.SubEventTypes.MAIN.TIMER_STARTED:
        this.handleTimerStarted(event);
        break;
      case eH.SubEventTypes.MAIN.STOP_INTERVAL:
        this.handleStartStopTimer(event);
        break;
      // ... other MAIN subtypes
      default:
        console.warn('Unknown main event subtype:', event.subTypes[0]);
    }
  }
  private handleStatsEvent(event: eH.IEventTypes) {
    switch (event.subTypes[0]) {
      case eH.SubEventTypes.STATS.UPDATE_ALL:
        this.gatherAndSendStats();
        break;
      case eH.SubEventTypes.STATS.ALL_UPDATED:
        this.handleStatsUpdated(event);
        break;
      default:
        console.warn('Unknown stats event subtype:', event.subTypes[0]);
    }
  }
  private handleServerEvent(event: eH.IEventTypes) {
    switch (event.subTypes[0]) {
      case eH.SubEventTypes.SERVER.LISTEN:
        this.handleStartTimer(event);
        // this.serverActive(event);
        break;
      case eH.SubEventTypes.SERVER.CLIENT_MESSAGE_READY:
        this.handleClientMessage(event);
        break;
      case eH.SubEventTypes.SERVER.CLIENT_DISCONNECTED:
        this.handleClientDisconnected(event);
        break;
      default:
        console.warn('Unknown server event subtype:', event.subTypes[0]);
    }
  }
  private handleClientEvent(event: eH.IEventTypes) {
    switch (event.subTypes[0]) {
      case eH.SubEventTypes.CLIENT.CONNECT:
        this.handleClientConnected(event);
        break;
      case eH.SubEventTypes.CLIENT.MESSAGE:
        this.clientMessageReady(event); // handleClientMessage
        break;
      case eH.SubEventTypes.CLIENT.DISCONNECT:
        this.handleClientDisconnected(event);
        break;
      default:
        console.warn('Unknown client event subtype:', event.subTypes[0]);
    }
  }
  private handleDebugEvent(event: eH.IEventTypes) {
    this.on(eH.MainEventTypes.DEBUG, (event: eH.DebugEvent) => {
      if (event.debug.endTime) { // Check if timing completed
        const duration = event.debug.endTime - event.debug.startTime;
        console.log(`Debug Event '${event.debug.eventName}' took ${duration}ms`);
      }
    });
  }

  handleStartStopTimer(event: eH.IEventTypes) {
    throw new Error("Method not implemented.");
  }

  private handleStatsUpdated(event: eH.IEventTypes): void {
    try {
      this.clientMessageReady(event);
      //  this.on(eH.MainEventTypes.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
    } catch (error) {
      this.handleError(new Error('statsUpdated'), error); // Or a custom error type
    }
  }

  // private handleStartTimer(event: eH.IEventTypes): void {
  //   console.log('Start timer event received:', event);
  //   // You can start a timer here
  //   const timerId = setTimeout(() => {
  //     console.log('Timer ended');
  //     // Emit timer ended event
  //     this.emit(eH.MainEventTypes.MAIN, { subTypes: eH.SubEventTypes.MAIN.TIMER_STOPPED, timestamp: Date.now() });
  //   }, 1000); // For example, wait for 1 second
  //   // Store timerId if you need to clear it later
  // }

  private serverActive(event: eH.IEventTypes): void {
    console.error("Method not implemented.");
  }

  private handleTimerStarted(event: eH.IEventTypes): void {
    if (!event[eH.MainEventTypes.MAIN]) return;

    const timerEvent = event[eH.MainEventTypes.MAIN] as MainEvent;

    // 1. Store timer information (you might use a database or in-memory structure)
    this.activeTimers.set(timerEvent.mainEvent.pid, {
      startTime: timerEvent.timestamp
    });
  }
  public async handleClientConnected(event: eH.IEventTypes): Promise<void> {
    this.MainService.startIntervalIfNeeded();
    const newEvent: eH.IEventTypes = {
      subTypes: eH.SubEventTypes.CLIENT_CONNECTED, // or another appropriate type
      message: 'Client connected',
      success: false,
      timestamp: Date.now(),
      data: {
        errCode: 0, // or another appropriate code
        blob: event
      }
    };
    this.emit(eH.MainEventTypes.SERVER, newEvent);
  }
  public clientMessageReady(event: eH.IEventTypes): void {
    if (!event[eH.MainEventTypes.CLIENTS]) return; // Safety check

    const clientEvent = event[eH.MainEventTypes.CLIENTS] as eH.BaseEvent;

    // 1. Process message (replace with your application logic)
    const processedData = this.processClientMessage(clientEvent.message);

    // 2. Trigger other events based on the processed message
    if (processedData.type === 'settings_update') {
      this.emit(eH.SubEventTypes.CLIENTS.MODIFY, {
        ...clientEvent,
        clientsEvent: {
          ...clientEvent.clientsEvent,
          settings: processedData.settings // Assume settings are part of processedData
        }
      });
    } // Add more conditional event emissions as needed
  }
  private processClientMessage(message: string): any {
    // Implement your message parsing and processing logic here
    // Example - assume a simple JSON format
    try {
      return JSON.parse(message);
    } catch (error) {
      this.handleError(error);
      return { subTypes: 'unknown' }; // Default to unknown type 
    }
  }
  public handleClientMessage(event: eH.IEventTypes): void {
    if (event[eH.MainEventTypes.CLIENTS] && event[eH.MainEventTypes.CLIENTS].clientId) {
      const clientId = event[eH.MainEventTypes.CLIENTS].clientId;

      // Example 1: Update stats based on message
      if (event.data && event.data.type === 'update_stats') {
        Main.clients._clients.updateClientStats(clientId, event.data.stats);
      }

      // Example 2: Forward message to other clients (hypothetical)
      if (event.data && event.data.type === 'broadcast') {
        this.broadcastMessage(clientId, event.data.message);
      }
    } else {
      console.warn('Invalid client message format');
    }
    this.emit(eH.MainEventTypes.SERVER, newEvent);
  }
  public updateClientStats() {
    console.error("Method not implemented.");
  }
  public broadcastMessage(clientId: string, message?: string) {
    console.error("Method not implemented.");
  }
  public handleClientDisconnected(event: eH.IEventTypes): void {
    const newEvent: eH.IEventTypes = {
      subTypes: eH.SubEventTypes.CLIENT_DISCONNECTED, // or another appropriate type
      message: 'Client disconnected',
      success: true,
      timestamp: Date.now(),
      data: {
        errCode: 0, // or another appropriate code
        blob: event
      }
    };
    this.handleError(new Error(newEvent.message)); // Or a custom error type
  }

  public clientMessageReady(event: eH.IEventTypes): void {
    console.error("Method not implemented.");
  }
  handleLatencyStopped(event: any) {
    console.error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    console.error("Method not implemented.");
  }


  private clientBye(event: eH.IEventTypes): void {
    if (event[eH.MainEventTypes.CLIENTS]) {
      // Example logic - you'll need to replace with your specific functionality
      console.log(eH.MainEventTypes.CLIENTS, `Client disconnected: ${event[eH.MainEventTypes.CLIENTS]}`);
    } else {
      console.error("Client disconnection event missing clientId");
    }
  }

}


export class SingletonEventManager extends eventManager {
  private static _instance: any;
  private constructor() {
    super();
  }
  public static getInstance(): SingletonEventManager {
    if (!SingletonEventManager._instance) {
      SingletonEventManager._instance = new eventManager();
    }
    return SingletonEventManager._instance;
  }
}

/* 
https://github.com/neosmatrix321/websocket/tree/master
*/