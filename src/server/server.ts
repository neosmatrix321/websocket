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
import Main from "../main";
import Stats from "../stats/stats";

const EventMixin = eM.SingletonEventManager.getInstance();

@injectable()
export default class Server  {
  private eV: eM.eventManager;
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
