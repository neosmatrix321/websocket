"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";
import { Container } from 'inversify';
export interface IEvent {
  key: EventType;
  // ... other properties
}
export enum EventType {
  BASIC = 'BASIC',
  MAIN = 'MAIN',
  STATS = 'STATS',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  ERROR = 'ERROR',
  EVENT = 'EVENT'
}
export enum MAIN {
  TIMER_CREATED = 'TIMER_CREATED',
  TIMER_STARTED = 'TIMER_STARTED',
  TIMER_STOPPED = 'TIMER_STOPPED',
  START_TIMER = 'START_TIMER',
  STOP_TIMER = 'STOP_TIMER',
  PID_AVAILABLE = 'PID_AVAILABLE',
  // ... add other necessary values
}
export enum SERVER {
  LISTEN = 'LISTEN',
  CLIENT_CONNECTED = 'CLIENT_CONNECTED',
  CLIENT_MESSAGE_READY = 'CLIENT_MESSAGE_READY',
  CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED',
  // ... add other necessary values
}
export enum STATS {
  ALL_STATS_UPDATED = 'ALL_STATS_UPDATED',
  UPDATE_ALL_STATS = 'UPDATE_ALL_STATS',
  PI_STATS_UPDATED = 'PI_STATS_UPDATED',
  UPDATE_PI_STATS = 'UPDATE_PI_STATS',
  PU_STATS_UPDATED = 'PU_STATS_UPDATED',
  UPDATE_PU_STATS = 'UPDATE_PU_STATS',
  OTHER_STATS_UPDATED = 'OTHER_STATS_UPDATED',
  UPDATE_OTHER_STATS = 'UPDATE_OTHER_STATS',
  // ... add other necessary values
}
export enum CLIENTS {
  CREATE = 'CREATE',
  MODIFY = 'MODIFY',
  MODIFIED = 'MODIFIED',
  DELETE = 'DELETE',
  CLIENT_STATS_UPDATED = 'CLIENT_STATS_UPDATED',
  UPDATE_CLIENT_STATS = 'UPDATE_CLIENT_STATS',
  // ... add other necessary values
}
export enum EVENT {
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN',
  STRING = 'STRING',
  SYMBOL = 'SYMBOL',
  OBJECT = 'OBJECT'
  // ... add other necessary values
}

export interface IEvent {
  message: any;
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
  clientEvent?: {
    clientId: string;
    message: string;
  };
  errorEvent?: {
    error: Error;
    errCode: number;
  };
  data?: {
    blob: any;
  };
  success?: boolean;
  timestamp?: number;
}

export type IEventMap = Map<keyof typeof EventType, ((...args: any[]) => void)[]>;
export type EventMap = Map<keyof typeof EventType, IEvent[]>;


export interface IEmptyClass {
  [key: string]: IEvent;
}

const EventEmitterMixin = (BaseClass: new (...args: any[]) => {}) =>
  class extends BaseClass {
    protected _emitter: EventEmitter;
    private _events: Map<keyof typeof EventType, IEvent[]> = new Map();
    private storeEvent(event: IEvent): void {
      let key: EventType = event && typeof event === 'string' ? event : EventType.BASIC;
      if (!this._events.has(key)) {
        key = EventType.BASIC; // Or another appropriate fallback
      }
      this._events.get(key)?.push(event);
    }
    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map(); // Internal Map 
    }


    async on(event: IEmptyClass, listener: (...args: any[]) => void) {
      if (!this._events.has(<keyof typeof EventType>event)) {
        this.storeEvent(event);
      }
      this._events.get(event)?.push(listener);
    }
    async prepend(event: IEmptyClass, listener: (...args: any[]) => void) {
      if (!this._events.has(<keyof typeof EventType>event)) {
        this.storeEvent(event);
      }
      this._events.get(event)?.unshift(listener); // Use unshift to prepend
    }

    async off(event: IEmptyClass, listener: (...args: any[]) => void) {
      if (this._events.has(event)) {
        const listeners = this._events.get(event)?.filter(cb => cb !== listener);
        if (listeners) this._events.set(event, listeners);
      }
    }

    async emit(event: IEmptyClass, ...args: any[]) {
      let emitEvent: EventType;
      if (this._events.has(event) && Array.isArray(this._events.get(event))) {
        await Promise.all(this._events.get(event)!.map(listener => listener(...args)));
      }
    }
  }

export const DefaultIEvent: IEmptyClass = {
   key: {
     "BASIC": {
       mainEvent: { pid: 0 },
       statsEvent: { statsId: 0, newValue: null, oldValue: null, updatedFields: null },
       serverEvent: { timerId: 0, startTime: 0, endTime: 0, duration: 0 },
       clientEvent: { clientId: '', message: '' },
       errorEvent: { error: new Error(), errCode: 0 },
       success: false,
       message: '',
       timestamp: Date.now()
     }
   }
};


export class EmptyClass {
  // EventType: { [key: string]: IEvent } = { "BASIC": DefaultIEvent };
  // constructor() { this.key = { "BASIC": DefaultIEvent }; }
}
export const EVENT_HANDLER_TOKEN = Symbol('eventManager');

const container = new Container();
export const EventHandlerClass = EventEmitterMixin(EmptyClass);
container.bind<typeof EventEmitterMixin>(EVENT_HANDLER_TOKEN).toFactory(() => (...args: unknown[]) => new EventHandlerClass(...args));
