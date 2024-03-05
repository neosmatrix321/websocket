"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";

export const MainEventTypes = { BASIC: 'BASIC', MAIN: 'MAIN', STATS: 'STATS', SERVER: 'SERVER', CLIENTS: 'CLIENTS', ERROR: 'ERROR', EVENT: 'EVENT', WS: 'WS', DEBUG: 'DEBUG', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT', TIMER: 'TIMER' };

export const SubEventTypes = {
  BASIC: { FIRST: 'FIRST', LAST: 'LAST' },
  MAIN: { TIMER_CREATED: 'TIMER_CREATED', TIMER_STARTED: 'TIMER_STARTED', TIMER_STOPPED: 'TIMER_STOPPED', START_TIMER: 'START_TIMER', STOP_TIMER: 'STOP_TIMER', PID_AVAILABLE: 'PID_AVAILABLE' },
  STATS: { UPDATE_ALL_STATS: 'UPDATE_ALL_STATS', ALL_STATS_UPDATED: 'ALL_STATS_UPDATED', PI_STATS_UPDATED: 'PI_STATS_UPDATED', UPDATE_PI_STATS: 'UPDATE_PI_STATS', PU_STATS_UPDATED: 'PU_STATS_UPDATED', UPDATE_PU_STATS: 'UPDATE_PU_STATS', OTHER_STATS_UPDATED: 'OTHER_STATS_UPDATED', UPDATE_OTHER_STATS: 'UPDATE_OTHER_STATS' },
  SERVER: { LISTEN: 'LISTEN', CLIENT_CONNECTED: 'CLIENT_CONNECTED', CLIENT_MESSAGE_READY: 'CLIENT_MESSAGE_READY', CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED' },
  CLIENTS: { CREATE: 'CREATE', MODIFY: 'MODIFY', MODIFIED: 'MODIFIED', DELETE: 'DELETE', CLIENT_STATS_UPDATED: 'CLIENT_STATS_UPDATED', UPDATE_CLIENT_STATS: 'UPDATE_CLIENT_STATS' },
  ERROR: { ERROR: 'ERROR', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT' },
  EVENT: { ERROR: 'ERROR', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT' },
  WS: { CONNECT: 'CONNECT', DISCONNECT: 'DISCONNECT', MESSAGE: 'MESSAGE' }
};
export const DEFAULT_VALUE_CALLBACKS = {
  timestamp: () => Date.now(),
  clientName: (clientId: string) => `Client-${clientId}`,
  activeEvents: (() => EventEmitterMixin.stats.activeEvents),
  eventCounter: (() => EventEmitterMixin.stats.eventCounter++)
};

export interface IBaseEvent {
  type?: string = MainEventTypes.BASIC;
  success?: boolean = true;
  message?: string = "";
  data?: any;
  statsEvent?: { subType: string, statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any };
  mainEvent?: { subType: string, pid?: number };
  serverEvent?: { subType: string, timerId?: number, startTime?: number, endTime?: number, duration?: number };
  clientsEvent?: { subType: string, clientId?: string, message?: string };
  errorEvent?: { subType: string, error?: Error, errCode?: number };
  wsEvent?: { subType: string, message?: string, connectionId?: string };
}

export class BaseEvent implements IBaseEvent {
  constructor(
    _type?: string = MainEventTypes.BASIC,
    _success?: boolean = true,
    _message?: string = "",
    _data?: any,
    _statsEvent?: { subType: string, statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any },
    _mainEvent?: { subType: string, pid?: number },
    _serverEvent?: { subType: string, timerId?: number, startTime?: number, endTime?: number, duration?: number },
    _clientsEvent?: { subType: string, clientId?: string, message?: string },
    _errorEvent?: { subType: string, error?: Error, errCode?: number },
    _wsEvent?: { subType: string, message?: string, connectionId?: string },
  ) {
  }
}

export class DebugEvent extends BaseEvent {
  public debugEvent: { subType: string, timestamp: number, success: boolean, eventName: ?string, enabled: boolean, startTime: number, endTime: number, duration: number, activeEvents: number, eventCounter: number } = {
    subType!: MainEventTypes.DEBUG,
    timestamp!: DEFAULT_VALUE_CALLBACKS.timestamp(),
    success!: false,
    eventName!: "Debug Event",
    enabled!: true,
    startTime!: Date.now(),
    endTime!: 0,
    duration!: 0,
    activeEvents!: DEFAULT_VALUE_CALLBACKS.activeEvents(),
    eventCounter!: DEFAULT_VALUE_CALLBACKS.eventCounter()
  };

  constructor() {
    super(MainEventTypes.DEBUG);
    this.updateData();
  }
  updateData() { // Method to update debugEvent
    this.debugEvent.endTime = Date.now();
    this.debugEvent.duration = this.debugEvent.endTime - this.debugEvent.startTime;
  }
}

export type IEventTypes = BaseEvent | DebugEvent;

export interface IEventRoot<T> { [key: string]: T; }
//  getStoredEvent: (event: string) => IEventTypes;
// , getStoredEvent: (event: string) => { return new BaseEvent(); }
export class EventEmitterMixin<IEventTypes> {
  static stats: { eventCounter: number; activeEvents: number; } = { eventCounter: 0, activeEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, IEventTypes> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string) {
    if (!this._events.has(event)) {
      const SpecializedEvent = this.getSpecializedEventConstructor(event);

      // Create a BaseEvent to wrap the unknown event type
      this._events.set(event, SpecializedEvent
        ? new SpecializedEvent(event)
        : new BaseEvent(MainEventTypes.UNKNOWN, ['success': false, message: "Unknown Event", 'data': event])
      );
    }
  }
  private getSpecializedEventConstructor(event: string): { new(event: string): BaseEvent } | null {
    switch (true) {
      case (event == typeof MainEventTypes):
        return null;
      case (event === "string"):
      case (event === "object"):
        return `${event as string}`;
      default:
        return null;
    }
  }
  private createEvent(event: string, ...args: any[]): IEventTypes | null {
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        console.error(`Invalid event data for event type ${event as string}`);
      }
      const originalEvent = this._events.get(event);
      if (!originalEvent) {
        console.error('Event not found:', event);
        return null;
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
        } else 
        return { ...originalEvent, debug: debugData } as IEventTypes;
      };
      // Get the stored event (could be BaseEvent for unknown ones) and merge
      return { ...this._events.get(event), ...args[0] };
    } catch (error) {
      console.error('Failed to create event:', event, error);
      return null;
    }
  }
  public emitError(event: string, error?: any): void {
    const newEvent: ErrorEvent = {
      ...(new BaseEvent(MainEventTypes.ERROR) as ErrorEvent),
      errorEvent: {
        error: new Error('Something went wrong'), // A sample error
        errCode: 1001 // A sample error code
      }
    };
    this.emit(event as string, newEvent);
  }
  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.emitError(`${MainEventTypes.ERROR}.${MainEventTypes.ERROR}`, errorData); // Emit the error for wider handling
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
  async on(event: string, listener: (...args: any[]) => void) {
    this.storeEvent(event); // Ensure the event is registered
    EventEmitterMixin.stats.activeEvents++;
    EventEmitterMixin.stats.eventCounter++;
    if (args[0] && args[0].debug && args[0].debug.enabled) {
      this._emitter.on(event.toString(), listener);
    }

  async prepend(event: string, listener: (...args: any[]) => void) {
      this.storeEvent(event);
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

export class SingletonEventManager extends EventEmitterMixin<IEventTypes> {
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




