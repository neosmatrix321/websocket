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
import Main from "../main";
import { FirstEvent } from './EventHandlingMixin';

export const EVENT_MANAGER_TOKEN = Symbol('eventManager');


class BaseClass { }
@injectable()
export class eventManager extends eH.EventEmitterMixin<eH.IEvent> {
  private webServer: WebSocketServer;
  public constructor(
    @inject(EVENT_MANAGER_TOKEN) webServer: WebSocketServer
  ) {
    super();
    this.webServer = webServer || new WebSocketServer({ noServer: true });
    this.setupEventHandlers();
    const FirstEvent: eH.FirstEvent = new eH.BaseEvent(eH.MainEventTypes.BASIC, eH.EventTypes.BASIC.FIRST);
    this.emit(`${eH.MainEventTypes.BASIC}.${eH.EventTypes.BASIC.FIRST}`, FirstEvent);
  }
  private setupEventHandlers() {
    // Client Event Handlers
    this.on(eH.EventTypes.STATS, (event: IEventRoot<IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      // Access properties safely (assuming your IStatsEvent interface is correct)
      if (event[eH.EventTypes.STATS]) {
        switch (event[eH.EventTypes.STATS].type) {
          case SubEventTypes.UPDATE_ALL_STATS:
            this.handleStatsUpdate(event);
            break;
          case SubEventTypes.ALL_STATS_UPDATED: // Or any other relevant type that might be emitted
            this.handleStatsUpdated(event);
            break;        // ... other 'stats' event types
        }
      }
    }); this.on(eH.eH.EventTypes.CLIENTS, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.eH.EventTypes.CLIENTS]) {
        switch (event[eH.eH.EventTypes.CLIENTS].type) {
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

    this.on(eH.eH.EventTypes.SERVER, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.eH.EventTypes.SERVER]) {
        switch (event[eH.eH.EventTypes.SERVER].type) {
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
    this.on(eH.eH.EventTypes.MAIN, (event: eH.IEventRoot<eH.IEvent>) => {
      if (!event) {
        console.error('Event is undefined');
        return;
      }
      if (event[eH.eH.EventTypes.MAIN]) {
        switch (event[eH.eH.EventTypes.MAIN].type) {
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
    this.gatherAndSendStats.bind(this)
    console.log('Latency:', event);
    // } else {
    //   this.handleError(new Error(event.message)); // Or a custom error type
    // }
  }
  private gatherAndSendStats(): void {
    // 1. Gather stats (replace with your actual logic)
    const statsData: StatsEvent = {
      type: eH.EventTypes.STATS.ALL_STATS_UPDATED,
      success: true,
      timestamp: Date.now(),
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
  private handleStatsUpdated(event: eH.IEventRoot<eH.IEvent>): void {
    try {
      this.clientMessageReady(event);
      //  this.on(eH.eH.EventTypes.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
    } catch (error) {
      this.handleError(new Error('statsUpdated'), error); // Or a custom error type
    }
  }

  private handleStartTimer(event: eH.IEventRoot<eH.IEvent>): void {
    console.log('Start timer event received:', event);
    // You can start a timer here
    const timerId = setTimeout(() => {
      console.log('Timer ended');
      // Emit timer ended event
      this.emit(eH.eH.EventTypes.MAIN, { type: eH.SubEventTypes.TIMER_STOPPED, timestamp: Date.now() });
    }, 1000); // For example, wait for 1 second
    // Store timerId if you need to clear it later
  }

  private serverActive(event: eH.IEventRoot<eH.IEvent>): void {
    console.error("Method not implemented.");
  }

  private handleTimerStarted(event: eH.IEventRoot<eH.IEvent>): void {
    if (!event[eH.EventTypes.MAIN]) return;

    const timerEvent = event[eH.EventTypes.MAIN] as MainEvent;

    // 1. Store timer information (you might use a database or in-memory structure)
    this.activeTimers.set(timerEvent.mainEvent.pid, {
      startTime: timerEvent.timestamp
    });
  }
  public async handleClientConnected(event: eH.IEventRoot<eH.IEvent>): void {
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
    this.emit(eH.eH.EventTypes.SERVER, newEvent);
  }
  public clientMessageReady(event: eH.IEventRoot<eH.IEvent>): void {
    if (!event[eH.EventTypes.CLIENTS]) return; // Safety check

    const clientEvent = event[eH.EventTypes.CLIENTS] as ClientsEvent;

    // 1. Process message (replace with your application logic)
    const processedData = this.processClientMessage(clientEvent.message);

    // 2. Trigger other events based on the processed message
    if (processedData.type === 'settings_update') {
      this.emit(eH.EventTypes.CLIENTS.MODIFY, {
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
  public handleClientMessage(event: eH.IEventRoot<eH.IEvent>): void {
    if (event[eH.EventTypes.CLIENTS] && event[eH.EventTypes.CLIENTS].clientId) {
      const clientId = event[eH.EventTypes.CLIENTS].clientId;

      // Example 1: Update stats based on message
      if (event.data && event.data.type === 'update_stats') {
        statsI.updateClientStats(clientId, event.data.stats);
      }

      // Example 2: Forward message to other clients (hypothetical)
      if (event.data && event.data.type === 'broadcast') {
        this.broadcastMessage(clientId, event.data.message);
      }
    } else {
      console.warn('Invalid client message format');
    }
  }
  // public handleClientMessage(event: eH.IEventRoot<eH.IEvent>): void {
  //   const newEvent: eH.IEvent = {
  //     message: 'Client message ready',
  //     type: eH.SubEventTypes.CLIENT_MESSAGE_READY,
  //     success: true,
  //     timestamp: Date.now(),
  //     data: {
  //       errCode: 0, // or another appropriate code
  //       blob: event
  //     }
  //   };
  //   this.emit(eH.eH.EventTypes.SERVER, newEvent);
  // }

  public handleClientDisconnected(event: eH.IEventRoot<eH.IEvent>): void {
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

  public clientMessageReady(event: eH.IEventRoot<eH.IEvent>): void {
    console.error("Method not implemented.");
  }
  handleLatencyStopped(event: any) {
    console.error("Method not implemented.");
  }
  handleTimerCreated(event: any) {
    console.error("Method not implemented.");
  }


  private clientBye(event: eH.IEventRoot<eH.IEvent>): void {
    if (event[eH.eH.EventTypes.CLIENTS]) {
      // Example logic - you'll need to replace with your specific functionality
      console.log(eH.eH.EventTypes.CLIENTS, `Client disconnected: ${event[eH.eH.EventTypes.CLIENTS]}`);
    } else {
      console.error("Client disconnection event missing clientId");
    }
  }

  private clientSettingsUpdated(event: eH.IEventRoot<eH.IEvent>): void {
    console.error("Method not implemented.");
  }
}

/* 
https://github.com/neosmatrix321/websocket/tree/master
*/