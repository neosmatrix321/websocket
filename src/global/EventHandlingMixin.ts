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


export const DefaultIEvent: IEmptyClass = {
  "EVENT": {
    type: "UNKNOWN",
    success: false,
    message: 'Where am I?',
    timestamp: Date.now()
  }
};

export const FirstIEvent: IEmptyClass = {
  "BASIC": {
    success: false,
    message: '',
    type: "UNKNOWN",
    timestamp: Date.now(),
    mainEvent: { pid: 0 },
    statsEvent: { statsId: 0, newValue: null, oldValue: null, updatedFields: null },
    serverEvent: { timerId: 0, startTime: 0, endTime: 0, duration: 0 },
    clientsEvent: { clientId: '', message: '' },
    errorEvent: { error: new Error(), errCode: 0 }
  }
}
export interface IEvent {
  message: string;
  type: MAIN | SERVER | STATS | CLIENTS | EVENT | ERROR | BASIC;
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
export type IEventMap = Map<EventType, ((...args: any[]) => void)[]>;
export type EventMap = Map<EventType, IEvent[]>;

export interface IEventRoot extends IEvent {
  [key in EventTypes]: IEvent | any[];
}

export class IEmptyClass implements IEventRoot {
  "BASIC": IEvent = {
    type: "UNKNOWN",
    success: false,
    message: 'Where am I?',
    timestamp: Date.now()
  }
}
export const EventEmitterMixin = <T extends IEventRoot>(BaseClass: new (...args: any[]) => {}) => class extends BaseClass {
  protected _emitter: EventEmitter;
  private _events: Map<EventType, IEvent> = new Map();
  private _listeners: Map<EventType, ((...args: any[]) => void)[]> = new Map();
  private storeEvent(event: IEventRoot): void {
    let key: EventType = "EVENT"; // Default key

    // Check if the event has a key that matches an EventType
    for (let potentialKey in event) {
      if (Object.values(<EventType>).includes(potentialKey)) {
        key = potentialKey as EventType;
        break;
      }
    }

    const formattedEvent: IEventRoot = {
      key: event[key] || DefaultIEvent[key], // Use the event's value if it exists, otherwise use the default
    };

    this._events.set(key, formattedEvent);
  }

  constructor(...args: any[]) {
    super(...args);
    this._emitter = new EventEmitter();
    this._events = new Map(); // Internal Map 
    this._listeners = new Map(); // Map for listeners
  }
  async on(event: EventType, listener: (...args: any[]) => void) {
    const eventKey: EventType = event;
    if (!this._events.has(eventKey)) {
      switch (true) {
        case typeof event === 'string':
          this.storeEvent(FirstIEvent);
          break;
        case typeof event === 'object':
          this.storeEvent({ key: { "EVENT": event } });
          break;
        default:
          this.storeEvent(DefaultIEvent as IEventRoot);
          break;
      }
      if (typeof event === 'object' && !('type' in event)) event = { type: "OBJECT", success: false, message: '', timestamp: Date.now(), data: { blob: event } };
      const newEvent: IEventRoot = { key: { "EVENT": event } };
      this.storeEvent(newEvent);
    }

    if (!this._listeners.has(eventKey)) {
      this._listeners.set(eventKey, []);
    }
    this._listeners.get(eventKey)?.push(listener);
  }
  async prepend(event: EventType, listener: (...args: any[]) => void) {
    if (!this._events.has(event)) {
      this.storeEvent(event);
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)?.unshift(listener);
  }
  async off(event: EventType, listener: (...args: any[]) => void) {
    if (this._listeners.has(event)) {
      const listeners = this._listeners.get(event)?.filter(cb => cb !== listener);
      if (listeners) this._listeners.set(event, listeners);
    }
  }
  async emit(event: EventType, ...args: any[]) {
    if (this._events.has(event) && Array.isArray(this._events.get(event))) {
      if (this._events.has(event)) {
        switch (event) {
          case "SERVER":
            // const serverEvent = args[0] as IServerConnectedEvent;
            break;
          // ... other cases
        }
        const storedEvent: IEvent = this._events.get(event) as IEvent;;
        if (this._listeners.has(event)) {
          await Promise.all(this._listeners.get(event)!.map(listener => listener(storedEvent)));
        }
      }
    }
  }
}

export class SingletonEmitter {
  private static instance: any;

  public static getInstance<T extends IEventRoot>(BaseClass: new (...args: any[]) => {}): any {
    if (!SingletonEmitter.instance) {
      const MixinClass = EventEmitterMixin<T>(BaseClass);
      SingletonEmitter.instance = new MixinClass();
    }
    return SingletonEmitter.instance;
  }
}

export class EventClass extends EventEmitterMixin<IEventRoot>(IEmptyClass) {
  "EVENT": IEvent = {
    success: false,
    message: 'Where am I?',
    type: "UNKNOWN",
    timestamp: Date.now()
  }

  constructor(event: IEventRoot) {
    super();
    // Check if the event has the expected structure
    if (!this.isValidEvent(event)) {
      // If not, set the event to the default event
      this["EVENT"] = DefaultIEvent["EVENT"];
      // } else {
      //   // If it is valid, use the provided event
      //   this[event.key] = event.key[EventType];
    }
  }

  private isValidEvent(event: IEventRoot): boolean {
    // Add your validation logic here
    // For example, check if the event has a certain property
    return event && event ? Object.values(event).includes(event as unknown as EventType) : false;
  }

}
// Define a marker to use with Inversify
export const EVENT_MANAGER_FACTORY_TOKEN = Symbol('EventManager');

export class EmptyClass {
  // event: { [key: string]: IEvent } = { "BASIC": DefaultIEvent };
  // constructor() { this.key = { "BASIC": DefaultIEvent }; }
}


