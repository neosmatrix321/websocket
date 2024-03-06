"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable } from 'inversify';
import * as eH from "../global/EventHandlingMixin";
import * as eM from "../global/EventHandlingManager";
import * as serverI from "../server/serverInstance";


@injectable()
export default class Server  {
  private eV: typeof EventMixin;
  @inject(serverI.SERVER_WRAPPER_TOKEN) server!: serverI.IHandleWrapper;
  constructor() {
    this.eV = EventMixin;
    this.server._handle.web = new WebSocketServer({ noServer: true });
    this.server._handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    this.server._handle.web.on('connection', this.eV.handleClientConnected.bind(this));
    this.server._handle.web.on('message', this.eV.handleClientMessage.bind(this));
    this.server._handle.web.on('close', this.eV.handleClientDisconnected.bind(this));
    // ... Add listeners for other WebSocketServer events if needed
  }
  public isMyWebSocketWithId(ws: WebSocket): ws is serverI.MyWebSocket {
    return 'id' in ws;
  }
  public async createServer() {
    try {
      const _serverCert = createServer({
        cert: readFileSync(this.server._settings.certPath),
        key: readFileSync(this.server._settings.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this.server._handle.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => { // ws is a WebSocket object
          const webSocketStream = createWebSocketStream(client as serverI.MyWebSocket);

          webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
            try {
              const message = JSON.parse(data.toString());
              console.log("connected:", message);
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });

        });
      });

      _serverCert.listen(this.server._settings.streamServerPort, this.server._settings.ip, () => {
        console.log(`HTTPS server ${this.server._settings.ip} listening on ${this.server._settings.streamServerPort}`);
        this.eV.emit('serverCreated');
      });
    } catch (error) {
      console.error("Error creating server:", error);
      this.eV.handleError(new Error('Error creating server'), error);
    }
  }
  public async createTimer() {
    // Interval function moved here
    // this.stats.updateAndGetPidIfNecessary();
    this.eV.emit('createTimer');
    this.server._handle.web.clients.forEach((ws_client: WebSocket) => {
      if (!this.isMyWebSocketWithId(ws_client)) {
        this.eV.emit(eH.MainEventTypes.WS, ws_client);
        Main.stats.lastUpdates = { "timerUpdated": Date.now() };
      }
      if (this.isMyWebSocketWithId(ws_client)) {
        if (ws_client.readyState === ws_client.OPEN) {
          if (!ws_client.id) {
            console.error(`No Client with ID: ${ws_client.id} known`);
          }
          const time_diff = Date.now() - Main.stats.lastUpdates.timerUpdated;
          if (time_diff > 20000) {
            this.eV.emit(eH.SubEventTypes.CLIENTS.UPDATE_CLIENT_STATS, ws_client.id);
          }
        }
      }
    });
    await Main.stats.updateAllStats(); // Get updated stats
    this.eV.emit('statsUpdated', Main.stats.stats);
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server._handle.web.handleUpgrade(request, socket, head, callback);
  }

  emitConnection(ws: any, request: IncomingMessage) {
    this.server._handle.web.emit('connection', ws, request);
    this.eV.emit('clientConnected', ws);
  }

  destroyClient(ip: string) {
    // Implement the logic to destroy a client
  }
}
