"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable } from 'inversify';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import * as serverC from "../server/server";
import * as serverI from "../server/serverInstance";


@injectable()
export default class Server {
  @inject(serverI.SERVER_WRAPPER_TOKEN) _server!: serverI.IHandleWrapper;
  @inject(eM.EVENT_MANAGER_TOKEN) eM!: eM.eventManager;
  constructor() {
    super();
    this._server._handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
  }
  private setupWebSocketListeners() {
    this.eM.webServer.on('connection',  this.eM.handleClientConnected.bind(this));
    this.eM.webServer.on('message',  this.eM.handleClientMessage.bind(this));
    this.eM.webServer.on('close',  this.eM.handleClientDisconnected.bind(this));
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
    } catch (error) {
      console.error("Error creating server:", error);
      this.eM.handleError(new Error('Error creating server'), error);
    }
  }
  public async createTimer() {
    // Interval function moved here
    // this.stats.updateAndGetPidIfNecessary();
    this.eM.emit('createTimer');
    this._server._handle.web.clients.forEach((ws_client: WebSocket) => {
      if (!isMyWebSocketWithId(ws_client)) {
        this.eM.emit(serverC.serverType.clientConnected, ws_client);
      }
      if (isMyWebSocketWithId(ws_client)) {
        if (ws_client.readyState === ws_client.OPEN) {
          if (!ws_client.id) {
            console.error(`No Client with ID: ${ws_client.id} known`);
          }
          const time_diff = (Date.now() - ws_client.now);
          console.log("admin(" + ws_client.admin + ") sending to ip(" + this._clients[ws_client.id].info.ip + ") alive(" + ws_client.readyState + ") count(" + this._clients[ws_client.id]._stats.clientsCounter + ") connected(" + this.stats.connectedClients + ") latency_user(" + this._clients[ws_client.id]._stats.latency_user + ") latency_google(" + this.stats.latencyGoogle + ") connected since(" + this.stats.lastUpdates.web + ") diff(" + time_diff + ")");

          if (time_diff > 20000) {
            this.eM.emit(serverType.updateClientStats, ws_client.id);
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
