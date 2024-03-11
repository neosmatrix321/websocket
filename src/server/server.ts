"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable } from 'inversify';

import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { IServerWrapper } from "../server/serverInstance";
import { MainEventTypes, IEventTypes, SubEventTypes, IBaseEvent } from "../global/eventInterface";
import { MyWebSocket } from "../clients/clientInstance";
export const SERVER_WRAPPER_TOKEN = Symbol('Server');


@injectable()
export class Server {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  @inject(SERVER_WRAPPER_TOKEN) server!: IServerWrapper;
  constructor() {
    this.server.handle.web = new WebSocketServer({ noServer: true });
    this.server.handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
    this.eV.on(MainEventTypes.SERVER, this.handleServerEvent);
  }

  private setupWebSocketListeners() {
    this.server.handle.web.on('connection', (client: any, obj: any) => this.handleConnection.bind(this));
    this.server.handle.web.on('message', (client: any, obj: any, isBinary: any) => this.handleMessage.bind(this));
    this.server.handle.web.on('close', (client: any) => this.handleClose.bind(this));
    this.server.handle.web.on('error', (client: any, error: any) => console.error("Client:", client, "Error:", error));
  }

  private handleServerEvent(event: IEventTypes) {
    switch (event.subType) {
      // case SubEventTypes.SERVER.LISTEN:
      //   this.handleStartTimer(event);
      //   // this.serverActive(event);
      //   break;
      default:
        console.warn('Unknown server event subtype:', event.subType);
    }
  }

  // private async handleConnection(ws: MyWebSocket) {
  //   this.handleGreeting(ws, {});
  // }

  private async handleConnection(client: WebSocket, obj: any) {
    this.eV.emit(MainEventTypes.CLIENTS, SubEventTypes.CLIENTS.SUBSCRIBE, client, obj);

  }

  private async handleMessage(client: any, obj: any, isBinary: any) {
    const decodedData = Buffer.from(obj, 'base64').toString();
    const messageObject = JSON.parse(decodedData);

    if (messageObject) {
      this.eV.emit(MainEventTypes.CLIENTS, SubEventTypes.CLIENTS.MESSAGE, client, messageObject);
      // this.eV.emit(MainEventTypes.MAIN, SubEventTypes.MAIN.START_STOP_INTERVAL);
    } else {
      console.warn("Unknown message type", messageObject);
    }
  }

  private async handleClose(ws: any) {
    this.eV.emit(MainEventTypes.CLIENTS, SubEventTypes.CLIENTS.UNSUBSCRIBE, ws);
    // this.eV.emit(MainEventTypes.MAIN, SubEventTypes.MAIN.START_STOP_INTERVAL);
    ws.terminate();
  }
  
  public async createServer() {
    try {
      const _serverCert = createServer({
        cert: readFileSync(this.server.settings.certPath),
        key: readFileSync(this.server.settings.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this.server.handle.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => { // ws is a WebSocket object
const webSocketStream = createWebSocketStream(client as MyWebSocket);

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

      _serverCert.listen(this.server.settings.streamServerPort, this.server.settings.ip, () => {
        console.log(`HTTPS server ${this.server.settings.ip} listening on ${this.server.settings.streamServerPort}`);
        const serverEvent: IBaseEvent = {
          subType: SubEventTypes.SERVER.LISTEN,
          message: 'Server created',
          success: true,
        };
        this.eV.emit(MainEventTypes.SERVER, serverEvent);
      });
    } catch (error) {
      console.error("Error creating server:", error);
      this.eV.handleError(new Error('Error creating server'), error);
    }
  }


  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server.handle.web.handleUpgrade(request, socket, head, callback);
  }
}
