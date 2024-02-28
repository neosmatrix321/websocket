"use strict";

import { EventEmitter } from "events";

export enum catType {
  basic,
  clients,
  stats,
  server,
  eventManager
}

export interface IBaseEvent {
  cat: catType;
}

export interface IEventMap {
  type: any;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}

/* stats interface
export enum statsType {
  update,
  timerCreated,
  timerStarted,
  timerStopped  
}

export interface IStatsEvent extends IEventMap {
  type: statsType;
  message: string;
  data: {
    result: boolean;
    error?: IClientError;
  };
} */

export const EventEmitterMixin = <E extends IEventMap>(BaseClass: new (...args: any[]) => {}) =>   
      class extends BaseClass {
    protected _emitter: EventEmitter;
    private _events: Map<string, any> = new Map();

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map([]); // Internal Map 
    }

    async on<K extends keyof E>(event: string, listener: (...args: E[K][]) => void): Promise<void> {
      if (!this._events.has(event)) {
        this._events.set(event, []);
      } else {
        this._events.get(event).push(listener); 
      }
    }

    async prepend<K extends keyof E>(event: string, listener: (...args: E[K][]) => void): Promise<void> {
      console.log("prepend Event ", this._events, event);
      this._events?.get(event)?.push(listener); 
    }

    async off<K extends keyof E>(event: string, listener: (...args: E[K][]) => void): Promise<void> {
      if (this._events.has(event)) {
        const listeners = this._events.get(event).filter((cb: (...args: E[K][]) => void) => cb !== listener);
        if (listeners) this._events.set(event, listeners);
      }
    }

    async emit<K extends string & keyof IEventMap>(event: string, ...args: IEventMap[K][]): Promise<void> {
      if (this._events.has(event) && Array.isArray(this._events.get(event))) { // Enhanced check
        await Promise.all(this._events.get(event)!.map((listener: (...args: E[K][]) => void) => listener(...args)));
    }
  }
}
