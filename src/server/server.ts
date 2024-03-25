"use strict";
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { readFile } from 'node:fs/promises';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, createWebSocketStream } from 'ws';

import mixin, { EventEmitterMixin } from "../global/EventEmitterMixin";
import { serverWrapper } from "../server/serverInstance";
import { MainEventTypes, SubEventTypes, IBaseEvent, IClientsEvent, IServerEvent, IStatsEvent, INewErr } from "../global/eventInterface";
import { ClientType, MyWebSocket } from '../clients/clientInstance';
import { RconConnection } from '../rcon/lib/server/connection'; // Adjust the path
import { parsePlayers, splitInfo } from '../rcon/lib/player';
import * as fs from 'fs';
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from "../global/statsInstance";
import { SERVER_WRAPPER_TOKEN } from '../main';
import { settingsContainer, statsContainer } from '../global/containerWrapper';


@injectable()
export class Server {
  private eV: EventEmitterMixin = mixin;
  @inject(() => SERVER_WRAPPER_TOKEN) protected server: serverWrapper = new serverWrapper();
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;

  constructor() {
    // this.setupWebSocketListeners();
    this.setupEventHandlers();
    //   // console.log('Connected to RCON');
    //   this.sendRconCommand('info').then((response) => {
    //     // console.log('RCON response:', response);
    //   });
    // });
  }
  private getClientType(ip: string, extra?: any): ClientType {
    switch (true) {
      case (ip == '192.168.228.7'):
      case (ip == '127.0.0.1'):
        return ClientType.Server;
      case (extra.admin && extra.admin == 1):
        return ClientType.Admin;
      default:
        return ClientType.Basic;
    }
  }

  public setupWebSocketListeners(webSocketStream: Duplex, myWebSocket: MyWebSocket) {
    webSocketStream.on('end', () => {
      // console.log('WebSocket connection ended');
      const disconnectEvent: IClientsEvent = {
        subType: SubEventTypes.CLIENTS.UNSUBSCRIBE,
        message: `Client (${myWebSocket.id}) unsubscribed`,
        success: true,
        id: myWebSocket.id,
        type: [],
        data: {},
        client: myWebSocket
      };
      this.eV.emit(MainEventTypes.CLIENTS, disconnectEvent);
      webSocketStream.removeAllListeners();
    });

    webSocketStream.on('error', (error) => {
      const connectEvent: IClientsEvent = {
        subType: SubEventTypes.CLIENTS.UNSUBSCRIBE,
        message: `Client error id: ${myWebSocket.id}`,
        success: true,
        type: [],
        data: { ...error },
        id: myWebSocket.id,
        client: myWebSocket
      };
      this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
      this.eV.handleError(SubEventTypes.ERROR.INFO, `Websocket Server`, MainEventTypes.SERVER, new Error(`Client error`), error);
      webSocketStream.removeAllListeners();
    });
    webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
      const message = JSON.parse(data.toString());
      switch (true) {
        case (message.greeting !== undefined):
          const greetingEvent: IClientsEvent = {
            subType: SubEventTypes.CLIENTS.GREETING,
            message: message.greeting,
            success: true,
            id: myWebSocket.id,
            type: ["ALL"],
            client: myWebSocket,
            data: message
          };
          this.eV.emit(MainEventTypes.CLIENTS, greetingEvent);
          break;
        case (message.serverMessage !== undefined):
          const serverEvent: IClientsEvent = {
            subType: SubEventTypes.CLIENTS.MESSAGE_READY,
            message: `serverMessage`,
            success: true,
            id: myWebSocket.id,
            type: ["serverMessage"],
            client: myWebSocket,
            data: message.serverMessage
          };
          this.eV.emit(MainEventTypes.CLIENTS, serverEvent);
          break;
        case (message.updateStats !== undefined):
          const statsEvent: IStatsEvent = {
            subType: SubEventTypes.STATS.UPDATE_ALL,
            message: 'updateStats',
            success: true,
            newValue: message.updateStats, updatedFields: Object.keys(message.updateStats)
          };
          this.eV.emit(MainEventTypes.STATS, statsEvent);
          break;
        case (message.printDebug !== undefined):
          const debugEvent: IBaseEvent = {
            subType: SubEventTypes.MAIN.PRINT_DEBUG,
            message: 'printDebug',
            success: true,
          };
          this.eV.emit(MainEventTypes.MAIN, debugEvent);
          break;
        default:
          const otherEvent: IClientsEvent = {
            subType: SubEventTypes.CLIENTS.OTHER,
            message: message,
            success: true,
            id: myWebSocket.id,
            type: [],
            data: message,
            client: myWebSocket,
          };
          this.eV.emit(MainEventTypes.CLIENTS, otherEvent);
      }
    });
  }
  public setupEventHandlers() {
    this.eV.on(MainEventTypes.SERVER, (event: IServerEvent) => {
      switch (event.subType) {
        case SubEventTypes.SERVER.LOG_TO_FILE:
          const error: INewErr = event.message as unknown as INewErr;
          this.server.file.logError(error);
          break;
        case SubEventTypes.SERVER.DEBUG_LOG_TO_FILE:
          this.server.file.logDebugError(event);
          break;
        case SubEventTypes.SERVER.KILLED:
          this.stats.server.webHandle.isAlive = false;
          this.eV.handleError(SubEventTypes.ERROR.FATAL, "Server killed", MainEventTypes.SERVER, new Error("Server killed"));
          break;
        case SubEventTypes.SERVER.START:
          console.log("Server start event");
          this.createServer();
          break;
        case SubEventTypes.SERVER.PRINT_DEBUG:
          this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: "SERVER" });
          // console.log("Server:");
          // console.dir(this.server, { depth: 2, colors: true });
          break;
        case SubEventTypes.SERVER.RCON_CONNECT:
          try {
            this.rconConnect().then(() => {
              this.rconGetStats().then(() => {
                const newEvent: IBaseEvent = {
                  subType: SubEventTypes.BASIC.STATS,
                  message: `RCON connected`,
                  success: true,
                };
                this.eV.emit(MainEventTypes.BASIC, newEvent);
                this.stats.updateLastUpdates("server", "rconConnect", true);
              });
            });
          } catch (error) {
            this.eV.handleError(SubEventTypes.ERROR.WARNING, "Rcon connect error", MainEventTypes.STATS, new Error("weird"), error);
          }
          // this.serverActive(event);
          break;
        case SubEventTypes.SERVER.RCON_DISCONNECT:
          this.rconDisconnect();
          // this.serverActive(event);
          break;
        default:
        // console.warn('Unknown server event subtype:', event.subType);
      }
    });
  }
  async rconConnect(): Promise<void> {
    this.stats.updateLastUpdates("server", "rconConnect");
    this.server.rcon = new RconConnection();
    try {
      const RCON_HOSTNAME = this.settings.rcon.host;
      const RCON_PORT = this.settings.rcon.port;
      const RCON_PASSWORD = this.settings.rcon.pw;

      await this.server.rcon.connect(RCON_HOSTNAME, RCON_PORT, RCON_PASSWORD);
      if (!this.server.rcon.connectedWithoutError) throw new Error(`RCON connected with error`);
      this.stats.global.rcon.isConnected = true;
    } catch (error: any) {
      this.stats.global.rcon.isConnected = false;
      this.rconDisconnect();
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON connect failed`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    }
  }

  rconDisconnect() {
    this.stats.updateLastUpdates("server", "rconDisconnect");
    if (this.server.rcon) {
      this.server.rcon.client.resetAndDestroy();
      this.stats.global.rcon.isConnected = false;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.stats.updateLastUpdates("server", "rconDisconnect", true);
    }
  }

  async rconGetStats(force: boolean = false): Promise<void> {
    if (!this.stats.global.rcon.isConnected) return this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `RCON not connected`, success: false });
    if (force || !this.stats.server.lastUpdates.rconGetStatsInfo.last || (Date.now() - this.stats.server.lastUpdates.rconGetStatsInfo.last) > 60000) {
      try {
        const info = await this.sendRconCommand('Info');
        if (!info) throw new Error(`No info from rcon`);
        this.stats.updateLastUpdates("server", "rconGetStatsInfo");
        this.stats.global.rcon.info = splitInfo(info);
        const rconInfoEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconInfo updated ${this.stats.global.lastUpdates.rconGetStatsInfo}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, rconInfoEvent);
        this.stats.updateLastUpdates("server", "rconGetStatsInfo", true);
      } catch (error) {
        this.stats.global.rcon.info = { name: "NaN", ver: "NaN" };
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Info`, MainEventTypes.STATS, new Error(`rconGetStatsInfo failed`), error);
      };
    }
    if (!this.stats.server.lastUpdates.rconGetStatsPlayers.last || (Date.now() - this.stats.server.lastUpdates.rconGetStatsPlayers.last) > 5000) {
      try {
        const players = await this.sendRconCommand('ShowPlayers');
        if (!players) throw new Error(`No players from rcon`);
        this.stats.updateLastUpdates("server", "rconGetStatsPlayers");
        this.stats.global.rcon.players = parsePlayers(players);
        const rconPlayersEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconPlayers updated ${this.stats.global.lastUpdates.rconGetStatsPlayers}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, rconPlayersEvent);
        this.stats.updateLastUpdates("server", "rconGetStatsPlayers", true);
      } catch (error) {
        this.stats.global.rcon.players = [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON ShowPlayers`, MainEventTypes.STATS, new Error("rconGetStatsPlayers failed"), error);
      }
    }
  }
  async sendRconCommand(command: string): Promise<string | undefined> {
    if (this.server.rcon && this.stats.global.rcon.isConnected) {
      try {
        // Ensure RCON connection if not open? rconConnection.connect();
        const response = await this.server.rcon.exec(command);
        return response.body; // Or format the response if needed
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Command`, MainEventTypes.STATS, new Error("sedRconCommand failed"), error);
        // Return an error message
      }
    } else {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON`, MainEventTypes.STATS, new Error("RCON not connected"), { isConnected: this.stats.global.rcon.isConnected });
    }
    return undefined;
  }

  private wsToMyWs(client: WebSocket, request: IncomingMessage): MyWebSocket {
    let ws: MyWebSocket = client as unknown as MyWebSocket;
    if (
      typeof ws.id !== 'string' ||
      typeof ws.ip !== 'string' ||
      !ws.type
    ) {
      try {
        // const newID = `${Date.now()}`;
        const newID = request.headers['sec-websocket-key'];
        let newIP;
        let newType;
        if (newID && '_socket' in ws) {
          newIP = (ws as any)._socket.remoteAddress;
          newType = this.getClientType(newIP, {});
        }

        ws.id = `${newID}` || `${Date.now()}`;
        ws.ip = `${newIP}` || 'NaN';
        ws.type = newType || ClientType.Basic;
        if (typeof ws.id !== 'string') throw new Error(`invalid id ( ${ws.id} )`);
        if (typeof ws.ip !== 'string') throw new Error(`invalid ip ( ${ws.ip} )`);
        if (typeof ws.type !== 'number') throw new Error(`invalid type ( ${ws.type} )`);
        return ws as MyWebSocket;
      } catch (error) {
        // Erstellen Sie ein neues Error-Objekt, um den Stacktrace zu erfassen
        const errorWithStack = error instanceof Error ? new Error(`Error in wsToMyWs: ${error.message}`) : new Error(`Unexpected error: ${error}`);
        errorWithStack.stack = error instanceof Error ? error.stack : ''; // Übernehmen Sie den Stacktrace des ursprünglichen Fehlers
        if (error instanceof Error && error.stack) {
          this.eV.handleError(SubEventTypes.ERROR.FATAL, 'wsToMyWs', MainEventTypes.SERVER, errorWithStack, error);
        } else {
          this.eV.handleError(SubEventTypes.ERROR.FATAL, 'wsToMyWs', MainEventTypes.SERVER, errorWithStack, new Error(`Unexpected error: ${error}`));
        }

        // Handle the error without crashing (e.g., return a default WebSocket)
      }
    }
    return ws as MyWebSocket || this.createDefaultWebSocket(); // Placeholder; implement appropriate handling
  }
  private createDefaultWebSocket(): MyWebSocket {
    return {
      id: 'default-id',
      ip: '0.0.0.0',
      type: ClientType.Basic,
      // ... add other default properties
    } as MyWebSocket;
  }

  private async callAsyncAndWaitForResult(client: MyWebSocket, request: IncomingMessage): Promise<boolean> {
    const subscriptionResult = await new Promise<boolean>((resolve, reject) => {
      this.eV.once(`${MainEventTypes.PROMISE}.${SubEventTypes.PROMISE.CLIENT_SUBSCRIBE}`, (result: boolean) => {
        result ? resolve(true) : reject(new Error("Subscription failed"));
      });

      // Emit the event to trigger subscription on the client
      const connectEvent: IClientsEvent = {
        subType: SubEventTypes.CLIENTS.SUBSCRIBE,
        message: `clientSubscribed`,
        data: { ...request },
        id: client.id,
        type: [],
        success: subscriptionResult as boolean, // Update success here
        client: client
      };
      this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
    }).catch((error) => {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, `Server ON upgrade`, MainEventTypes.SERVER, new Error(`Error on upgrade`), error);
    });
    return subscriptionResult as boolean;
  }

  public async createServer(): Promise<void> {
    this.stats.updateLastUpdates("main", "init", true);
    this.stats.updateLastUpdates("server", "createServer");
    this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.SERVER, message: 'Start Server ...', success: true });
    const _serverCert = createServer({
      cert: readFileSync(this.settings.server.certPath),
      key: readFileSync(this.settings.server.keyPath)
    });

    _serverCert.on('upgrade', (request, socket, head) => {
      //  ... adjust upgrade handling as needed ...
      this.server.web.handleUpgrade(request, socket, head, (client) => {
        const myWebSocket: MyWebSocket = this.wsToMyWs(client, request);
        const webSocketStream = createWebSocketStream(myWebSocket as MyWebSocket);

        this.callAsyncAndWaitForResult(myWebSocket, request).then(() => {
          this.setupWebSocketListeners(webSocketStream, myWebSocket);
          // TODO: Login

        }).catch((error) => {
          this.eV.handleError(SubEventTypes.ERROR.FATAL, `Server ON upgrade`, MainEventTypes.SERVER, new Error(`Error on upgrade`), error);
        });
      });
    });

    try {
      _serverCert.listen(this.settings.server.streamServerPort, this.settings.server.ip, () => {
        this.stats.updateLastUpdates("server", "createServer", true);
        this.startPidWatcher();
        this.stats.server.webHandle.isAlive = true;
        this.eV.emit(MainEventTypes.BASIC, {
          subType: SubEventTypes.BASIC.SERVER,
          message: `listen | listening on ${this.settings.server.ip}:${this.settings.server.streamServerPort}`,
          success: true,
        });
        // const serverEvent: IBaseEvent = {
        //   subType: SubEventTypes.SERVER.LISTEN,
        //   message: 'listen | serverCreated',
        //   success: true,
        // };
        // this.setupWebSocketListeners();
        // this.eV.emit(MainEventTypes.SERVER, serverEvent);
      });
    } catch (error) {
      const serverEvent: IBaseEvent = {
        subType: SubEventTypes.SERVER.KILLED,
        message: 'listen | serverDeath',
        success: true,
      };
      // this.setupWebSocketListeners();
      this.eV.emit(MainEventTypes.SERVER, serverEvent);
      this.stats.server.webHandle.isAlive = false;
      this.eV.handleError(SubEventTypes.ERROR.FATAL, `listen | ERROR`, MainEventTypes.SERVER, new Error("Error creating server"), error);
    }
  }
  private async updatePid(): Promise<void> {
    this.stats.updateLastUpdates("server", "updatePid");
    try {
      const data = await readFile(this.settings.pid.file, 'utf-8' as BufferEncoding);
      if (!data || !(data.length > 0)) throw `No data in pid file: ${this.settings.pid.file}`;
      this.stats.global.pid.fileExists = true;
      this.settings.pid.pid = parseInt(data, 10)

      if (!this.stats.global.pid.fileExists || !this.settings.pid.pid || typeof this.settings.pid.pid !== 'number' || !(this.settings.pid.pid > 0)) throw new Error(`updatePid | pid: ${this.settings.pid.pid}`);
      this.stats.global.pid.fileReadable = true;
      const pidEvent: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_AVAILABLE, // Define an appropriate subType
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.MAIN, pidEvent);
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.stats.updateLastUpdates("server", "updatePid", true);
      // ... restliche Logik zum Verarbeiten der neuen PID
    } catch (error) {
      const pidEvent: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_UNAVAILABLE, // Define an appropriate subType
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: false,
      };
      this.eV.emit(MainEventTypes.MAIN, pidEvent);
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.stats.global.pid.fileReadable = false;
      this.settings.pid.pid = "NaN";
      this.stats.global.pid.processFound = false;
      this.eV.handleError(SubEventTypes.ERROR.INFO, "updatePid | ERROR", MainEventTypes.STATS, new Error(`pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
    }
  }

  public async startPidWatcher(): Promise<void> {
    this.stats.updateLastUpdates("server", "startPidWatcher");
    this.updatePid().then(() => {
      this.server.pidWatcher = fs.watch(this.settings.pid.file, (eventType, file) => {
        this.eV.emit(MainEventTypes.BASIC, {
          subType: SubEventTypes.BASIC.STATS,
          message: `startPidWatcher | eventType: ${eventType}, file: ${file}`,
          success: true,
        });
        if (eventType === 'change') {
          this.updatePid(); // Neue Funktion zum erneuten Einlesen
        }
      });
    }).catch((error) => {
      this.stats.updateLastUpdates("server", "startPidWatcher");
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "startPidWatcher", MainEventTypes.STATS, new Error(`startPidWatcher | pidFileExists: ${this.stats.global.pid.fileExists}, pid file readable: ${this.stats.global.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
      this.stats.global.pid.fileReadable = false;
      this.stats.global.pid.fileExists = false;
      this.settings.pid.pid = "NaN";
    });
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server.web.handleUpgrade(request, socket, head, callback);
  }
}
