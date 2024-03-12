"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable, postConstruct } from 'inversify';

import { EventEmitterMixin } from "../global/EventEmitterMixin";
import serverWrapper, { IServerWrapper } from "../server/serverInstance";
import { MainEventTypes, IEventTypes, SubEventTypes, IBaseEvent, BaseEvent, IClientsEvent, debugDataCallback } from "../global/eventInterface";
import { MyWebSocket } from "../clients/clientInstance";


@injectable()
export class Server {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  protected server: IServerWrapper;
  constructor() {
    this.server = new serverWrapper();
    this.server.handle.web = new WebSocketServer({ noServer: true });
    this.server.handle.file = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
    this.eV.on(MainEventTypes.SERVER, this.handleServerEvent);
  }

  // private setupWebSocketListeners() {
  //   this.server.handle.web.on('connection', (client: any, obj: any) => this.handleConnection.bind(this));
  //   this.server.handle.web.on('message', (client: any, obj: any, isBinary: any) => this.handleMessage.bind(this));
  //   this.server.handle.web.on('close', (client: any) => this.handleClose.bind(this));
  //   this.server.handle.web.on('error', (client: any, error: any) => console.error("Client:", client, "Error:", error));
  // }
  private setupWebSocketListeners() {
    this.server.handle.web.on('connection', (client: WebSocket, request: IncomingMessage) => {
      // Emit your 'connect' event
      const connectEvent: IClientsEvent = {
        subType: SubEventTypes.CLIENTS.SUBSCRIBE,
        message: "Client Connected",
        success: true,
        clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket }
      };
      this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
    });
    this.server.handle.web.on('message', (client: WebSocket, obj: any, isBinary: any) => {
      const decodedData = Buffer.from(obj, 'base64').toString();
      const messageObject = JSON.parse(decodedData);

      this.eV.emit(MainEventTypes.CLIENTS, {
        subType: SubEventTypes.CLIENTS.MESSAGE,
        data: messageObject,
        clientEvent: { client }
      });
    });

    this.server.handle.web.on('close', (client: WebSocket) => {
      this.eV.emit(MainEventTypes.CLIENTS, { subType: SubEventTypes.CLIENTS.UNSUBSCRIBE, clientEvent: { client } });
      client.terminate(); // Ensure proper termination
    });

    this.server.handle.web.on('error', (client: WebSocket, error: any) => {
      console.error("Client:", client, "Error:", error);
      // Consider emitting a client-specific error event here too
    });
  }
  private handleServerEvent(event: IClientsEvent) {
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

  // private async handleConnection(client: WebSocket, obj: any) {
  //   this.eV.emit(MainEventTypes.CLIENTS, { subType: SubEventTypes.CLIENTS.SUBSCRIBE, data: obj, clientEvent: { client: client } });
  // }

  // private async handleMessage(client: any, obj: any, isBinary: any) {
  //   const decodedData = Buffer.from(obj, 'base64').toString();
  //   const messageObject = JSON.parse(decodedData);

  //   if (messageObject) {
  //     this.eV.emit(MainEventTypes.CLIENTS, SubEventTypes.CLIENTS.MESSAGE, { subType: SubEventTypes.CLIENTS.SUBSCRIBE, data: messageObject, clientEvent: { client: client } });
  //     // this.eV.emit(MainEventTypes.MAIN, SubEventTypes.MAIN.START_STOP_INTERVAL);
  //   } else {
  //     console.warn("Unknown message type", messageObject);
  //   }
  // }

  // private async handleClose(client: any) {
  //   this.eV.emit(MainEventTypes.CLIENTS, { subType: SubEventTypes.CLIENTS.UNSUBSCRIBE, clientEvent: { client: client } });
  //   // this.eV.emit(MainEventTypes.MAIN, SubEventTypes.MAIN.START_STOP_INTERVAL);
  //   client.terminate();
  // }

  public async createServer() {
    const idleEvent = new BaseEvent({
      subType: SubEventTypes.BASIC.DEFAULT,
      message: "Idle event",
      success: true,
      debugEvent: debugDataCallback,
    });
    try {
      const _serverCert = createServer({
        cert: readFileSync(this.server.settings.certPath),
        key: readFileSync(this.server.settings.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this.server.handle.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => {
          const webSocketStream = createWebSocketStream(client as MyWebSocket, { objectMode: true });
          const connectEvent: IClientsEvent = {
            subType: `${SubEventTypes.CLIENTS.SUBSCRIBE}`,
            message: `Client connected id: ${request.headers['sec-websocket-key']}`,
            success: true,
            data: request,
            clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket }
          };
          this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
          webSocketStream.on('end', () => {
            console.log('WebSocket connection ended');
            const disconnectEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.UNSUBSCRIBE}`,
              message: `Client disconnected id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket }
            };
            this.eV.emit(MainEventTypes.CLIENTS, disconnectEvent);
          });

          webSocketStream.on('error', (error) => {
            const connectEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.UNSUBSCRIBE}`,
              message: `Client error id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket }
            };
            this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
            console.error('WebSocket error:', error);
          });
          webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
            try {
              const message = JSON.parse(data.toString());
              if (message.greeting) {
                const greetingEvent: IClientsEvent = {
                  subType: `${SubEventTypes.CLIENTS.GREETING}`.toString(), // Define an appropriate subType
                  message: message.greeting,
                  success: true,
                  clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket },
                  data: request // Include the client reference
                };
                this.eV.emit(MainEventTypes.CLIENTS, greetingEvent);
              } else {
                const otherEvent: IClientsEvent = {
                  subType: `${SubEventTypes.CLIENTS.OTHER}`, // Define an appropriate subType
                  message: message,
                  success: true,
                  clientsEvent: { id: request.headers['sec-websocket-key'] as string, client: client as MyWebSocket },
                  data: request // Include the client reference
                };
                this.eV.emit(MainEventTypes.CLIENTS, otherEvent);
              }
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });
          // webSocketStream.on('connection', (data: Buffer) => {
          //   console.log("connected:", data);
          // });
        });

      });


      _serverCert.listen(this.server.settings.streamServerPort, this.server.settings.ip, () => {
        console.log(this.server.handle.web.eventNames());
        console.log(`HTTPS server ${this.server.settings.ip} listening on ${this.server.settings.streamServerPort}`);
        const serverEvent: IBaseEvent = {
          subType: SubEventTypes.SERVER.LISTEN,
          message: 'serverCreated',
          success: true,
        };
        this.setupWebSocketListeners();
        this.eV.emit(MainEventTypes.BASIC, serverEvent);
        const statsEvent: IBaseEvent = {
          subType: SubEventTypes.STATS.UPDATE_ALL,
          message: 'serverCreated',
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, statsEvent);
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
