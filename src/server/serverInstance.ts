"use strict";
import "reflect-metadata";

// Interfaces (potentially in a separate file, interfaces.ts)
import { WebSocketServer, WebSocket } from 'ws'
import { RconConnection } from "../rcon/lib/server/connection";

interface IHandle {
  web: WebSocketServer;
  file: WebSocketServer;
}
interface IHandleStats {
  dummy: number;
}
interface IHandleSettings {
  certPath: string;
  keyPath: string;
  ip: string;
  streamServerPort: number;
}
export interface IServerWrapper {
  handle: IHandle;
  stats: IHandleStats;
  settings: IHandleSettings;
}

export class serverWrapper implements IServerWrapper {
  handle: IHandle = {
    web: new WebSocketServer({ noServer: true }),
    file: new WebSocketServer({ noServer: true }),
  };
  stats: IHandleStats = { dummy: 0 };
  settings: IHandleSettings = {
    certPath: '/etc/letsencrypt/live/neo.dnsfor.me/cert.pem',
    keyPath: '/etc/letsencrypt/live/neo.dnsfor.me/privkey.pem',
    ip: "0.0.0.0",
    streamServerPort: 8080,
  };
  
  // public killAll() {
  //   console.log('no please!');
  // }
  // getHandleProperty(property: string): any {
  //    return this.server.getHandleProperty(property);
  // }

  // setHandleProperty(property: string, value: any): void {
  //   this.server.setHandleProperty(property, value);
  // }
}
