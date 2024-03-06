"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";
import * as clientI from "../clients/clientInstance";
export const MainEventTypes = { BASIC: 'BASIC', MAIN: 'MAIN', STATS: 'STATS', SERVER: 'SERVER', CLIENTS: 'CLIENTS', ERROR: 'ERROR', EVENT: 'EVENT', WS: 'WS', DEBUG: 'DEBUG', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT', TIMER: 'TIMER', GENERIC: 'GENERIC', FATAL: 'FATAL', DEFAULT: 'DEFAULT' };

export const SubEventTypes = {
  BASIC: { FIRST: 'FIRST', LAST: 'LAST', DEFAULT: 'DEFAULT' },
  MAIN: { TIMER_CREATED: 'TIMER_CREATED', START_TIMER: 'START_TIMER', TIMER_STARTED: 'TIMER_STARTED', TIMER_STOPPED: 'TIMER_STOPPED', STOP_TIMER: 'STOP_TIMER', PID_AVAILABLE: 'PID_AVAILABLE' },
  STATS: { UPDATE_ALL_STATS: 'UPDATE_ALL_STATS', ALL_STATS_UPDATED: 'ALL_STATS_UPDATED', PI_STATS_UPDATED: 'PI_STATS_UPDATED', UPDATE_PI_STATS: 'UPDATE_PI_STATS', PU_STATS_UPDATED: 'PU_STATS_UPDATED', UPDATE_PU_STATS: 'UPDATE_PU_STATS', OTHER_STATS_UPDATED: 'OTHER_STATS_UPDATED', UPDATE_OTHER_STATS: 'UPDATE_OTHER_STATS' },
  SERVER: { LISTEN: 'LISTEN', CLIENT_CONNECTED: 'CLIENT_CONNECTED', CLIENT_MESSAGE_READY: 'CLIENT_MESSAGE_READY', CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED' },
  CLIENTS: { CREATE: 'CREATE', CREATED: 'CREATED', MODIFY: 'MODIFY', MODIFIED: 'MODIFIED', DELETE: 'DELETE', CLIENT_STATS_UPDATED: 'CLIENT_STATS_UPDATED', UPDATE_CLIENT_STATS: 'UPDATE_CLIENT_STATS' },
  WS: { CONNECT: 'CONNECT', DISCONNECT: 'DISCONNECT', MESSAGE: 'MESSAGE' }
};
export const DEFAULT_VALUE_CALLBACKS = {
  timestamp: () => Date.now(),
  clientName: (clientId: string) => `Client-${clientId}`,
  activeEvents: (() => EventEmitterMixin.stats.activeEvents),
  eventCounter: (() => EventEmitterMixin.stats.eventCounter++)
};

export interface IBaseEvent {
  mainTypes?: string[];
  subTypes?: string[];
  success?: boolean;
  message?: string;
  data?: any;
  statsEvent?: { statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any };
  mainEvent?: { pid?: number };
  serverEvent?: { timerId?: number, startTime?: number, endTime?: number, duration?: number };
  clientsEvent?: { id?: string, ip?: string, clientType: clientI.ClientType, message?: string };
  errorEvent?: { errCode: number, error?: Error, message?: string, data?: any };
  wsEvent?: { message?: string, connectionId?: string };
}

export class BaseEvent implements IBaseEvent {
  mainTypes: string[] = [MainEventTypes.BASIC];
  subTypes: string[] = [SubEventTypes.BASIC.DEFAULT];
  success: boolean = true;
  message: string = "";
  data?: any;
  statsEvent?: {
    statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any
  } = {
      statsId: -1, newValue: -1, oldValue: -1, updatedFields: {}
    };
  mainEvent?: {
    pid?: number
  } = {
      pid: -1
    };
  serverEvent?: {
    timerId?: number, startTime?: number, endTime?: number, duration?: number
  } = {
      timerId: -1, startTime: -1, endTime: -1, duration: -1
    };
  clientsEvent?: {
    id: string, ip: string, clientType: clientI.ClientType, message?: string
  } = {
      id: "", ip: "", clientType: clientI.ClientType.Unknown, message: ""
    };
  errorEvent?: {
    errCode: number, error?: Error, data?: any, message?: string
  } = {
      error: new Error(), errCode: -1
    };
  wsEvent?: {
    message?: string, connectionId?: string
  } = {
      message: "", connectionId: ""
    };

  constructor(data?: Partial<IBaseEvent>) {
    Object.assign(this, data);
  }
}

interface IDebugEvent extends IBaseEvent {
  debugEvent: {
    timestamp?: number;
    success: boolean;
    eventName?: string;
    enabled?: boolean;
    startTime?: number;
    endTime?: number;
    duration?: number;
    activeEvents?: number;
    eventCounter?: number;
  };
}
export class DebugEvent extends BaseEvent implements IDebugEvent {
  debugEvent: {
    timestamp: number;
    success: boolean;
    eventName: string;
    enabled: boolean;
    startTime: number;
    endTime: number;
    duration: number;
    activeEvents: number;
    eventCounter: number;
  } = {
      timestamp: DEFAULT_VALUE_CALLBACKS.timestamp(),
      success: false,
      eventName: "Debug Event",
      enabled: true,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      activeEvents: DEFAULT_VALUE_CALLBACKS.activeEvents(),
      eventCounter: DEFAULT_VALUE_CALLBACKS.eventCounter()
    };
  debug: any;

  constructor(data?: Partial<IDebugEvent>) {
    super(data); 
    Object.assign(this.debugEvent, data?.debugEvent);
    this.updateData();
  }

  updateData() { // Method to update debugEvent
    this.debugEvent.endTime = Date.now();
    this.debugEvent.duration = this.debugEvent.endTime - this.debugEvent.startTime;
  }
}

const FirstEvent = new DebugEvent( {
  mainTypes: [MainEventTypes.BASIC],
  subTypes: [SubEventTypes.BASIC.FIRST],
  message: "First event",
  success: true,
  data: "First event data",
  statsEvent: {
    statsId: 1,
    newValue: 100,
    updatedFields: ["newValue"]
  },
  mainEvent: {
    pid: 100
  },
  serverEvent: {
    timerId: 1,
    startTime: Date.now(),
    endTime: 0,
    duration: 0
  },
  clientsEvent: { id: "", ip: "", clientType: clientI.ClientType.Unknown },
  errorEvent: { errCode: 0, error: new Error("First event error") },
  wsEvent: { message: "First event message", connectionId: "First event connection" },
  debugEvent: { success: true }
});

export type IEventTypes = BaseEvent | DebugEvent;

export interface IEventRoot<T> { [key: string]: T; }
//  getStoredEvent: (event: string) => IEventTypes;
// , getStoredEvent: (event: string) => { return new BaseEvent(); }
export class EventEmitterMixin {
  static stats: { eventCounter: number; activeEvents: number; } = { eventCounter: 0, activeEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, any> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string, eventData: any) {  // Modified parameter
    if (!this._events.has(event)) {
      this._events.set(event, this.generateEventIndex(eventData));
    }
  }

  private generateEventIndex(eventData: any): IEventTypes {
    let eventDataResult: IEventTypes;
    if (typeof eventData === 'object' && eventData as string === typeof MainEventTypes) {
      return eventData as IEventTypes;
    }
    try {
      eventDataResult = this.createEvent(eventData);
      return eventDataResult;
    } catch (error) {
      let eventDataResult: IEventTypes = { mainTypes: [MainEventTypes.ERROR], subTypes: [MainEventTypes.UNKNOWN], success: false, message: 'Fatal: Failed to create event', errorEvent: { errCode: 5, error: new Error("Fatal: Failed to create event"), data: error } };
      if (typeof eventData === 'object') {
        if (typeof eventData.message === 'string') {
          eventDataResult = new BaseEvent({ message: eventData.message });
          return eventDataResult; // Use message as index
        } else {
          return new BaseEvent({ data: JSON.stringify(eventData) }); //  Fallback
        }
      } else if (typeof eventData === 'string') {
        return eventDataResult = new BaseEvent({ message: eventData });
      } else {
        return new BaseEvent({ data: JSON.stringify(eventData) }); // Handle other data types
      }
    }
  }
  private createEvent(event: string, ...args: any[]): IEventTypes {
    let eventResultData: IEventTypes = {mainTypes: [MainEventTypes.ERROR], subTypes: [MainEventTypes.UNKNOWN], success: false, message: '' };
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        console.error(`Invalid event data for event type ${event as string}`);
      }
      const originalEvent = this._events.get(event);
      if (!originalEvent) {

        this.emitError(MainEventTypes.EVENT, new BaseEvent());
        eventResultData.errorEvent = { errCode: 6, data: { event, args } };
        return new BaseEvent( );
      }
      if (args[0] && args[0].debugEvent && args[0].debugEvent.enabled) {
        let debugData;
        if (args[0].debugEvent.debugEvent) {
          args[0].debugEvent.updateData(); // Calculate debug data
          debugData = args[0].debugEvent.debugEvent;
        } else if (!args[0].debugEvent.debugEvent) {
          debugData = {
            subType: MainEventTypes.DEBUG,
            enabled: true,
            eventName: event,
          };
          this._events.set(event, originalEvent); // Replace with a DebugEvent
        } else {
          return { ...originalEvent, debug: debugData } as IEventTypes;
        }
      };
      // Get the stored event (could be BaseEvent for unknown ones) and merge
      return { ...this._events.get(event), ...args[0] };
    } catch (error) {
      this.emitError(MainEventTypes.EVENT, new BaseEvent({mainTypes: [MainEventTypes.ERROR], subTypes: [MainEventTypes.FATAL], message: 'Fatal: Failed to create event', errorEvent: { errCode: 3, data: error } }));
      return new BaseEvent({ data: JSON.stringify(event) })
      }
  }
  private isValidEvent(event: string, eventData: any): boolean {
    switch (event) {
      case SubEventTypes.STATS.ALL_STATS_UPDATED:
        // Check if eventData conforms to StatsEvent interface
        return eventData.statsEvent && typeof eventData.statsEvent.newValue === 'number';
      case SubEventTypes.SERVER.CLIENT_CONNECTED:
      case SubEventTypes.SERVER.CLIENT_DISCONNECTED:
      case SubEventTypes.SERVER.CLIENT_MESSAGE_READY:
      case SubEventTypes.CLIENTS.CLIENT_STATS_UPDATED:
        // Check if eventData conforms to ServerEvent interface
        return eventData.clientId && typeof eventData.clientId === 'string';
      // Add more cases for other event types
      default:
        return true; // Basic validation
    }
  }
  public emitError(event: string, error?: any): void {
    const newEvent: BaseEvent = {
      ...(new BaseEvent({mainTypes: [MainEventTypes.ERROR]}) as BaseEvent),
      errorEvent: {
        errCode: 2, // A sample error code
        error: new Error('Something went wrong'), // A sample error
        data: error
      }
    };
    this._emitter.emit(event as string, newEvent);
  }
  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.emitError(`${MainEventTypes.ERROR}.${MainEventTypes.ERROR}`, errorData); // Emit the error for wider handling
  }

  async on(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents++;
    EventEmitterMixin.stats.eventCounter++;
    const eventData = this.createEvent(event, listener);
    this.storeEvent(event, listener); // Ensure the event is registered
    this._emitter.on(event.toString(), listener);
  }
  async prepend(event: string, listener: (...args: any[]) => void) {
    this.storeEvent(event, listener);
    this._emitter.prependListener(event.toString(), listener); // Use prependListener
  }

  async off(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents--;
    this._emitter.off(event.toString(), listener);
  }

  async emit(event: string, ...args: any[]) {
    const eventData = this.createEvent(event, ...args);
    if (!eventData) {
      return; // Handle event creation failure
    }

    // this._events.push(eventData); // ??
    this._emitter.emit(event.toString(), eventData);
  }

  // Method to process the event queue (you'll need to call this)
}

export class SingletonEventManager extends EventEmitterMixin {
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




