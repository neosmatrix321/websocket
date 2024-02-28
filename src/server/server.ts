"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { EventEmitterMixin } from '../global/EventHandlingMixin';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import Main from '../main';
import { ClientType, IClient } from '../clients/clientInstance';
import { inject, injectable } from 'inversify';
import { IHandleWrapper, SERVER_WRAPPER_TOKEN } from './serverInstance';
import { ISettings, PRIVATE_SETTINGS_TOKEN } from '../settings/settingsInstance';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";

interface MyWebSocket extends WebSocket {
  id: string
}
export enum serverType {
  listen,
  clientConnected,
  clientMessageReady,
  clientDisconcted
}

export interface IServerEvent extends eH.IEventMap {
  type: serverType;
  message: string;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}
export interface IServerEvent {
  type: serverType;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}
export class ServerEvent {
  type?: serverType;
  data?: {
    errCode: number;
    message?: string;
    blob?: any;
  };
}

class BaseServerEvent implements eH.IBaseEvent {
  "cat": eH.catType = eH.catType.server;
}

function isMyWebSocketWithId(ws: WebSocket): ws is MyWebSocket {
  return 'id' in ws;
}

@injectable()
export default class Server extends EventEmitterMixin(BaseServerEvent) {
  @inject(SERVER_WRAPPER_TOKEN) _server!: IHandleWrapper;
  @inject(PRIVATE_SETTINGS_TOKEN) _settings!: ISettings;
  @inject(eM.EVENT_MANAGER_TOKEN) eM!: eM.eventManager;
  constructor() {
    super();
    this._server._handle.web = ;
    this._server._handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
  }
  private setupWebSocketListeners() {
    this._server._handle.web.on('connection', this.handleConnection.bind(this));
    this._server._handle.web.on('close', this.handleClose.bind(this));
    // ... Add listeners for other WebSocketServer events if needed
  }
  public async createServer() {
    try {
      const _serverCert = createServer({
        cert: readFileSync(this._server._settings.certPath),
        key: readFileSync(this._server._settings.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this._server._handle.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => { // ws is a WebSocket object
          const webSocketStream = createWebSocketStream(client as MyWebSocket);

          webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
            try {
              const message = JSON.parse(data.toString());
              console.log("connected:", message);
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });

          this.emitConnection(webSocketStream, request); // Adapt emitConnection if needed 
        });
      });

      _serverCert.listen(this._server._settings.streamServerPort, this._server._settings.ip, () => {
        console.log(`HTTPS server ${this._server._settings.ip} listening on ${this._server._settings.streamServerPort}`);
        this.emit('serverCreated');
      });
    } catch (err) {
      console.error("Error creating server:", err);
      this.emit('serverCreated', { 'err': err });
    }
  }
  public async createTimer() {
    // Interval function moved here
    // this.stats.updateAndGetPidIfNecessary();
    this.emit('createTimer');
    this._server._handle.web.clients.forEach((ws_client: WebSocket) => {
      if (isMyWebSocketWithId(ws_client)) {
        const client = this._clients[ws_client.id] as IClient;
        if (client._config.type === ClientType.Admin) {
          console.log(client._config.type);
        }

        if (ws_client.readyState === ws_client.OPEN) {
          if (this._clients[ws_client.id]) {
            console.error(`No Client with ID: ${ws_client.id} known`);
          }
          const time_diff = (Date.now() - ws_client.now);
          console.log("admin(" + ws_client.admin + ") sending to ip(" + this._clients[ws_client.id].info.ip + ") alive(" + ws_client.readyState + ") count(" + this._clients[ws_client.id]._stats.clientsCounter + ") connected(" + this.stats.connectedClients + ") latency_user(" + this._clients[ws_client.id]._stats.latency_user + ") latency_google(" + this.stats.latencyGoogle + ") connected since(" + this.stats.lastUpdates.web + ") diff(" + time_diff + ")");

          if (time_diff > 20000) {
            this.eM.emit('clientLatencyThresholdExceeded', {
              clientId: ws_client.id,
              latency: time_diff,
              // ... more data 
            });
          }
        }
      }
    });
    await this.statsService.updateAllStats(); // Get updated stats
    this.eM.emit('statsUpdated', this.statsService.stats);
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this._server._handle.web.handleUpgrade(request, socket, head, callback);
  }

  emitConnection(ws: any, request: IncomingMessage) {
    this._server._handle.web.emit('connection', ws, request);
    globalEventEmitter.emit('clientConnected', ws);
  }

  destroyClient(ip: string) {
    // Implement the logic to destroy a client
  }
}
