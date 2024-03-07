import { IncomingMessage } from "http";
import { inject, injectable, interfaces } from "inversify";
import "reflect-metadata";
import { WebSocket, WebSocketServer } from "ws";
// import * as statsC from "../stats/stats";
import * as statsI from "../stats/statsInstance";
import * as serverI from "../server/serverInstance";
// import * as serverC from "../server/server";
// import * as clientsC from "../clients/clients";
import * as eH from "./EventHandlingMixin";
// const EventMixin = eH.SingletonEventManager.getInstance();
// @inject(EVENT_MANAGER_TOKEN) eventInstance: typeof EventMixin


// export interface IeventManager {
//   stats: { eventCounter: number; activeEvents: number; };
//   handleTimerCreated(event: eH.IEvent): void;
//   handleStartTimer(event: eH.IEvent): void;
//   handleTimerStarted(event: eH.IEvent): void;
//   handleStartStopTimer(event: eH.IEvent): void;
//   gatherAndSendStats(): void;
//   handleStatsUpdated(event: eH.IEvent): void;
//   serverActive(event: eH.IEvent): void;
//   handleClientConnected(event: eH.IEvent): void;
//   clientMessageReady(event: eH.IEvent): void;
//   updateClientStats(): void;
//   broadcastMessage(clientId: string, message?: string): void;
//   handleClientDisconnected(event: eH.IEvent): void;
//   handleLatencyStopped(event: eH.IEvent): void;
//   clientBye(event: eH.IEvent): void;
//   clientSettingsUpdated(event: eH.IEvent): void;
// }



export class eventManager extends eH.EventEmitterMixin {
  public constructor(
    ) {
    super();
    this.setupEventHandlers();
    this.emit('someEvent', { debug: { enabled: true } });
  }
  private setupEventHandlers() {
    // Main Events
    this.on(eH.MainEventTypes.MAIN, (event: eH.IEventTypes) => {
      if (event.subTypes[0]) {
        switch (event.subTypes[0]) {
          case eH.SubEventTypes.MAIN.TIMER_CREATED:
            this.handleTimerCreated(event);
            break;
          case eH.SubEventTypes.MAIN.START_TIMER:
            this.handleStartTimer(event);
            break;
          case eH.SubEventTypes.MAIN.TIMER_STARTED:
            this.handleTimerStarted(event);
            break;
          case eH.SubEventTypes.MAIN.PID_AVAILABLE:
            this.handleStartStopTimer(event);
            break;
          default:
            console.warn('Unknown main event subtype:', event.subTypes[0]);
        }
      } else {
        this.handleError(new Error('Main event data missing'));
      }
    });
    // Stats Events
    this.on(eH.MainEventTypes.STATS, (event: eH.IEventTypes) => {
      if (event.statsEvent) {
        switch (event.subTypes[0]) {
          case eH.SubEventTypes.STATS.UPDATE_ALL_STATS:
            this.gatherAndSendStats();
            break;
          case eH.SubEventTypes.STATS.ALL_STATS_UPDATED:
            this.handleStatsUpdated(event);
            break;
          default:
            console.warn('Unknown stats event subtype:', event.subTypes[0]);
        }
      } else {
        this.handleError(new Error('Stats event data missing'));
      }
    });
    // Server Events
    this.on(eH.MainEventTypes.SERVER, (event: eH.IEventTypes) => {
      if (event.serverEvent) {
        switch (event.subTypes[0]) {
          case eH.SubEventTypes.SERVER.LISTEN:
            this.serverActive(event);
            break;
          case eH.SubEventTypes.SERVER.CLIENT_CONNECTED:
            this.handleClientConnected(event);
            break;
          case eH.SubEventTypes.SERVER.CLIENT_MESSAGE_READY:
            this.handleClientMessage(event);
            break;
          case eH.SubEventTypes.SERVER.CLIENT_DISCONNECTED:
            this.handleClientDisconnected(event);
            break;
          // ... add cases for other server event subtypes
          default:
            console.warn('Unknown server event subtype:', event.subTypes[0]);
        }
      } else {
        this.handleError(new Error('Server event data missing'));
      }
    });
    // Client Events
    this.on(eH.MainEventTypes.CLIENTS, (event: eH.IEventTypes) => {
      if (event.clientsEvent) {
        switch (event.subTypes[0]) {
          case eH.SubEventTypes.CLIENTS.CLIENT_STATS_UPDATED:
            this.clientMessageReady(event);
            break;
          case eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS:
            this.updateClientStats();
            break;
          // ... add cases for other client event subtypes
          default:
            console.warn('Unknown clients event subtype:', event.subTypes[0]);
        }
      } else {
        this.handleError(new Error('Clients event data missing'));
      }
    });

    // Debug Events
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

  private gatherAndSendStats(): void {
    Stats.stats.updateAllStats();
    const statsData: eH.BaseEvent = {
      type: eH.SubEventTypes.STATS.ALL_STATS_UPDATED,
      statsEvent: {
        statsId: 1,
        // newValue: statsI.calculateSystemLoad(), // Example system load calculation
        // oldValue: null, // Store previous value if needed 
        updatedFields: ['systemLoad']
      }
    };

    // 2. Send stats to all connected clients
    this.webServer.clients.forEach(client => {
      // Note: You might add error handling for WebSocket send failures
      client.send(JSON.stringify(statsData));
    });
  }
  private handleStatsUpdated(event: eH.IEventTypes): void {
    try {
      this.clientMessageReady(event);
      //  this.on(eH.EventTypes.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
    } catch (error) {
      this.handleError(new Error('statsUpdated'), error); // Or a custom error type
    }
  }

  private handleStartTimer(event: eH.IEvent): void {
    console.log('Start timer event received:', event);
    // You can start a timer here
    const timerId = setTimeout(() => {
      console.log('Timer ended');
      // Emit timer ended event
      this.emit(eH.EventTypes.MAIN, { type: eH.SubEventTypes.TIMER_STOPPED, timestamp: Date.now() });
    }, 1000); // For example, wait for 1 second
    // Store timerId if you need to clear it later
  }

  private serverActive(event: eH.IEvent): void {
    console.error("Method not implemented.");
  }

  private handleTimerStarted(event: eH.IEvent): void {
    if (!event[eH.EventTypes.MAIN]) return;

    const timerEvent = event[eH.EventTypes.MAIN] as MainEvent;

    // 1. Store timer information (you might use a database or in-memory structure)
    this.activeTimers.set(timerEvent.mainEvent.pid, {
      startTime: timerEvent.timestamp
    });
  }
  public async handleClientConnected(event: eH.IEvent): void {
    Main.startIntervalIfNeeded();
    const newEvent: eH.IEvent = {
      type: eH.SubEventTypes.CLIENT_CONNECTED, // or another appropriate type
      message: 'Client connected',
      success: false,
      timestamp: Date.now(),
      data: {
        errCode: 0, // or another appropriate code
        blob: event
      }
    };
    this.emit(eH.EventTypes.SERVER, newEvent);
  }
  public clientMessageReady(event: eH.IEvent): void {
    if (!event[eH.EventTypes.CLIENTS]) return; // Safety check

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
      return { type: 'unknown' }; // Default to unknown type 
    }
  }
  public handleClientMessage(event: eH.IEvent): void {
    if (event[eH.EventTypes.CLIENTS] && event[eH.EventTypes.CLIENTS].clientId) {
      const clientId = event[eH.EventTypes.CLIENTS].clientId;

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
    this.emit(eH.EventTypes.SERVER, newEvent);
  }
  public updateClientStats() {
    console.error("Method not implemented.");
  }
  public broadcastMessage(clientId: string, message?: string) {
    console.error("Method not implemented.");
  }
  public handleClientDisconnected(event: eH.IEvent): void {
    const newEvent: eH.IEvent = {
      type: eH.SubEventTypes.CLIENT_DISCONNECTED, // or another appropriate type
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

  public clientMessageReady(event: eH.IEvent): void {
    console.error("Method not implemented.");
  }
  handleLatencyStopped(event: any) {
    console.error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    console.error("Method not implemented.");
  }


  private clientBye(event: eH.IEvent): void {
    if (event[eH.EventTypes.CLIENTS]) {
      // Example logic - you'll need to replace with your specific functionality
      console.log(eH.EventTypes.CLIENTS, `Client disconnected: ${event[eH.EventTypes.CLIENTS]}`);
    } else {
      console.error("Client disconnection event missing clientId");
    }
  }

  private clientSettingsUpdated(event: eH.IEvent): void {
    console.error("Method not implemented.");
  }
}


export class SingletonEventManager extends eventManager {
  private static _instance: any;
  private constructor() {
    super();
  }
  public static getInstance(): SingletonEventManager {
    if (!SingletonEventManager._instance) {
      SingletonEventManager._instance = new SingletonEventManager();
    }
    return SingletonEventManager._instance;
  }
}

/* 
https://github.com/neosmatrix321/websocket/tree/master
*/