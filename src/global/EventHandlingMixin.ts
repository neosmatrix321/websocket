"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";

export type EventType = 'BASIC' | 'MAIN' | 'STATS' | 'SERVER' | 'CLIENTS' | 'ERROR' | 'EVENT';
export type MAIN = 'TIMER_CREATED' | 'TIMER_STARTED' | 'TIMER_STOPPED' | 'START_TIMER' | 'STOP_TIMER' | 'PID_AVAILABLE';
export type SERVER = 'LISTEN' | 'CLIENT_CONNECTED' | 'CLIENT_MESSAGE_READY' | 'CLIENT_DISCONNECTED';
export type STATS = 'ALL_STATS_UPDATED' | 'UPDATE_ALL_STATS' | 'PI_STATS_UPDATED' | 'UPDATE_PI_STATS' | 'PU_STATS_UPDATED' | 'UPDATE_PU_STATS' | 'OTHER_STATS_UPDATED' | 'UPDATE_OTHER_STATS';
export type CLIENTS = 'CREATE' | 'MODIFY' | 'MODIFIED' | 'DELETE' | 'CLIENT_STATS_UPDATED' | 'UPDATE_CLIENT_STATS';
export type EVENT = 'ERROR' | 'UNKNOWN' | 'STRING' | 'SYMBOL' | 'OBJECT';
export type ERROR = 'ERROR' | 'UNKNOWN' | 'STRING' | 'SYMBOL' | 'OBJECT';
export type BASIC = 'ERROR' | 'UNKNOWN' | 'STRING' | 'SYMBOL' | 'OBJECT';
export enum EventTypes {
  BASIC = 'BASIC',
  MAIN = 'MAIN',
  STATS = 'STATS',
  SERVER = 'SERVER',
  CLIENTS = 'CLIENTS',
  ERROR = 'ERROR',
  EVENT = 'EVENT'
}
export enum SubEventTypes {
  TIMER_CREATED = 'TIMER_CREATED',
  TIMER_STARTED = 'TIMER_STARTED',
  TIMER_STOPPED = 'TIMER_STOPPED',
  START_TIMER = 'START_TIMER',
  STOP_TIMER = 'STOP_TIMER',
  PID_AVAILABLE = 'PID_AVAILABLE',
  LISTEN = 'LISTEN',
  CLIENT_CONNECTED = 'CLIENT_CONNECTED',
  CLIENT_MESSAGE_READY = 'CLIENT_MESSAGE_READY',
  CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED',
  ALL_STATS_UPDATED = 'ALL_STATS_UPDATED',
  UPDATE_ALL_STATS = 'UPDATE_ALL_STATS',
  PI_STATS_UPDATED = 'PI_STATS_UPDATED',
  UPDATE_PI_STATS = 'UPDATE_PI_STATS',
  PU_STATS_UPDATED = 'PU_STATS_UPDATED',
  UPDATE_PU_STATS = 'UPDATE_PU_STATS',
  OTHER_STATS_UPDATED = 'OTHER_STATS_UPDATED',
  UPDATE_OTHER_STATS = 'UPDATE_OTHER_STATS',
  CREATE = 'CREATE',
  MODIFY = 'MODIFY',
  MODIFIED = 'MODIFIED',
  DELETE = 'DELETE',
  CLIENT_STATS_UPDATED = 'CLIENT_STATS_UPDATED',
  UPDATE_CLIENT_STATS = 'UPDATE_CLIENT_STATS',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN',
  STRING = 'STRING',
  SYMBOL = 'SYMBOL',
  OBJECT = 'OBJECT',
  connection = 'connection',
}

export interface IEvent {
  message: string;
  type: SubEventTypes;
  success: boolean;
  timestamp: number;
  mainEvent?: {
    pid: number;
  };
  statsEvent?: {
    statsId: number;
    newValue: any;
    oldValue: any;
    updatedFields: any;
  };
  serverEvent?: {
    timerId: number;
    startTime: number;
    endTime: number;
    duration: number;
  };
  clientsEvent?: {
    clientId: string;
    message: string;
  };
  errorEvent?: {
    error: Error;
    errCode: number;
  };
  data?: any;
}
type EventKeys<T> = {
  [key in EventTypes]?: T extends IEvent ? T : never; // Mark keys as optional
};

export interface IEventRoot<T> extends EventKeys<T> { }
export class IEmptyClass implements IEventRoot<IEvent> {
  [EventTypes.EVENT]: IEvent = {
    success: false,
    message: 'Where am I?',
    type: SubEventTypes.UNKNOWN,
    timestamp: Date.now()
  }
}
export class EmptyClass implements IEventRoot<IEvent> {
  // event: { [key: string]: IEvent } = { "BASIC": DefaultIEvent };
  // constructor() { this.key = { "BASIC": DefaultIEvent }; }
}

export const DefaultIEvent: IEventRoot<IEvent> = {
  [EventTypes.BASIC]: {
    type: SubEventTypes.UNKNOWN,
    success: false,
    message: 'Where am I?',
    timestamp: Date.now()
  }
};

export const FirstIEvent: IEventRoot<IEvent> = {
  [EventTypes.BASIC]: {
    success: false,
    message: '',
    type: SubEventTypes.UNKNOWN,
    timestamp: Date.now(),
    mainEvent: { pid: 0 },
    statsEvent: { statsId: 0, newValue: null, oldValue: null, updatedFields: null },
    serverEvent: { timerId: 0, startTime: 0, endTime: 0, duration: 0 },
    clientsEvent: { clientId: '', message: '' },
    errorEvent: { error: new Error(), errCode: 0 }
  }
}
export type IEventMap = Map<EventType, ((...args: any[]) => void)[]>;
export type EventMap = Map<EventType, IEvent[]>;



export const EventEmitterMixin = <T extends IEventRoot<IEvent>>(BaseClass: new (...args: any[]) => {}) => class extends BaseClass {
      protected _emitter: EventEmitter;
    private _events: Map<keyof T, IEvent> = new Map<keyof T, IEvent>();
    private _listeners: Map<keyof T, ((...args: any[]) => void)[]> = new Map();

    private storeEvent(event: keyof T): void {
      if (this._events.has(event)) {
        return;
      }

      const defaultEvent: IEvent = {
        success: false,
        message: 'Default event',
        type: SubEventTypes.UNKNOWN,
        timestamp: Date.now(),
        data: event
      };

      this._events.set(event, defaultEvent);
    }

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map(); // Internal Map 
      this._listeners = new Map(); // Map for listeners
    }

    async on(event: keyof T, listener: (...args: any[]) => void) {
      this.storeEvent(event);
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event)?.push(listener);
    }

    async prepend(event: keyof T, listener: (...args: any[]) => void) {
      this.storeEvent(event);
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event)?.unshift(listener);
    }

    async off(event: keyof T, listener: (...args: any[]) => void) {
      if (this._listeners.has(event)) {
        const listeners = this._listeners.get(event)?.filter(cb => cb !== listener);
        if (listeners) this._listeners.set(event, listeners);
      }
    }

    async emit(event: keyof T, ...args: any[]) {
      if (this._events.has(event)) {
        const storedEvent: IEvent | undefined = this._events.get(event);
        if (!storedEvent) {
          return;
        }
        if (this._listeners.has(event)) {
          await Promise.all(this._listeners.get(event)!.map(listener => listener(storedEvent)));
        }
      }
    }
  }
export class SingletonEmitter {
  private static instance: any;

  public static getInstance<T extends IEventRoot<IEvent>>(BaseClass: new (...args: any[]) => T): T { 
    if (!SingletonEmitter.instance) {
      const MixinClass = EventEmitterMixin(BaseClass);
      SingletonEmitter.instance = new MixinClass();
    }
    return SingletonEmitter.instance;
  }
}

export class EventClass extends EventEmitterMixin<IEventRoot<IEvent>>(EmptyClass) {
  [EventTypes.EVENT]: IEvent = {
    success: false,
    message: 'Where am I?',
    type: SubEventTypes.UNKNOWN,
    timestamp: Date.now(),
  }

  constructor(event: IEventRoot<IEvent>) {
    super();
    const eventKey: keyof IEventRoot<IEvent> = EventTypes.EVENT;
    let eventValue: IEventRoot<IEvent> = event
    // Check if the event has the expected structure
    if (!this.isValidEvent(event)) {
      // If not, set the event to the default event
      eventValue = { ...DefaultIEvent };
      this[EventTypes.EVENT].data = event;
      // } else {
      //   // If it is valid, use the provided event3we24
      //   this[event.key] = event.key[EventType];
    }
    return this;
  }

  private isValidEvent(event: IEventRoot<IEvent>): boolean {
    console.log("Event: ", event); // Inspect the event object
    console.log("EventTypes: ", EventTypes); // Check if EventTypes is accessible 
    if (event.hasOwnProperty(typeof EventTypes)) {
    // Your refined validation logic:
      return true; // Event has at least one validEventType key
    }

    return false; // No valid EventType found 
  }
}
// Define a marker to use with Inversify
export const EVENT_MANAGER_FACTORY_TOKEN = Symbol('EventManager');




