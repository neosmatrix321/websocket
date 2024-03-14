"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import { inject, injectable, postConstruct } from 'inversify';

import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { serverWrapper, IServerWrapper } from "../server/serverInstance";
import { MainEventTypes, IEventTypes, SubEventTypes, IBaseEvent, BaseEvent, IClientsEvent, debugDataCallback, IServerEvent, IStatsEvent, CustomErrorEvent, IMainEvent } from "../global/eventInterface";
import { ClientType, MyWebSocket } from '../clients/clientInstance';
import { RconConnection } from '../rcon/lib/server/connection'; // Adjust the path
import { Stats } from '../stats/stats';
import { connect } from 'rxjs';


const rconServer = new RconConnection();
@injectable()
export class Server {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  protected server: serverWrapper = new serverWrapper();
  constructor() {
    // this.setupWebSocketListeners();
    this.eV.on(MainEventTypes.SERVER, this.handleServerEvent.bind(this));
    //   console.log('Connected to RCON');
    //   this.sendRconCommand('info').then((response) => {
    //     console.log('RCON response:', response);
    //   });
    // });
  }
  private getClientType(ip: string, extra?: any): ClientType {
    switch (true) {
      case ( extra.admin && extra.admin == 1):
        return ClientType.Admin;
      case (ip == '192.168.228.7'):
      case (ip == '127.0.0.1'):
        return ClientType.Server;
      default:
        return ClientType.Basic;
    }
  }
  public handleServerEvent(event: IEventTypes) {
    switch (event.subType) {
      case SubEventTypes.SERVER.PRINT_DEBUG:
          console.log("Server:");
          console.dir(this.server, { depth: 2, colors: true });
          break;
      default:
        console.warn('Unknown server event subtype:', event.subType);
    }
  }

  private wsToMyWs(client: WebSocket, request: IncomingMessage): MyWebSocket {
    const ws = client as MyWebSocket;
    if (ws.id !== "string" || ws.ip !== "string") {
        const newID = request.headers['sec-websocket-key'] as string;
        let newIP;
        let newType;
        if (newID && '_socket' in ws) {
          newIP = (ws as any)._socket.remoteAddress;
          newType = this.getClientType(newIP, { admin: 1 });
        }
        
        if (!newID || !newIP) this.eV.handleError(SubEventTypes.ERROR.FATAL, `wsToMyWs`, new CustomErrorEvent(`invalid id ( ${newID} ) || ip ( ${newIP} )`, MainEventTypes.SERVER, ws));

        const newBlob = {
          id: newID || `${Date.now()}`,
          ip: newIP || "NaN",
          type: newType
        };
        return { ...client, ...newBlob } as MyWebSocket;
      }
    return ws as unknown as MyWebSocket;
  }
  public async createServer() {
    // const idleEvent = new BaseEvent({
    //   subType: SubEventTypes.BASIC.DEFAULT,
    //   message: "Idle event",
    //   success: true,
    //   debugEvent: debugDataCallback,
    // });
    try {
      const _serverCert = createServer({
        cert: readFileSync(this.server.settings.certPath),
        key: readFileSync(this.server.settings.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this.server.handle.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => {
          const webSocketStream = createWebSocketStream(client as MyWebSocket | WebSocket, { objectMode: true });
          // TODO: Login

          const finalClient: MyWebSocket = { ...this.wsToMyWs(client, request) };


          if (finalClient.id !== "string" || !finalClient.type) return this.eV.handleError(SubEventTypes.ERROR.FATAL, `Server OM upgrade`, new CustomErrorEvent(`Server secure upgrade failed?`, MainEventTypes.SERVER, finalClient));
          const connectEvent: IClientsEvent = {
            subType: SubEventTypes.CLIENTS.SUBSCRIBE,
            message: `Client connected id: ${request.headers['sec-websocket-key']}`,
            success: true,
            data: request,
            clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient }
          };
          this.eV.emit(MainEventTypes.CLIENTS, connectEvent).catch((error) => {
            console.error("Error emitting message ready event:", error);
          });

          webSocketStream.on('end', () => {
            console.log('WebSocket connection ended');
            const disconnectEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.UNSUBSCRIBE}`,
              message: `Client disconnected id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient }
            };
            this.eV.emit(MainEventTypes.CLIENTS, disconnectEvent);
          });

          webSocketStream.on('error', (error) => {
            const connectEvent: IClientsEvent = {
              subType: `${SubEventTypes.CLIENTS.UNSUBSCRIBE}`,
              message: `Client error id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient }
            };
            this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
            console.error('WebSocket error:', error);
          });
          webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
            try {
              const message = JSON.parse(data.toString());
              switch (true) {
              case (message.greeting !== undefined):
                const greetingEvent: IClientsEvent = {
                  subType: SubEventTypes.CLIENTS.GREETING, // Define an appropriate subType
                  message: message.greeting,
                  success: true,
                  clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient },
                  data: message.greeting // Include the client reference
                };
                this.eV.emit(MainEventTypes.CLIENTS, greetingEvent);
                break;
              case (message.serverMessage !== undefined):
                 const serverEvent: IClientsEvent = {
                  subType: SubEventTypes.CLIENTS.SERVER_MESSAGE_READY, // Define an appropriate subType
                  message: `serverMessage`,
                  success: true,
                  clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient },
                  data: message.serverMessage // Include the client reference
                };
                this.eV.emit(MainEventTypes.CLIENTS, serverEvent);
                break;
              case (message.updateStats !== undefined):
                const statsEvent: IStatsEvent = {
                  subType: SubEventTypes.STATS.UPDATE_ALL, // Define an appropriate subType
                  message: 'updateStats',
                  success: true,
                  statsEvent: { newValue: message.updateStats, updatedFields: Object.keys(message.updateStats) }
                };
                this.eV.emit(MainEventTypes.STATS, statsEvent);
                break;
              case (message.printDebug !== undefined):
                const debugEvent: IBaseEvent = {
                  subType: SubEventTypes.MAIN.PRINT_DEBUG, // Define an appropriate subType
                  message: 'printDebug',
                  success: true,
                };
                this.eV.emit(MainEventTypes.MAIN, debugEvent);
                break;
              default:
                const otherEvent: IClientsEvent = {
                  subType: SubEventTypes.CLIENTS.OTHER, // Define an appropriate subType
                  message: message,
                  success: true,
                  clientsEvent: { id: finalClient.id, ip: finalClient.ip, clientType: finalClient.type, client: finalClient },
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
        // this.setupWebSocketListeners();
        this.eV.emit(MainEventTypes.MAIN, serverEvent);
      });
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, `createServer`, new CustomErrorEvent("Error creating server", MainEventTypes.SERVER, error));
      console.error("Error creating server:", error);
    }
  }


  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server.handle.web.handleUpgrade(request, socket, head, callback);
  }
}
