"use strict";

import { EventEmitter } from "events";

export enum catType {
  basic,
  main,
  clients,
  stats,
  server,
  eventManager
}
export interface IBaseEvent {
  cat: catType;
}

// export interface IEventMap {
//   message: string;
//   data?: {
//     errCode: number;
//     message?: string;
//     blob?: any;
//   };
// }

export const EventEmitterMixin = <E extends IBaseEvent>(BaseClass: new (...args: any[]) => {}) =>  
// export const EventEmitterMixin = (BaseClass: new (...args: any[]) => {}) =>
  class extends BaseClass {
    private _defaultCategory: catType = catType.basic; // Default category
    protected _emitter: EventEmitter;
    private _events: Map<catType, ((...args: any[]) => void)[]>;

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map(); // Internal Map 
    }

    async on<K extends keyof E>(event: catType, listener: (...args: E[K][]) => void): Promise<void> {
      if (!this._events.has(event)) {
        this._events.set(event, []); // Initialize an empty array
      }
      this._events.get(event)?.push(listener); // Safe push
    }
    async prepend<K extends keyof E>(event: catType, listener: (...args: E[K][]) => void): Promise<void> {
      console.log("prepend Event ", this._events, event);
      this._events?.get(event)?.push(listener);
    }

    async off<K extends keyof E>(event: catType, listener: (...args: E[K][]) => void): Promise<void> {
      if (this._events.has(event)) {
        const listeners = this._events.get(event)?.filter((cb: (...args: E[K][]) => void) => cb !== listener);
        if (listeners) this._events.set(event, listeners);
      }
    }

    async emit(event: string | symbol | IBaseEvent, ...args: any[]): Promise<void> {
      let emitEvent: IBaseEvent;
    
      if (typeof event === 'string' || typeof event === 'symbol') {        // Treat as unknown type, wrap in basic category
        emitEvent = { cat: this._defaultCategory, type: event, ...args[0] };
      } else {
        emitEvent = { ...event }; // Spread the existing event
        if (!emitEvent.cat) {  // Only add 'cat' if not already present
          emitEvent.cat = this._defaultCategory;
        }
      }
      // Emit logic using 'emitEvent'
      if (this._events.has(emitEvent.cat) && Array.isArray(this._events.get(emitEvent.cat))) {
        await Promise.all(this._events.get(emitEvent.cat)!.map((listener: (...args: any[]) => void) => listener(...args)));      }
    }
  }
