"use strict";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "../global/globalEventHandling";
import { IClient, clientWrapper } from "./client/clientInstance";

export const CLIENTS_WRAPPER_TOKEN = Symbol('Clients');

class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();

@injectable()
export default class Clients extends EventEmitterMixin(Object) {
  _clients: Record<string, IClient> = {}; // Clients dictionary

  constructor(@inject(CLIENTS_WRAPPER_TOKEN) statsInstance: Record<string, IClient>) {
    super();
    this._clients = {};  // Initialize if needed
  }

  addClient(id: string, ip: string) { // Adjust 'any' type later
    this._clients[id] = clientWrapper.create(id, ip); // Use index notation
    globalEventEmitter.emit("addClient " + id + " ip: "+ ip); 
  }

  updateClientStats(id: string) {
    this._clients[id].stats = this._clients[id].getClientLatency(); // Assume getClientLatency returns stats
    globalEventEmitter.emit("updateClientStats" + id);
  }

  updateClient(id: string, settings: any) { // Replace 'any' later
    const client = this._clients[id];
    if (client) {
      client.updateSettings(settings); // Use existing method
      globalEventEmitter.emit("updateClient" + id);
    } 
  }

  removeClient(id: string) {
    delete this._clients[id]; 
    globalEventEmitter.emit("removeClient" + id);
  }
}


