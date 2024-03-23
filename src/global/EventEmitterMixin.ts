import { EventEmitter } from "events";
import "reflect-metadata";
import { MainEventTypes, SubEventTypes, IEventStats, debugDataCallback, IErrorEvent } from './eventInterface';
import { injectable } from "inversify";
import { safeStringify } from "./functions";

@injectable()
export class EventEmitterMixin {
  private static _instance: EventEmitterMixin;
  public static eventStats: IEventStats = { activeEvents: 0, errorCounter: 0, guiEventCounter: 0, guiActiveEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, any> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string, eventData: any) {
    let key = event;
    let data = eventData;

    if (!this.isValidEvent(key, data)) {
      // Attempt to extract a valid prefix based on MainEventTypes
      for (const mainEventType of Object.values(MainEventTypes)) {
        if (key.startsWith(mainEventType)) {
          key = mainEventType;  // Update the key
          break;
        }
      }

      if (!this.isValidEvent(key, data)) {
        // Still invalid, handle as an error
        this.handleError(SubEventTypes.ERROR.WARNING, `EventEmitterMixin.createEvent`, MainEventTypes.EVENT, new Error(`from ${event}`), { ...data });
        return; // Stop processing 
      }
    }
    EventEmitterMixin.eventStats.activeEvents++;
    this._events.set(key, data);
  }
  // private createEvent(event: string, ...args: any[]): { customKey: string, customData: IEventTypes } {
  //   let originalEvent = this._events.get(event);
  //   if (!originalEvent) {
  //     this.handleError(SubEventTypes.ERROR.WARNING, `EventEmitterMixin.createEvent`, MainEventTypes.EVENT, new Error(`from ${event}`), { ...args });
  //   }
  //   return { customKey: event, customData: { ...args[0] } };
  // }
  private isValidEvent(event: string, eventData?: any): boolean {
    for (const mainEventType of Object.values(MainEventTypes)) {
      if (event.startsWith(mainEventType)) {
        return true;
      }
    }
    this.handleError(SubEventTypes.ERROR.WARNING, `EventEmitterMixin.isValidEvent`, MainEventTypes.EVENT, new Error(`Invalid event: ${event}`), eventData);
    return false;
  }

  private async emitError(subType: string, message: string, counter: number, mainSource: string, errorEvent: Error, json?: string): Promise<void> {
    const myJSON = json ? safeStringify(json, 3) : {};
    const newEvent: IErrorEvent = {
      subType: subType,
      message: message,
      success: false,
      counter: counter,
      mainSource: mainSource,
      errorEvent: errorEvent,
      debugEvent: debugDataCallback,
      json: myJSON
    };
    // console.log(`Error from eventManager: ${type}`, newEvent);
    this._emitter.emit(MainEventTypes.ERROR, newEvent);
  }

  // ... other EventEmitter methods
  public async handleError(subType: string, message: string, mainSource: string, errorEvent: Error, json?: any): Promise<void> {
    // console.error(`handleError type: ${type}, message: ${message}`);
    // console.dir(errorBlob, { depth: null, colors: true });
    this.emitError(subType, message, EventEmitterMixin.eventStats.errorCounter++, mainSource, errorEvent, json); // Emit the error for wider handling
  }

  public async on(event: string, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    // this.off(event, listener);
    this._emitter.on(event, listener);
  }

  public async once(event: string, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    // this.off(event, listener);
    this._emitter.once(event, listener);
  }

  public async prepend(event: string, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    this.off(event, listener);
    this._emitter.prependListener(event, listener); // Use prependListener
  }

  public async off(event: string, listener: (...args: any[]) => void) {
    this._emitter.off(event, listener);
    if (!this._emitter.listenerCount(event)) {
      this._events.delete(event);
      EventEmitterMixin.eventStats.activeEvents--;
    }
  }
  public async emit(event: string, ...args: any[]) {
    // EventEmitterMixin.eventStats.eventCounter++;
    // EventEmitterMixin.eventStats.activeEvents++;
    this._emitter.emit(event, ...args);
  }

  public async emitOnce(event: string, ...args: any[]) {
    if (!this._events.has(event)) {
      this.storeEvent(event, args); // Ensure the event is registered
    }
    // EventEmitterMixin.eventStats.eventCounter++;
    this._emitter.once(event, () => {
      this._emitter.emit(event, ...args);
    });
  }

  public static getInstance(): EventEmitterMixin {
    if (!this._instance) {
      this._instance = new EventEmitterMixin();
    }
    return this._instance;
  }
}

const mixin = EventEmitterMixin.getInstance();
export default mixin;


/*
https://github.com/neosmatrix321/websocket/tree/master
*/

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

