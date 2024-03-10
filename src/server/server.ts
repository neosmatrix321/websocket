"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable } from 'inversify';
import * as eM from "../global/EventEmitterMixin";

import { SingletonEventManager } from "../global/EventEmitterMixin";
import * as eH from "../global/eventInterface";
import * as serverI from "../server/serverInstance";
import * as eventI from "../global/eventInterface";
import * as clientsI from "../clients/clientInstance";
import { SubEventTypes } from '../global/eventInterface';
import Clients from '../clients/clients';

const EventMixin = SingletonEventManager.getInstance();

@injectable()
export default class Server {
  private eV: eM.EventEmitterMixin;
  @inject(serverI.SERVER_WRAPPER_TOKEN) server!: serverI.IHandleWrapper;
  constructor() {
    this.eV = EventMixin;
    this.server._handle.web = new WebSocketServer({ noServer: true });
    this.server._handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
    this.eV.on(eventI.MainEventTypes.SERVER, this.handleServerEvent);
  }

  private setupWebSocketListeners() {
    this.server._handle.web.on('connection', (client: any, obj: any) => this.handleConnection.bind(this));
    this.server._handle.web.on('message', (client: any, obj: any, isBinary: any) => this.handleMessage.bind(this));
    this.server._handle.web.on('close', (client: any) => this.handleClose.bind(this));
    this.server._handle.web.on('error', (client: any, error: any) => console.error("Client:", client, "Error:", error));
  }

  private handleServerEvent(event: eventI.IEventTypes) {
    switch (event.subType) {
      // case eventI.SubEventTypes.SERVER.LISTEN:
      //   this.handleStartTimer(event);
      //   // this.serverActive(event);
      //   break;
      default:
        console.warn('Unknown server event subtype:', event.subType);
    }
  }

  // private async handleConnection(ws: serverI.MyWebSocket) {
  //   this.handleGreeting(ws, {});
  // }

  private async handleConnection(client: WebSocket, obj: any) {
    this.eV.emit(eventI.MainEventTypes.CLIENTS, eventI.SubEventTypes.CLIENTS.SUBSCRIBE, client, obj);

  }

  private async handleMessage(client: any, obj: any, isBinary: any) {
    const decodedData = Buffer.from(obj, 'base64').toString();
    const messageObject = JSON.parse(decodedData);

    if (messageObject) {
      this.eV.emit(eventI.MainEventTypes.CLIENTS, eventI.SubEventTypes.CLIENTS.MESSAGE, client, messageObject);
      this.eV.emit(eventI.MainEventTypes.MAIN, eventI.SubEventTypes.MAIN.START_STOP_INTERVAL);
    } else {
      console.warn("Unknown message type", messageObject);
    }
  }

  private async handleClose(ws: any) {
    this.eV.emit(eventI.MainEventTypes.CLIENTS, eventI.SubEventTypes.CLIENTS.UNSUBSCRIBE, ws);
    this.eV.emit(eventI.MainEventTypes.MAIN, eventI.SubEventTypes.MAIN.START_STOP_INTERVAL);
    ws.terminate();
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
const webSocketStream = createWebSocketStream(client as clientsI.MyWebSocket);

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
        const serverEvent: eH.IBaseEvent = {
          subType: eH.SubEventTypes.SERVER.LISTEN,
          message: 'Server created',
          success: true,
        };
        this.eV.emit(eH.MainEventTypes.SERVER, serverEvent);
      });
    } catch (error) {
      console.error("Error creating server:", error);
      this.eV.handleError(new Error('Error creating server'), error);
    }
  }


  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server._handle.web.handleUpgrade(request, socket, head, callback);
  }
}
