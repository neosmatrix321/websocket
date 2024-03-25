"use strict";
import "reflect-metadata";

// Interfaces (potentially in a separate file, interfaces.ts)
import { WebSocketServer } from 'ws'
import { RconConnection } from "../rcon/lib/server/connection";
import * as fs from 'fs';
import Logger from "../global/fileLogger";

export interface IHandle {
  web: WebSocketServer;
  file: Logger;
  rcon: RconConnection;
  pidWatcher: fs.FSWatcher | undefined;
}

export interface IServerWrapper {
  server: IHandle;
}

export class serverWrapper implements IHandle {
  rcon = new RconConnection();
  file: Logger = new Logger(new Date().toISOString().replace(/[:.]/g, '-'));
  pidWatcher: fs.FSWatcher | undefined = undefined;
  web = new WebSocketServer({ noServer: true });
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
