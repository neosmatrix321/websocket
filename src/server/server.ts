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
import { parsePlayers, splitInfo } from '../rcon/lib/player';
import * as fs from 'fs';
import { settingsWrapper } from '../settings/settingsInstance';
import { statsWrapper } from '../global/statsInstance';
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
    const id = myWebSocket.id;
    webSocketStream.on('end', () => {
      // console.log('WebSocket connection ended');
      const disconnectEvent: IClientsEvent = {
        subType: SubEventTypes.CLIENTS.UNSUBSCRIBE,
        message: `Client (${myWebSocket.id}) unsubscribed`,
        success: true,
        id: id,
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
        message: `Client error id: ${id}`,
        success: false,
        type: [],
        data: { ...error },
        id: id,
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
            id: id,
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
            id: 'ALL',
            type: ["serverMessage"],
            client: myWebSocket,
            data: message
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
            id: id,
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
      let subType = typeof event.subType === 'string' ? event.subType : 'no subtype';
      let message = typeof event.message === 'string' ? event.message : `no message | ${subType}`;
      let success = typeof event.success === 'boolean' ? event.success : false;
      let json = typeof event.json !== 'undefined' ? event.json : { "no": "json" };

      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.SERVER,
        success: success,
        message: message,
        json: json,
      };
      if (subType != SubEventTypes.SERVER.RCON_GET_STATS) this.eV.emit(MainEventTypes.BASIC, newEvent);
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
        case SubEventTypes.SERVER.PREPARE:
          this.testIfPortIsOpen();
          break;
        case SubEventTypes.SERVER.RCON_GET_STATS:
          this.rconGetStats();
          break;
        case SubEventTypes.SERVER.RCON_DISCONNECT:
          this.rconDisconnect();
          break;
        default:
        // console.warn('Unknown server event subtype:', event.subType);
      }
    });
  }

  private async testIfPortIsOpen() {
    this.server.rcon.isPortOpen(this.settings.rcon.host, this.settings.rcon.port).then((isRconPortOpen) => {
      this.stats.global.rcon.portOpen = isRconPortOpen;
    });
  }

  private rconDisconnect() {
    this.stats.updateLastUpdates("server", "rconDisconnect");
    if (this.server.rcon.client) {
      this.server.rcon.client.destroy();
      this.stats.global.rcon.isConnected = false;
      // const newEvent: IBaseEvent = {
      //   subType: SubEventTypes.BASIC.SERVER,
      //   message: `RCON -> disconnected`,
      //   success: true,
      // };
      // this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.stats.updateLastUpdates("server", "rconDisconnect", true);
    }
  }

  private async rconGetStatsInfo(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!this.stats.global.rcon.isConnected) resolve(false);
      this.stats.updateLastUpdates("server", "rconGetStatsInfo");
      this.server.rcon.exec('Info').then((info) => {
        if (!info.body) throw new Error(`No info from rcon`);
        this.stats.global.rcon.info = splitInfo(info.body);
        this.stats.updateLastUpdates("server", "rconGetStatsInfo", true);
        resolve(true);
      }).catch(() => {
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.SERVER, message: `RCON Info`, success: this.stats.server.lastUpdates.rconGetStatsInfo.success });
        resolve(false);
      });
    });
  }

  private async rconGetStatsPlayers(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!this.stats.global.rcon.isConnected) return;
      this.stats.updateLastUpdates("server", "rconGetStatsPlayers");
      this.server.rcon.exec('ShowPlayers').then((players) => {
        if (!players.body) throw new Error(`No players from rcon`);
        const playerArray = (players.body != "name,playeruid,steamid\n") ? parsePlayers(players.body) : [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        this.stats.global.rcon.players = (playerArray[0]) ? playerArray : [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        this.stats.updateLastUpdates("server", "rconGetStatsPlayers", true);
        resolve(true);
      }).catch(() => {
        this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.SERVER, message: `RCON ShowPlayers`, success: this.stats.server.lastUpdates.rconGetStatsPlayers.success });
        // this.stats.global.rcon.players = [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        // this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON ShowPlayers`, MainEventTypes.STATS, new Error(`rconGetStatsPlayers failed ${error.message || 'no error message'}`), error);
        resolve(false);
      });
    });
  }

  private async rconGetStats(force: boolean = false): Promise<void> {
    await this.testIfPortIsOpen();
    if (!this.stats.global.rcon.portOpen || force || !this.stats.server.lastUpdates.rconGetStatsPlayers.last || (Date.now() - this.stats.server.lastUpdates.rconGetStatsPlayers.last) > 5000) {
      await this.server.rcon.connect();

      await this.rconGetStatsPlayers();
        
      if (force || !this.stats.server.lastUpdates.rconGetStatsInfo.last || (Date.now() - this.stats.server.lastUpdates.rconGetStatsInfo.last) > 60000) {
        await this.rconGetStatsInfo();
      }
    }
  }

  async sendRconCommand(command: string): Promise<string | undefined> {
    // if (!this.server.rcon || !this.stats.global.rcon.isConnected || !this.server.rcon.client) return undefined;
    try {
      // Ensure RCON connection if not open? rconConnection.connect();
      const response = await this.server.rcon.exec(command);
      // if (!response) return undefined;
      return response.body; // Or format the response if needed
    } catch (error: any) {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Command`, MainEventTypes.STATS, new Error(error.message || 'no error message'), error);
      // Return an error message
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
    this.stats.updateLastUpdates("main", "init");
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
        this.eV.emit(MainEventTypes.MAIN, {
          subType: SubEventTypes.MAIN.START,
          message: `CREATE -> MAIN.START`,
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

  private async updatePid(eventType: string = 'updatePid first'): Promise<void> {
    let message = `update Pid started`;
    this.stats.global.pid.fileExists = false;
    this.stats.global.pid.processFound = false;
    this.stats.global.pid.fileReadable = false;
    this.settings.pid.pid = 0;
    this.stats.updateLastUpdates("server", "updatePid");
    try {
      const data = await readFile(this.settings.pid.file, 'utf-8' as BufferEncoding);
      if (!data || !(data.length > 0)) {
        throw new Error(`No data in pid file`);
      }
      this.stats.global.pid.fileExists = true;
      this.stats.global.pid.fileReadable = true;
      this.settings.pid.pid = parseInt(data, 10);

      if (!this.settings.pid.pid || typeof this.settings.pid.pid !== 'number' || !(this.settings.pid.pid > 0)) {
        this.settings.pid.pid = 0;
        throw new Error(`Invalid pid number`)
      }
      this.stats.global.pid.processFound = true;
    } catch (error: any) {
      message = error.message || `no error message`;
    }
    const pidEvent: IBaseEvent = {
      subType: SubEventTypes.MAIN.PID_AVAILABLE, // Define an appropriate subType
      message: `updatePid -> ${eventType} | pid: ${this.settings.pid.pid} | ${message}`,
      success: this.stats.global.pid.processFound,
    };
    this.eV.emit(MainEventTypes.MAIN, pidEvent);
  }

  public async startPidWatcher(): Promise<void> {
    this.stats.updateLastUpdates("server", "startPidWatcher");
    if (!this.stats.global.widget.pid && process.pid) this.stats.global.widget.pid = process.pid;
    await this.updatePid();
    // .then(() => {
    try {
      this.server.pidWatcher = fs.watch(this.settings.pid.file, (eventType) => {
        this.updatePid(eventType); // Neue Funktion zum erneuten Einlesen
        // if (eventType === 'change') {
        // }
      });
    } catch (error: any) {
      this.settings.pid.pid = 0;
      this.stats.global.pid.fileReadable = false;
      this.stats.global.pid.fileExists = false;
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "startPidWatcher", MainEventTypes.STATS, new Error(`${(error.message || `no error message`)}`), error);
    }
    this.stats.updateLastUpdates("server", "startPidWatcher", true);
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server.web.handleUpgrade(request, socket, head, callback);
  }
}
