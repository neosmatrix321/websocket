"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";
import * as clientI from "../clients/clientInstance";
import Clients from '../clients/clients';
import Main from '../main';
export const MainEventTypes = {
  DEFAULT: 'DEFAULT',
  BASIC: 'BASIC',
  MAIN: 'MAIN',
  STATS: 'STATS',
  SERVER: 'SERVER',
  CLIENTS: 'CLIENTS',
  CLIENT: 'CLIENT',
  EVENT: 'EVENT',
  STRING: 'STRING',
  SYMBOL: 'SYMBOL',
  OBJECT: 'OBJECT',
  ERROR: 'ERROR',
  GENERIC: 'GENERIC',
  FATAL: 'FATAL',
  UNKNOWN: 'UNKNOWN',
  DEBUG: 'DEBUG',
};

export const SubEventTypes = {
  BASIC: {
    FIRST: 'FIRST',
    LAST: 'LAST',
    DEFAULT: 'DEFAULT'
  },
  MAIN: {
    START_INTERVAL: 'START_INTERVAL',
    STOP_INTERVAL: 'STOP_INTERVAL',
    PID_AVAILABLE: 'PID_AVAILABLE'
  },
  STATS: {
    UPDATE_ALL: 'UPDATE_ALL',
    UPDATE_PI: 'UPDATE_PI',
    UPDATE_PU: 'UPDATE_PU',
    UPDATE_OTHER: 'UPDATE_OTHER'
  },
  SERVER: {
    LISTEN: 'LISTEN'
  },
  CLIENTS: {
    CREATE: 'CREATE',
    MODIFY: 'MODIFY',
    DELETE: 'DELETE',
  },
  CLIENT: {
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    MESSAGE: 'MESSAGE',
    UPDATE_STATS: 'UPDATE_STATS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS'
  },
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
  constructor(data?: Partial<IBaseEvent>) {
    Object.assign(this, data);
  }
}

interface IDebugEvent extends IBaseEvent {
  debugEvent: {
    timestamp?: number;
    success?: boolean;
    eventName?: string;
    enabled: boolean;
    startTime?: number;
    endTime?: number;
    duration?: number;
    activeEvents?: number;
    eventCounter?: number;
  };
}
export class DebugEvent extends BaseEvent implements IDebugEvent {
  debugEvent = {
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

const FirstEvent = new DebugEvent({
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
    pid: -1
  },
  serverEvent: {
    timerId: 1,
    startTime: Date.now(),
    endTime: 0,
    duration: 0
  },
  clientsEvent: { id: "", ip: "", clientType: clientI.ClientType.Unknown },
  errorEvent: { errCode: 0, error: new Error("First event error") },
  debugEvent: { enabled: true }
});

export type IEventTypes = BaseEvent | DebugEvent;

export interface IEventStats {
  eventCounter: number;
  activeEvents: number;
}

export interface IEventManager {
  stats: IEventStats;
}

export class EventEmitterMixin {
  public static stats: IEventStats = { eventCounter: 0, activeEvents: 0 };
  private _emitter: EventEmitter;
  private _validationQueue: Map<string, any> = new Map();
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
  private updateClientInternalStats( ...customData: DebugEvent[] ): IEventTypes {
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
  private createEvent(event: string, ...args: any[]): { customKey: string, customData: IEventTypes } {
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        console.error(`Invalid event data for event type ${event as string}`);
      }
      const originalEvent = this._events.get(event);
      if (!originalEvent) {
        const newData = new BaseEvent({data: JSON.stringify(event)});
        newData.errorEvent = { errCode: 6, data: { event, args } };
        this.emitError(MainEventTypes.EVENT, newData);
        return { customKey: MainEventTypes.ERROR, customData: newData };
      }
      const updatedData = this.updateClientInternalStats(originalEvent);

      // Get the stored event (could be BaseEvent for unknown ones) and merge
      return { ...this._events.get(event), ...updatedData };
    } catch (error) {
      const newData = new BaseEvent({data: JSON.stringify(event)});
      this.emitError(MainEventTypes.EVENT, newData);
      return { customKey: MainEventTypes.ERROR, customData: newData };
    }
  }
  private isValidEvent(event: string, eventData?: any): boolean {
    switch (event) {

      case typeof MainEventTypes:
        return true;
      default:
        const newEvent: BaseEvent = { mainTypes: [MainEventTypes.ERROR], subTypes: [MainEventTypes.FATAL], success: false, message: 'Fatal: Invalid event type', errorEvent: { errCode: 4, data: { event, eventData } } };
        this.emit(MainEventTypes.ERROR, newEvent);
        return false;
    }
  }
  private emitError(event: string, error?: any): void {
    const newEvent: BaseEvent = {
      ...(new BaseEvent({ mainTypes: [MainEventTypes.ERROR] }) as BaseEvent),
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
    this.emitError(`${MainEventTypes.ERROR}.${MainEventTypes.ERROR}`, errorData); // Emit the error for wider handling
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

  // Method to process the event queue (you'll need to call this)
}






