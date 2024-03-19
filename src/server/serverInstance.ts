"use strict";
import "reflect-metadata";

// Interfaces (potentially in a separate file, interfaces.ts)
import { WebSocketServer, WebSocket } from 'ws'
import { RconConnection } from "../rcon/lib/server/connection";
import * as fs from 'fs';
import { stats } from '../global/containerWrapper';
import Logger from "../global/fileLogger";

interface IHandle {
  web: WebSocketServer;
  file: Logger;
  rcon: RconConnection;
  pidWatcher: fs.FSWatcher;
  statsIntval: NodeJS.Timeout;
}

export interface IServerWrapper {
  handle: IHandle;
}

export class serverWrapper {
  rcon = new RconConnection();
  file: Logger = new Logger(new Date().toISOString().replace(/[:.]/g, '-'));
  pidWatcher = fs.watch;
  web = new WebSocketServer({ noServer: true });
  statsIntval = setInterval(() => { }, 10000);
  constructor() {
    clearInterval(this.statsIntval);
  }
}



  // public killAll() {
  //   // console.log('no please!');
  // }
  // getHandleProperty(property: string): any {
  //    return this.server.getHandleProperty(property);
  // }

  // setHandleProperty(property: string, value: any): void {
  //   this.server.setHandleProperty(property, value);
  // }
