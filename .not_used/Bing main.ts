import { EventEmitter } from "events";
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { Inject, Injectable } from "./Injectable";
import { IMainService, MAIN_SERVICE_TOKEN } from "./interfaces";
import { PRIVATE_SETTINGS_TOKEN, IPrivateSettings } from "./private/settingsInstance";
import { GLOBAL_VALUES_TOKEN, IGlobalValues } from "./global/statsInstance";
import { SERVER_VALUES_TOKEN, IServerWrapper, IHandle } from "./server/serverInstance";
import { CLIENTS_TOKEN, IClients } from "./clients/clientsInstance";

interface EventMap {
  connection: [WebSocket];
  message: [string];
  [event: string]: any[];
}

const EventEmitterMixin = <T extends new (...args: any[]) => {}>(BaseClass: T) =>
  class extends BaseClass {
    protected _emitter: EventEmitter;
    private _events: EventMap;

    constructor(...args: any[]) {
      super(...args);
      this._emitter = new EventEmitter();
    }

    async on<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): Promise<void> {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      this._events[event].push(listener);
      console.log("on Event " + this._events.length, event);
    }

    async prepend<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): Promise<void> {
      console.log("prepend Event " + this._events.length, event);
      this._events[event].push(listener);
    }

    async emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): Promise<void> {
      if (this._events[event]) {
        console.log("emit Event " + this._events.length, event);
        this._events[event].forEach((listener) => listener(...args));
      }
    }

    async off<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void):Promise<void> {
      console.log('event gone?:');
      this._events[event].push(listener);
    }

    async emitCustomEvent(event: any, ...args: any[]) {
      this.emit(event, ...args);
    }
  }

@Injectable()
export default class Main extends EventEmitterMixin(Object) implements IMainService {
  @Inject(GLOBAL_VALUES_TOKEN) public stats: IGlobalValues;
  @Inject(SERVER_VALUES_TOKEN) public server: IServerWrapper;
  @Inject(PRIVATE_SETTINGS_TOKEN) public settings: IPrivateSettings;
  @Inject(CLIENTS_TOKEN) public clients: IClients;

  constructor() {
    super();
    this.initServer();
    this.on('clientConnected', this.startInterval.bind(this));
  }

  async initServer() {
    this.updateStats("initServer");
    this.createServer();
  }

  async createServer() {
    this.server.handle.web.create().then(() => {
      this.on('connection', this.handleConnection.bind(this));
    });
  }

  async handleConnection(ws: any) {
    this.updateStats(ws);
    this.manageClient(ws);
    this.setupWebSocketEvents(ws);
  }

  async manageClient(ws: any) {
    if (!this.clients[ws.id]) {
      this.clients.addClient(this.stats.clientsCounter, { "ip": ws.ip }).then(() => {
        this.emit('clientConnected', ws);
        ws.id = this.clients.id;
        ws.ip = ws.socket.remoteAddress;
      }).catch(() => {
        console.error(`Could not create Client with ID: ${ws.id}`)
      });
    }
    if (this.clients[ws.id]) this.clients.updateClientStats(ws.id).catch(() => {
      console.error(`Updating Client with ID: ${ws.id} failed`)
    });
    else console.error(`No Client with ID: ${ws.id} exists`);
    console.log(this.stats);
  }

  async setupWebSocketEvents(ws: any) {
    this.on('error', console.error);
    this.on('close', this.handleClose.bind(this, ws));
    this.on('message', this.handleMessage.bind(this, ws));
    this.setupInterval(ws);
  }

  async handleClose(ws: any, code: any) {
    console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
    this.server.handle.web.destroyClient(ws.ip);
    ws.terminate;
    if (this.stats.clientsCounter == 0) {
      clearInterval(this.interval_sendinfo);
      this.interval_sendinfo = undefined;
    }
  }

  async handleMessage(ws: any, data: any, isBinary: any) {
    const decodedJsonObject = Buffer.from(data, 'base64').toString();
    console.log("decodedJsonObject", decodedJsonObject);
    const obj = JSON.parse(decodedJsonObject);
    if (typeof obj.type !== "undefined") {
      switch (obj.type) {
        case 'greeting':
          this.handleGreeting(ws, obj);
          break;
      }
    }
  }

  async handleGreeting(ws: any, obj: any) {
    if (typeof obj.admin !== "undefined" && obj.admin == 1) this.settings.isAdmin = true;
    if (!this.clients[ws.id]) {
      console.error(`No Client with ID: ${ws.id} known`);
    }
    this.clients.client.setCustomClientConfig(ws.id, ws.ip, { "admin": obj.admin });
    this.server.handle.web.forEach(function each(ws_client: any) {
      if (ws_client.readyState === ws.OPEN) {
        this.clients[ws.id].getClientLatency();
        console.log('to ' + ws_client.ip + " admin " + ws_client.admin);
        if (ws_client.admin === true || ws.ip == "192.168.228.7") { const dummy = true; }
      }
    });
  }

  async setupInterval(ws: any) {
    if (typeof this.interval_sendinfo === 'undefined') {
      if (!this.stats.getPid()) {
        console.log("wrong here");
        this.server.handle.web.close();
        clearInterval(this.interval_sendinfo);
        this.interval_sendinfo = undefined;
      } else {
        this.interval_sendinfo = setInterval(() => {
          // Check if there are any connected clients
          this.stats.updateGlobalStats();
          this.clients.forEach((client: { readyState: any; OPEN: any; now: number; send: (arg0: string) => void; connectedSince: any; }) => {
            if (client.readyState === client.OPEN) {
              const timeDiff = Date.now() - client.now;
              client.send(JSON.stringify({
                latencyUser: timeDiff,
                latencyGoogle: this.stats.latencyGoogle,
                connectedSince: client.connectedSince,
              }));
            }
          });
        }, 1000);
      }
    }
  }
  async startInterval() { // Function to start the interval when a client connects
    if (this.stats.clientsCounter > 0) {
      if (typeof this.interval_sendinfo === 'undefined') {
        this.setupInterval({ ...this.server.handle.web });
      } else {
        clearInterval(this.interval_sendinfo); // Clear the interval if there are no connected clients
        this.interval_sendinfo = undefined;
      }
    }
  }
}
