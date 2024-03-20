import { EventEmitter } from "events";
import "reflect-metadata";
import { MainEventTypes, IEventTypes, SubEventTypes, IEventStats, BaseEvent, debugDataCallback, ErrorEvent, IErrorEvent } from './eventInterface';
import { Main } from "../main";


export class EventEmitterMixin {
  private static _instance: EventEmitterMixin;
  public static eventStats: IEventStats = { eventCounter: 0, activeEvents: 0, errorCounter: 0, guiEventCounter: 0, guiActiveEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, any> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string, eventData: any) {  // Modified parameter
    // console.log('EventEmitterMixin.storeEvent:', event);
    // console.dir(eventData);
    let Key = event;
    let Data = eventData;
    if (!this._events.has(Key)) {
      if (!this.isValidEvent(Key, Data)) {
        const { customKey, customData } = this.createEvent(Key, Data);
        Key = customKey;
        Data = customData;
      }
      // if (EventEmitterMixin.eventStats.activeEvents > 10) {
      //   process.exit(1);
      // }
      this._events.set(Key, Data);
    }
  }

  private createEvent(event: string, ...args: any[]): { customKey: string, customData: IEventTypes } {
    let originalEvent = this._events.get(event);
    if (!originalEvent) {
      this.handleError(SubEventTypes.ERROR.WARNING, `EventEmitterMixin.createEvent`, MainEventTypes.EVENT, new Error(`from ${event}`), { ...args });
    }
    return { customKey: event, customData: { ...args[0] } };
  }
  private isValidEvent(event: string, eventData?: any): boolean {
    if (Object.keys(MainEventTypes).includes(event)) {
      // console.log('EventEmitterMixin.isValidEvent:', event);
      return true;
    } else {
      this.handleError(SubEventTypes.ERROR.WARNING, `EventEmitterMixin.isValidEvent`, MainEventTypes.EVENT, new Error(`Invalid event: ${event}`), eventData);
      return false;
    }
  }
  private emitError(subType: string, message: string, counter: number, mainSource: string, errorEvent: Error, json?: string): void {
    const myJSON = json ? Main.safeStringify(json, 3) : {};
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
  public handleError(subType: string, message: string, mainSource: string, errorEvent: Error, json?: any): void {
    // console.error(`handleError type: ${type}, message: ${message}`);
    // console.dir(errorBlob, { depth: null, colors: true });
    this.emitError(subType, message, EventEmitterMixin.eventStats.errorCounter++, mainSource, errorEvent, json); // Emit the error for wider handling
  }

  public async on(event: string, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    this.off(event, listener);
    this._emitter.on(event, listener);
  }

  public async once(event: string, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    this.off(event, listener);
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
    if (this._events.has(event)) {
      EventEmitterMixin.eventStats.activeEvents--;
      this._events.delete(event); // Remove the event from the stored events
    }
  }

  public async emit(event: string, ...args: any[]) {
    EventEmitterMixin.eventStats.eventCounter++;
    EventEmitterMixin.eventStats.activeEvents++;
    this._emitter.emit(event, ...args);
  }

  public static getInstance(): EventEmitterMixin {
    if (!this._instance) {
      this._instance = new EventEmitterMixin();
    }
    return this._instance;
  }
}



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

