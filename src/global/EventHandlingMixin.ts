"use strict";

import { EventEmitter } from "events";
import * as eM from "./EventHandlingManager";
import * as statsC from "../stats/stats";
import * as clientsC from "../clients/clients";
import * as serverC from "../server/server";
import * as mainC from "../main";

export enum catType {
  basic,
  main,
  clients,
  stats,
  server,
  eventManager
}

export interface IEventMap {
  cat: catType;
  message?: string | symbol;
  type?: eM.eMType | statsC.statsType | clientsC.clientsType | serverC.serverType | mainC.MainType;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}

export const EventEmitterMixin = <E extends Partial<IEventMap>>(BaseClass: new (...args: any[]) => {}) =>
  class extends BaseClass {
    private _defaultCategory: catType = catType.basic; // Default category
    protected _emitter: EventEmitter;
    private _events: Map<any, ((...args: E[]) => void)[]>;

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
      this._events = new Map(); // Internal Map 
    }

    async on<E extends Partial<E>>(event: catType | string | symbol, listener: (...args: Partial<IEventMap>[]) => void): Promise<void> {
      if (!this._events.has(event)) {
        this._events.set(event, []);
      }
      this._events.get(event)?.push(listener);
    } 
    async prepend<E extends Partial<E>>(event: catType | string | symbol, listener: (...args: Partial<IEventMap>[]) => void): Promise<void> {
      console.log("prepend Event ", this._events, event);
      this._events?.get(event)?.push(listener);
    }

    async off(event: catType | string | symbol, listener: (...args: Partial<IEventMap>[]) => void): Promise<void> {
      if (this._events.has(event)) {
        const listeners = this._events.get(event)?.filter((cb: (...args: E[]) => void) => cb !== listener);
        if (listeners) this._events.set(event, listeners);
      }
    }

    async emit<E extends Partial<E>>(event: catType | string | symbol, ...args: Partial<IEventMap>[]): Promise<void> {
      let emitEvent: IEventMap;

      if (typeof event === 'object' && !('cat' in event)) {
        emitEvent = { cat: this._defaultCategory, ...args[0] };
      } else if (typeof event === 'string' || typeof event === 'symbol') {
        emitEvent = { cat: this._defaultCategory, ...args[0] };
      } else {
        emitEvent = { cat: event, ...args[0] };
      }
      if (this._events.has(emitEvent) && Array.isArray(this._events.get(emitEvent))) {
        await Promise.all(this._events.get(emitEvent)!.map((listener: (...args: any[]) => void) => listener(...args)));
      }
    }
  }
