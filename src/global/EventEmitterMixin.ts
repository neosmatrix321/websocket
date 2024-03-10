import { IncomingMessage } from "http";
import { EventEmitter } from "events";
import "reflect-metadata";
import { WebSocket, WebSocketServer } from "ws";
// import * as statsC from "../stats/stats";
// import * as statsI from "../stats/statsInstance";
// import * as serverI from "../server/serverInstance";
// import * as clientsI from "../clients/clientInstance";
// import * as settingsI from "../settings/settingsInstance";
// import * as serverC from "../server/server";
// import * as clientsC from "../clients/clients";
import * as eventI from "./eventInterface";
// import Stats from "../stats/stats";
// import Server from "../server/server";
// import Clients from "../clients/clients";
// import mainApp from "../main";


export const DEFAULT_VALUE_CALLBACKS = {
  timestamp: () => Date.now(),
  clientName: (clientId: string) => `Client-${clientId}`,
  activeEvents: (() => EventEmitterMixin.stats.activeEvents),
  eventCounter: (() => EventEmitterMixin.stats.eventCounter++)
};

export class EventEmitterMixin {
  private static _instance: EventEmitterMixin;
  public static stats: eventI.IEventStats = { eventCounter: 0, activeEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, any> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string, eventData: any) {  // Modified parameter
    if (!this._events.has(event)) {
      if (eventData[0] && !this.isValidEvent(event, eventData[0])) {
        const { customKey, customData } = this.createEvent(event, eventData);
        this._events.set(customKey, customData);
      }
    } else {
    }
  }
  private updateDebugData( ...customData: eventI.DebugEvent[] ): eventI.IEventTypes {
    if (customData[0] && customData[0].debugEvent && customData[0].debugEvent.enabled) {
      let debugEvent;
      if (customData[0].debugEvent.eventName) {
        customData[0].updateData(); // Calculate debug data
        debugEvent = customData[0].debugEvent;
      } else if (!customData[0].debugEvent.eventName) {
        debugEvent = { debugEvent: {
            enabled: true,
            eventName: "debugEvent",
          }
        }
      }
      const finalData = { ...customData[0], ...debugEvent };
      return finalData;
    }
    return customData[0];
  }
  private createEvent(event: string, ...args: any[]): { customKey: string, customData: eventI.IEventTypes } {
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        console.error(`Invalid event data for event type ${event as string}`);
      }
      const originalEvent = this._events.get(event);
      if (!originalEvent) {
        const newData = new eventI.BaseEvent({data: JSON.stringify(event)});
        newData.errorEvent = { errCode: 6, data: { event, args } };
        this.emitError(eventI.MainEventTypes.ERROR, newData);
        return { customKey: eventI.SubEventTypes.ERROR.WARNING, customData: newData };
      }
      const updatedData = this.updateDebugData(originalEvent);

      // Get the stored event (could be eventI.BaseEvent for unknown ones) and merge
      return { ...this._events.get(event), ...updatedData };
    } catch (error) {
      const newData = new eventI.BaseEvent({data: JSON.stringify(event)});
      this.emitError(eventI.MainEventTypes.ERROR, newData);
      return { customKey: eventI.SubEventTypes.ERROR.WARNING, customData: newData };
    }
  }
  private isValidEvent(event: string, eventData?: any): boolean {
    switch (event) {

      case typeof eventI.MainEventTypes:
        return true;
      default:
        const newEvent: eventI.BaseEvent = { subType: eventI.SubEventTypes.ERROR.FATAL, success: false, message: 'Fatal: Invalid event type', errorEvent: { errCode: 4, data: { event, eventData } } };
        this.emit(eventI.MainEventTypes.ERROR, newEvent);
        return false;
    }
  }
  private emitError(event: string, error?: any): void {
    const newEvent: eventI.BaseEvent = {
      ...(new eventI.BaseEvent({ subType: eventI.MainEventTypes.ERROR }) as eventI.BaseEvent),
      errorEvent: {
        errCode: 2, // A sample error code
        error: new Error('Something went wrong'), // A sample error
        data: error
      }
    };
    this._emitter.emit(event as string, newEvent);
  }

  // ... other EventEmitter methods
  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.emitError(`${eventI.MainEventTypes.ERROR}.${eventI.MainEventTypes.ERROR}`, errorData); // Emit the error for wider handling
  }

  public async on(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents++;
    EventEmitterMixin.stats.eventCounter++;
    const eventData = this.createEvent(event, listener);
    this.storeEvent(event, listener); // Ensure the event is registered
    this._emitter.on(event.toString(), listener);
  }
  public async prepend(event: string, listener: (...args: any[]) => void) {
    this.storeEvent(event, listener);
    this._emitter.prependListener(event.toString(), listener); // Use prependListener
  }

  public async off(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents--;
    this._emitter.off(event.toString(), listener);
  }

  public async emit(event: string, ...args: any[]) {
    const eventData = this.createEvent(event, ...args);
    if (!eventData) {
      return; // Handle event creation failure
    }

    // this._events.push(eventData); // ??
    this._emitter.emit(event.toString(), eventData);
  }
  public static getInstance(): EventEmitterMixin {
      if (!EventEmitterMixin._instance) {
          EventEmitterMixin._instance = new EventEmitterMixin();
      }
      return EventEmitterMixin._instance;
  }
}

// export class SingletonEventManager extends EventEmitterMixin {
//   private static _instance: any;
//   private constructor() {
//     super();
//   }
//   public static getInstance(): SingletonEventManager {
//     if (!SingletonEventManager._instance) {
//       SingletonEventManager._instance = new EventEmitterMixin();
//     }
//     return SingletonEventManager._instance;
//   }
// }

/* 
https://github.com/neosmatrix321/websocket/tree/master
*/

// export interface IeventManager {
//   stats: { eventCounter: number; activeEvents: number; };
//   handleTimerCreated(event: eH.eventI.IEventTypes): void;
//   handleStartTimer(event: eH.eventI.IEventTypes): void;
//   handleTimerStarted(event: eH.eventI.IEventTypes): void;
//   handleStartStopTimer(event: eH.eventI.IEventTypes): void;
//   gatherAndSendStats(): void;
//   handleStatsUpdated(event: eH.eventI.IEventTypes): void;
//   serverActive(event: eH.eventI.IEventTypes): void;
//   handleClientConnected(event: eH.eventI.IEventTypes): void;
//   clientMessageReady(event: eH.eventI.IEventTypes): void;
//   updateClientStats(): void;
//   broadcastMessage(clientId: string, message?: string): void;
//   handleClientDisconnected(event: eH.eventI.IEventTypes): void;
//   handleLatencyStopped(event: eH.eventI.IEventTypes): void;
//   clientBye(event: eH.eventI.IEventTypes): void;
//   clientSettingsUpdated(event: eH.eventI.IEventTypes): void;
// }

  // private setupEventHandlers() {
  //   this.registerEventHandler(eH.eventI.MainEventTypes.MAIN, this.handleMainEvent);
  //   this.registerEventHandler(eH.eventI.MainEventTypes.STATS, this.handleStatsEvent);
  //   this.registerEventHandler(eH.eventI.MainEventTypes.SERVER, this.handleServerEvent);
  //   // ... register other top-level event handlers 
  // }

  // private registerEventHandler(eventType: string, handler: (event: eH.eventI.IEventTypes) => void) {
  //   this.on(eventType, (event: eH.eventI.IEventTypes) => {
  //     if (event.subType) { // Assuming your events have subType
  //       handler.call(this, event); // Call the handler in the context of 'this'
  //     } else {
  //       this.handleError(new Error(`${eventType} event data missing`));
  //     }
  //   });
  // }

  // private handleDebugEvent(event: eH.eventI.IEventTypes) {
  //   this.on(eH.eventI.MainEventTypes.DEBUG, (event: eH.eventI.DebugEvent) => {
  //     if (event.debug.endTime) { // Check if timing completed
  //       const duration = event.debug.endTime - event.debug.startTime;
  //       console.log(`Debug Event '${event.debug.eventName}' took ${duration}ms`);
  //     }
  //   });
  // }

  // handleStartStopTimer(event: eH.eventI.IEventTypes) {
  //   throw new Error("Method not implemented.");
  // }

  // private handleStatsUpdated(event: eH.eventI.IEventTypes): void {
  //   try {
  //     this.clientMessageReady(event);
  //     //  this.on(eH.eventI.MainEventTypes.PID_AVAILABLE, this.handleStatsUpdated.bind(this));
  //   } catch (error) {
  //     this.handleError(new Error('statsUpdated'), error); // Or a custom error type
  //   }
  // }

  // private handleStartTimer(event: eH.eventI.IEventTypes): void {
  //   console.log('Start timer event received:', event);
  //   // You can start a timer here
  //   const timerId = setTimeout(() => {
  //     console.log('Timer ended');
  //     // Emit timer ended event
  //     this.emit(eH.eventI.MainEventTypes.MAIN, { subType: eH.SubEventTypes.MAIN.TIMER_STOPPED, timestamp: Date.now() });
  //   }, 1000); // For example, wait for 1 second
  //   // Store timerId if you need to clear it later
  // }

  // private serverActive(event: eH.eventI.IEventTypes): void {
  //   console.error("Method not implemented.");
  // }

  // private handleTimerStarted(event: eH.eventI.IEventTypes): void {
  //   if (!event[eH.eventI.MainEventTypes.MAIN]) return;
  //   const timerEvent = event[eH.eventI.MainEventTypes.MAIN] as MainEvent;
  //   // 1. Store timer information (you might use a database or in-memory structure)
  //   this.activeTimers.set(timerEvent.mainEvent.pid, {
  //     startTime: timerEvent.timestamp
  //   });
  // }

  // public async handleClientConnected(event: eH.eventI.IEventTypes): Promise<void> {
  //   const newEvent: eH.eventI.IEventTypes = {
  //     subType: eH.SubEventTypes.CLIENT_CONNECTED, // or another appropriate type
  //     message: 'Client connected',
  //     success: false,
  //     timestamp: Date.now(),
  //     data: {
  //       errCode: 0, // or another appropriate code
  //       blob: event
  //     }
  //   };
  //   this.emit(eH.eventI.MainEventTypes.SERVER, newEvent);
  // }


  // private processClientMessage(message: string): any {
  //   // Implement your message parsing and processing logic here
  //   // Example - assume a simple JSON format
  //   try {
  //     return JSON.parse(message);
  //   } catch (error) {
  //     this.handleError(error);
  //     return { subType: 'unknown' }; // Default to unknown type 
  //   }
  // }

  // public handleClientMessage(event: eH.eventI.IEventTypes): void {
  //   if (event[eH.eventI.MainEventTypes.CLIENTS] && event[eH.eventI.MainEventTypes.CLIENTS].clientId) {
  //     const clientId = event[eH.eventI.MainEventTypes.CLIENTS].clientId;
  //     // Example 1: Update stats based on message
  //     if (event.data && event.data.type === 'update_stats') {
  //       Main.clients._clients.updateClientStats(clientId, event.data.stats);
  //     }
  //     // Example 2: Forward message to other clients (hypothetical)
  //     if (event.data && event.data.type === 'broadcast') {
  //       this.broadcastMessage(clientId, event.data.message);
  //     }
  //   } else {
  //     console.warn('Invalid client message format');
  //   }
  //   this.emit(eH.eventI.MainEventTypes.SERVER, newEvent);
  // }
  // public updateClientStats() {
  //   console.error("Method not implemented.");
  // }
  // public broadcastMessage(clientId: string, message?: string) {
  //   console.error("Method not implemented.");
  // }

  // public handleClientDisconnected(event: eH.eventI.IEventTypes): void {
  //   const newEvent: eH.eventI.IEventTypes = {
  //     subType: eH.SubEventTypes.CLIENT_DISCONNECTED, // or another appropriate type
  //     message: 'Client disconnected',
  //     success: true,
  //     timestamp: Date.now(),
  //     data: {
  //       errCode: 0, // or another appropriate code
  //       blob: event
  //     }
  //   };
  //   this.handleError(new Error(newEvent.message)); // Or a custom error type
  // }

  // private clientBye(event: eH.eventI.IEventTypes): void {
  //   if (event[eH.eventI.MainEventTypes.CLIENTS]) {
  //     // Example logic - you'll need to replace with your specific functionality
  //     console.log(eH.eventI.MainEventTypes.CLIENTS, `Client disconnected: ${event[eH.eventI.MainEventTypes.CLIENTS]}`);
  //   } else {
  //     console.error("Client disconnection event missing clientId");
  //   }
  // }

  // public clientMessageReady(event: eH.eventI.IEventTypes): void {
  //   console.error("Method not implemented.");
  // }
  // handleLatencyStopped(event: any) {
  //   console.error("Method not implemented.");
  // }
  // handleTimerCreated(event: any) {
  //   console.error("Method not implemented.");
  // }
