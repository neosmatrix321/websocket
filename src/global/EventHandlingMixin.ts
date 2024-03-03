"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";

export const MainEventTypes = { BASIC: 'BASIC', MAIN: 'MAIN', STATS: 'STATS', SERVER: 'SERVER', CLIENTS: 'CLIENTS', ERROR: 'ERROR', EVENT: 'EVENT', WS: 'WS' };
export const EventTypes = {
  BASIC: { UNKNOWN: 'UNKNOWN', ERROR: 'ERROR', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT', FIRST: 'FIRST' },
  MAIN: { TIMER_CREATED: 'TIMER_CREATED', TIMER_STARTED: 'TIMER_STARTED', TIMER_STOPPED: 'TIMER_STOPPED', START_TIMER: 'START_TIMER', STOP_TIMER: 'STOP_TIMER', PID_AVAILABLE: 'PID_AVAILABLE' },
  STATS: { UPDATE_ALL_STATS: 'UPDATE_ALL_STATS', ALL_STATS_UPDATED: 'ALL_STATS_UPDATED', PI_STATS_UPDATED: 'PI_STATS_UPDATED', UPDATE_PI_STATS: 'UPDATE_PI_STATS', PU_STATS_UPDATED: 'PU_STATS_UPDATED', UPDATE_PU_STATS: 'UPDATE_PU_STATS', OTHER_STATS_UPDATED: 'OTHER_STATS_UPDATED', UPDATE_OTHER_STATS: 'UPDATE_OTHER_STATS' },
  SERVER: { LISTEN: 'LISTEN', CLIENT_CONNECTED: 'CLIENT_CONNECTED', CLIENT_MESSAGE_READY: 'CLIENT_MESSAGE_READY', CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED' },
  CLIENTS: { CREATE: 'CREATE', MODIFY: 'MODIFY', MODIFIED: 'MODIFIED', DELETE: 'DELETE', CLIENT_STATS_UPDATED: 'CLIENT_STATS_UPDATED', UPDATE_CLIENT_STATS: 'UPDATE_CLIENT_STATS' },
  ERROR: { ERROR: 'ERROR', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT' },
  EVENT: { ERROR: 'ERROR', UNKNOWN: 'UNKNOWN', STRING: 'STRING', SYMBOL: 'SYMBOL', OBJECT: 'OBJECT' },
  WS: { CONNECT: 'CONNECT', DISCONNECT: 'DISCONNECT', MESSAGE: 'MESSAGE' }
};

export interface IBaseEvent extends BaseEvent {
  type: string;
  success: boolean;
  message?: string;
  timestamp: number;
  clientName?: string;
  data?: any;
}

export const DEFAULT_VALUE_CALLBACKS = {
  timestamp: () => Date.now(),
  clientName: (clientId: string) => `Client-${clientId}`,
  activeEvents: (() => EventEmitterMixin.stats.activeEvents ),
  eventCounter: (() => {
    return () => {
      return EventEmitterMixin.stats.eventCounter++;
    };
  })(),
  // Add more callback functions here
};

export class BaseEvent {
  constructor(
    public type: string = MainEventTypes.BASIC,
    public subType: string = EventTypes.BASIC.UNKNOWN,
    public data?: any,
    public extras: { activeEvents : number; eventCounter: number; } = { activeEvents: DEFAULT_VALUE_CALLBACKS.activeEvents(), eventCounter: DEFAULT_VALUE_CALLBACKS.eventCounter() },
    public timestamp: number = DEFAULT_VALUE_CALLBACKS.timestamp()) { }
}
export class StatsEvent extends BaseEvent {
  statsEvent: { statsId?: number; newValue?: any; oldValue?: any; updatedFields?: any; } = {};
}

export class MainEvent extends BaseEvent {
  mainEvent: { pid: number; } = { pid: 0 };
}

export class ServerEvent extends BaseEvent {
  serverEvent: { timerId?: number; startTime?: number; endTime?: number; duration?: number; } = {};
}

export class ClientsEvent extends BaseEvent {
  clientsEvent: { clientId: string; message?: string; } = { clientId: '' };
}

export class ErrorEvent extends BaseEvent {
  errorEvent: { error: Error; errCode: number; } = { error: new Error(), errCode: 0 };
}

export class EventEvent extends BaseEvent {
  event?: string;
  data?: any;
}

export class WSEvent extends BaseEvent {
  wsEvent: { connectionId?: string; message?: string; } = {};
}

export type IEvent = BaseEvent | StatsEvent | MainEvent | ServerEvent | ClientsEvent | ErrorEvent | EventEvent | WSEvent;
export interface IEventRoot<T> { [key: string]: T; }
export class FirstEvent extends BaseEvent {
  constructor() {
    super();
    this.StatsEvent = new StatsEvent();
    this.MainEvent = new MainEvent();
    this.ServerEvent = new ServerEvent();
    this.ClientsEvent = new ClientsEvent();
    this.ErrorEvent = new ErrorEvent();
    this.EventEvent = new EventEvent();
    this.WSEvent = new WSEvent();
  }

  StatsEvent: StatsEvent;
  MainEvent: MainEvent;
  ServerEvent: ServerEvent;
  ClientsEvent: ClientsEvent;
  ErrorEvent: ErrorEvent;
  EventEvent: EventEvent;
  WSEvent: WSEvent;
}

export class EventEmitterMixin<IEvent> {
  static stats: { eventCounter: number; activeEvents: number; getStoredEvent: (event: string) => IEvent; } = { eventCounter: 0, activeEvents: 0, getStoredEvent: (event: string) => { return new BaseEvent(); } };
  private _emitter: EventEmitter;
  private _eventQueue: IEvent[] = []; // Using IEvent interface
  private _events: Map<string, IEvent> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string) {
    if (!this._events.has(event)) {
      this._events.set(event, { ...new BaseEvent() }); // Use default values
    }
  }
  public emitError(event: string, error?: any): void {
    const newEvent: ErrorEvent = {
      ...new BaseEvent(MainEventTypes.ERROR, EventTypes.ERROR.ERROR),
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
    this.emitError(`${MainEventTypes.ERROR}.${EventTypes.ERROR.UNKNOWN}`, errorData); // Emit the error for wider handling
  }

  private createEvent(event: string, ...args: any[]): IEvent | null {
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        throw new Error(`Invalid event data for event type ${event as string}`);
      }
      return { ...this._events.get(event), ...args[0] }; // Merge with defaults
    } catch (error) {
      console.error('Failed to create event:', event, error);
      return null;
    }
  }
  private isValidEvent(event: string, eventData: any): boolean {
    switch (event) {
      case EventTypes.STATS.ALL_STATS_UPDATED:
        // Check if eventData conforms to StatsEvent interface
        return eventData.statsEvent && typeof eventData.statsEvent.newValue === 'number';
      case EventTypes.SERVER.CLIENT_CONNECTED:
      case EventTypes.SERVER.CLIENT_DISCONNECTED:
      case EventTypes.SERVER.CLIENT_MESSAGE_READY:
      case EventTypes.CLIENTS.CLIENT_STATS_UPDATED:
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

    this._eventQueue.push(eventData);
    this._emitter.emit(event.toString(), eventData);
  }

  // Method to process the event queue (you'll need to call this)
  processEventQueue() {
    while (this._eventQueue.length > 0) {
      const eventData = this._eventQueue.shift();
      // Handle the event, potentially based on its type
      console.log("Processing event:", eventData);
    }
  }
}

export class SingletonEventManager extends EventEmitterMixin<IEvent> {
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




