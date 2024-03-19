"use strict";
import { inject, injectable, postConstruct } from 'inversify';
import 'reflect-metadata';

import { readFile } from 'node:fs/promises';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';

import { EventEmitterMixin } from "../global/EventEmitterMixin";
import { serverWrapper, IServerWrapper } from "../server/serverInstance";
import { MainEventTypes, IEventTypes, SubEventTypes, IBaseEvent, BaseEvent, IClientsEvent, debugDataCallback, IServerEvent, IStatsEvent, IMainEvent } from "../global/eventInterface";
import { ClientType, MyWebSocket } from '../clients/clientInstance';
import { RconConnection } from '../rcon/lib/server/connection'; // Adjust the path
import { parsePlayers, splitInfo } from '../rcon/lib/player';
import * as fs from 'fs';
import { SettingsWrapperSymbol, settingsWrapper } from '../settings/settingsInstance';
import { StatsWrapperSymbol, statsWrapper } from "../stats/statsInstance";
import { get } from 'systeminformation';
import { SERVER_WRAPPER_TOKEN } from '../main';
import { settingsContainer, statsContainer } from '../global/containerWrapper';



@injectable()
export class Server {
  private eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  @inject(() => SERVER_WRAPPER_TOKEN) protected server: serverWrapper = new serverWrapper();
  protected settings: settingsWrapper = settingsContainer;
  protected stats: statsWrapper = statsContainer;

  constructor() {
    // this.setupWebSocketListeners();
    this.eV.on(MainEventTypes.SERVER, this.handleServerEvent.bind(this));
    this.server.statsIntval = setInterval(() => {}, 1000);
    clearInterval(this.server.statsIntval);
    this.stats.global.intvalStats.idleStart = Date.now();
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
  public handleServerEvent(event: IEventTypes) {
    switch (event.subType) {
      case SubEventTypes.SERVER.LISTEN:
        console.log('Server listen event');
        this.getPid();
        break;
      case SubEventTypes.SERVER.KILLED:
        this.stats.server.webHandle.isAlive = false;
        this.eV.handleError(SubEventTypes.ERROR.FATAL, "Server killed", MainEventTypes.SERVER, new Error("Server killed"));
      case SubEventTypes.SERVER.START:
        console.log("Server start event");
        this.createServer();
        break;
      case SubEventTypes.SERVER.START_INTERVAL:
        this.intervalStart();
        break;
      case SubEventTypes.SERVER.STOP_INTERVAL:
        this.intervalStop();
        break;
      case SubEventTypes.SERVER.PRINT_DEBUG:
        // console.log("Server:");
        // console.dir(this.server, { depth: 2, colors: true });
        break;
        case SubEventTypes.STATS.RCON_CONNECT:
          try {
            this.rconConnect().then(() => {
              this.sendRconCommand('info').then((response) => {
              });
            });
          } catch (error) {
            this.eV.handleError(SubEventTypes.ERROR.WARNING, "Rcon connect error", MainEventTypes.STATS, new Error("weird"), error);
          }
          // this.serverActive(event);
          break;
        case SubEventTypes.STATS.RCON_DISCONNECT:
          this.rconDisconnect();
          // this.serverActive(event);
          break;
        default:
        // console.warn('Unknown server event subtype:', event.subType);
    }
  }
  async rconConnect(): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "rconConnect": Date.now() };
    try {
      const RCON_HOSTNAME = this.settings.rcon.host;
      const RCON_PORT = this.settings.rcon.port;
      const RCON_PASSWORD = this.settings.rcon.pw;

      await this.server.rcon.connect(RCON_HOSTNAME, RCON_PORT, RCON_PASSWORD);
      if (!this.server.rcon.connectedWithoutError) throw new Error(`RCON connected with error`);
      this.settings.rcon.isConnected = true;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON connected`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
      this.rconGetStats();
    } catch (error: any) {
      this.settings.rcon.isConnected = false;
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
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "rconDisconnect": Date.now() };
    if (this.server.rcon) {
      this.server.rcon.client.resetAndDestroy();
      this.settings.rcon.isConnected = false;
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `RCON`,
        success: false,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
    }
  }

  async rconGetStats(force: boolean = false): Promise<void> {
    if (!this.settings.rcon.isConnected) return this.eV.emit(MainEventTypes.BASIC, { subType: SubEventTypes.BASIC.STATS, message: `RCON not connected`, success: false });
    if (force || !this.stats.global.lastUpdates.rconGetStatsInfo || (Date.now() - this.stats.global.lastUpdates.rconGetStatsInfo) > 60000) {
      try {
        const info = await this.sendRconCommand('Info');
        if (!info) throw new Error(`No info from rcon`);
        this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "rconGetStatsInfo": Date.now() };
        this.stats.global.rcon.info = splitInfo(info);
        const rconInfoEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconInfo updated ${this.stats.global.lastUpdates.rconGetStatsInfo}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, rconInfoEvent);
      } catch (error) {
        this.stats.global.rcon.info = { name: "NaN", ver: "NaN" };
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Info`, MainEventTypes.STATS, new Error(`rconGetStatsInfo failed`), error);
      };
    }
    if (!this.stats.global.lastUpdates.rconGetStatsShowPlayers || (Date.now() - this.stats.global.lastUpdates.rconGetStatsShowPlayers) > 5000) {
      try {
        const players = await this.sendRconCommand('ShowPlayers');
        if (!players) throw new Error(`No players from rcon`);
        this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "rconGetStatsShowPlayers": Date.now() };
        this.stats.global.rcon.players = parsePlayers(players);
        const rconPlayersEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `rconPlayers updated ${this.stats.global.lastUpdates.rconGetStatsShowPlayers}`,
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, rconPlayersEvent);
      } catch (error) {
        this.stats.global.rcon.players = [{ name: "NaN", playeruid: "NaN", steamid: "NaN" }];
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON ShowPlayers`, MainEventTypes.STATS, new Error("rconGetStatsShowPlayers failed"), error);
      }
    }
  }
  async sendRconCommand(command: string): Promise<string | undefined> {
    if (this.server.rcon && this.settings.rcon.isConnected) {
      try {
        // Ensure RCON connection if not open? rconConnection.connect();
        const response = await this.server.rcon.exec(command);
        return response.body; // Or format the response if needed
      } catch (error) {
        this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON Command`, MainEventTypes.STATS, new Error("sedRconCommand failed"), error);
        // Return an error message
      }
    } else {
      this.eV.handleError(SubEventTypes.ERROR.INFO, `RCON`, MainEventTypes.STATS, new Error("RCON not connected"), { isConnected: this.settings.rcon.isConnected });
    }
  }

  private wsToMyWs(client: WebSocket, request: IncomingMessage): MyWebSocket {
    const ws = client as MyWebSocket;
    if (
      typeof ws.id === 'string' &&
      typeof ws.ip === 'string' &&
      typeof ws.type === typeof ClientType
    ) {
      return ws;
    }
    const newID = request.headers['sec-websocket-key'] as string;
    let newIP;
    let newType;
    if (newID && '_socket' in ws) {
      newIP = (ws as any)._socket.remoteAddress;
      newType = this.getClientType(newIP, { admin: 1 });
    }

    if (!newID || !newIP) this.eV.handleError(SubEventTypes.ERROR.FATAL, `wsToMyWs`, MainEventTypes.SERVER, new Error(`invalid id ( ${newID} ) || ip ( ${newIP} )`), ws);
    const newClient = ws as MyWebSocket;
    newClient.id = newID || `${Date.now()}`;
    newClient.ip = newIP || 'NaN';
    newClient.type = newType || ClientType.Basic;

    return newClient;
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
        cert: readFileSync(this.settings.server.certPath),
        key: readFileSync(this.settings.server.keyPath)
      });

      _serverCert.on('upgrade', (request, socket, head) => {
        //  ... adjust upgrade handling as needed ...
        this.server.web.handleUpgrade(request, socket, head, (client: WebSocket, request: IncomingMessage) => {
          const webSocketStream = createWebSocketStream(client as MyWebSocket | WebSocket, { objectMode: true });
          // TODO: Login

          const finalClient: MyWebSocket = this.wsToMyWs(client, request);

          if (typeof finalClient.id !== "string" || !finalClient.type) return this.eV.handleError(SubEventTypes.ERROR.FATAL, `Server OM upgrade`, MainEventTypes.SERVER, new Error(`Server secure upgrade failed?`), finalClient);

          webSocketStream.on('end', () => {
            // console.log('WebSocket connection ended');
            const disconnectEvent: IClientsEvent = {
              subType: SubEventTypes.CLIENTS.UNSUBSCRIBE,
              message: `Client disconnected id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              id: finalClient.id,
              client: finalClient
             };
            this.eV.emit(MainEventTypes.CLIENTS, disconnectEvent);
          });

          webSocketStream.on('error', (error) => {
            const connectEvent: IClientsEvent = {
              subType: SubEventTypes.CLIENTS.UNSUBSCRIBE,
              message: `Client error id: ${request.headers['sec-websocket-key']}`,
              success: true,
              data: request,
              id: finalClient.id,
              client: finalClient
             };
            this.eV.emit(MainEventTypes.CLIENTS, connectEvent);
            this.eV.handleError(SubEventTypes.ERROR.INFO, `Websocket Server`, MainEventTypes.SERVER, new Error(`Client error`), error);
          });
          webSocketStream.on('data', (data: Buffer) => { // Buffer type for data
            try {
              const message = JSON.parse(data.toString());
              switch (true) {
                case (message.greeting !== undefined):
                  const greetingEvent: IClientsEvent = {
                    subType: SubEventTypes.CLIENTS.GREETING,
                    message: message.greeting,
                    success: true,
                    id: finalClient.id,
                    client: finalClient,
                    data: message
                  };
                  this.eV.emit(MainEventTypes.CLIENTS, greetingEvent);
                  break;
                case (message.serverMessage !== undefined):
                  const serverEvent: IClientsEvent = {
                    subType: SubEventTypes.CLIENTS.MESSAGE_READY,
                    message: `serverMessage`,
                    success: true,
                    id: finalClient.id,
                    client: finalClient,
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
                    id: finalClient.id,
                    client: finalClient,
                    data: request
                  };
                  this.eV.emit(MainEventTypes.CLIENTS, otherEvent);
              }
            } catch (error) {
              this.eV.handleError(SubEventTypes.ERROR.WARNING, `Server ON data`, MainEventTypes.SERVER, new Error(`Error parsing data`), error);
            }
          });
        });
      });


      _serverCert.listen(this.settings.server.streamServerPort, this.settings.server.ip, () => {
        // console.log(this.server.web.eventNames());
        // console.log(`HTTPS server ${this.settings.server.ip} listening on ${this.settings.server.streamServerPort}`);
        this.getPid();

        this.stats.server.webHandle.isAlive = true;
        this.eV.emit(MainEventTypes.BASIC, {
          subType: SubEventTypes.BASIC.SERVER,
          message: `listen | listening on ${this.settings.server.ip}:${this.settings.server.streamServerPort}`,
          success: true,
        });
        const serverEvent: IBaseEvent = {
          subType: SubEventTypes.SERVER.LISTEN,
          message: 'listen | serverCreated',
          success: true,
        };
        // this.setupWebSocketListeners();
        this.eV.emit(MainEventTypes.SERVER, serverEvent);
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
  private async updatePid() {
    try {
      const data = await readFile(this.settings.pid.file, 'utf-8' as BufferEncoding);
      if (!data || !(data.length > 0)) throw `No data in pid file: ${this.settings.pid.file}`;
      this.settings.pid.fileExists = true;
      this.settings.pid.pid = parseInt(data, 10)

      if (!this.settings.pid.fileExists || !this.settings.pid.pid || typeof this.settings.pid.pid !== 'number' || !(this.settings.pid.pid > 0)) throw new Error(`updatePid | pid: ${this.settings.pid.pid}`);
      this.settings.pid.fileReadable = true;
      const pidEvent: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_AVAILABLE, // Define an appropriate subType
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: true,
      };

      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `updatePid | pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.BASIC, newEvent);
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
      this.settings.pid.fileReadable = false;
      this.settings.pid.pid = "NaN";
      this.settings.pid.processFound = false;
      this.eV.handleError(SubEventTypes.ERROR.INFO, "updatePid | ERROR", MainEventTypes.STATS, new Error(`pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
    }
  }

  public async getPid(): Promise<void> {
    this.stats.global.lastUpdates = { ...this.stats.global.lastUpdates, "getPid": Date.now() };
    this.updatePid().then(() => {
      this.server.pidWatcher(this.settings.pid.file, (eventType, file) => {
        if (eventType === 'change') {
          this.updatePid(); // Neue Funktion zum erneuten Einlesen
        }
      });
      const newEvent: IBaseEvent = {
        subType: SubEventTypes.BASIC.STATS,
        message: `getPid | Pid Watcher online`,
        success: true,
      };
      this.eV.emit(MainEventTypes.MAIN, newEvent);
      const resultData: IBaseEvent = {
        subType: SubEventTypes.MAIN.PID_AVAILABLE,
        message: `getPid | pid: ${this.settings.pid.pid}`,
        success: true,
      };
      this.eV.emit(MainEventTypes.MAIN, resultData);
    }).catch((error) => {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "getPid", MainEventTypes.STATS, new Error(`getPid | pidFileExists: ${this.settings.pid.fileExists}, pid file readable: ${this.settings.pid.fileReadable}, pid: ${this.settings.pid.pid}, SI pid: ${this.stats.global.si.pid}`), error);
      this.settings.pid.fileReadable = false;
      this.settings.pid.fileExists = false;
      this.settings.pid.pid = "NaN";
    });
  }

  handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (ws: any) => void) {
    this.server.web.handleUpgrade(request, socket, head, callback);
  }
  private intervalStart() {
    if (!this.server.statsIntval) {
      this.eV.emit(MainEventTypes.CLIENTS, {
        subType: SubEventTypes.CLIENTS.UPDATE_ALL_STATS
      });
      // console.log(`intervalStart: Interval started, idle time: ${this.intvalStats.idleEnd - this.intvalStats.idleStart}ms.`);
      this.server.statsIntval = setInterval(() => {
        this.eV.emit(MainEventTypes.STATS, {
          subType: SubEventTypes.STATS.UPDATE_ALL
        });
        this.eV.emit(MainEventTypes.CLIENTS, {
          subType: SubEventTypes.CLIENTS.UPDATE_ALL_STATS
        });
        // this.clients.handleClientsUpdateStats();
      }, 1000);
    }
    //  else {
    //   // console.log("intervalStart: no action taken. clientsCounter:");
    // }
  }

  private intervalStop() {
    if (this.server.statsIntval) {
      this.stats.global.intvalStats.idleStart = Date.now();

      clearInterval(this.server.statsIntval);
      // console.log("intervalStop: Interval stopped.");
    }
    //  else {
    //   // console.log("intervalStop: no action taken. clientsCounter:");
    // }
  }
}
