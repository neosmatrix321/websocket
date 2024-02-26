"use strict";
import { EventEmitterMixin } from "../global/globalEventHandling";
import uniqueClient from "./client/manageClient";
import updateClientStats from "./client/updateClient";


class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();

export default class Clients extends EventEmitterMixin(Object) {
  _clients: Record<string, uniqueClient> = {}; // Clients dictionary
  _client: uniqueClient | undefined; // Optional client property

  constructor() {
    super();
    this._clients = undefined;  // Initialize if needed
  }

  addClient(id: string, settings: any) { // Adjust 'any' type later
    const newUniqueClient = new uniqueClient(id, settings, this); // Pass 'this' for reference
    this._clients[id] = newUniqueClient; // Use index notation
    globalEventEmitter.emit("addClient", id); 
  }

  updateClientStats(id: string) {
    const newClientStats = new updateClientStats(this._clients[id]); // Get client by id
    this._clients[id].stats = newClientStats.getClientLatency(); // Assume getClientLatency returns stats
    globalEventEmitter.emit("updateClientStats", id);
  }

  updateClient(id: string, settings: any) { // Replace 'any' later
    const client = this._clients[id];
    if (client) {
      client.updateSettings(settings); // Use existing method
      globalEventEmitter.emit("updateClient", id);
    } 
  }

  removeClient(id: string) {
    globalStats.getInstance().stats.connectedClients--; 
    delete this._clients[id]; 
    globalEventEmitter.emit("removeClient", id);
  }
  public static getInstance(): Clients {
    if (!Clients.instance) {
      Clients.instance = new Clients();
    }
    return Clients.instance;
  }
}
export const ClientsInstance = Clients.getInstance();

