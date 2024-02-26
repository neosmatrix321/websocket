"use strict";

import { EventEmitter } from "events";
// import { Event } from "undici-types/patch";

// interface EventMap { // Interface für deine erwarteten Events definieren
//   connection: [WebSocket];
//   message: [string];
//   [event: string]: any[]; // Event-Name als Key, erwartetes Array für Argumente
//   <T>(event: string, data: T): void; // Generisches Event mit Typisierung
// }
/* TODO
type Event = 
| { type: 'connection', payload: WebSocket } 
| { type: 'message', payload: string };
Base Event: Consider having a base event interface:

TypeScript
interface BaseEvent {
    type: string; // Or an enum for more structured types
}
Verwende den Code mit Vorsicht.
Specific Event Interfaces:  Extend the base interface for specific events:

TypeScript
interface ConnectionEvent extends BaseEvent {
    type: 'connection';
    data: WebSocket; 
}
Verwende den Code mit Vorsicht.
Updated Event Map:

TypeScript
*/
interface EventMap {
  _events: Map<string, Map<any, any>>;  // ...other specific events
}

export const EventEmitterMixin = <T extends new (...args: any[]) => {}>(BaseClass: T) =>
  class extends BaseClass {
    protected _emitter: EventEmitter;
    private _events: Map<string, ((...args: any[]) => void)[]> = new Map(); // Internal Map ;

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map([]); // Internal Map 
    }

    async on<K extends keyof EventMap>(event: string, listener: (...args: EventMap[K][]) => void): Promise<void> {
      if (!this._events.has(event)) {
        this._events.set(event, []);
      }
      this._events?.get(event)?.push(listener); 
    }

    async prepend<K extends string & keyof EventMap>(event: string, listener: (...args: EventMap[K][]) => void): Promise<void> {
      console.log("prepend Event ", this._events, event);
      this._events?.get(event)?.push(listener); 
    }

    async off<K extends string & keyof EventMap>(event: string, listener: (...args: EventMap[K][]) => void): Promise<void> {
      if (this._events.has(event)) {
        const listeners = this._events?.get(event)?.filter(cb => cb !== listener);
        if (listeners) this._events.set(event, listeners);
      }
    }

    async emit<K extends string & keyof EventMap>(event: string, ...args: EventMap[K][]): Promise<void> {
      if (this._events.has(event) && Array.isArray(this._events.get(event))) { // Enhanced check
        await Promise.all(this._events.get(event)!.map(listener => listener(...args))); // Confident use! 
      }
    }
    async emitCustomEvent(event: any, ...args: any[]) {
      this.emit(event, ...args);
    }
  }


