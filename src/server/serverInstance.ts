"use strict";
import "reflect-metadata";
import { inject, injectable, optional } from 'inversify';

// Interfaces (potentially in a separate file, interfaces.ts)
import { WebSocketServer, WebSocket } from 'ws'
export interface MyWebSocket extends WebSocket {
        id: string
    }
interface IHandle {
  web: WebSocketServer;
  file: any;
}
interface IHandleStats {

}
export interface IHandleWrapper  {
  _handle: IHandle; 
  _stats: IHandleStats;
}

export interface IserverWrapper {
  killAll(): void;
}

@injectable()
export class serverWrapper {
  protected _server: IHandleWrapper;
  public constructor(@inject(SERVER_WRAPPER_TOKEN) @optional() server: IHandleWrapper) {
    this._server = server || {
      _handle: {
        web: null,
        file: null
      },
      _stats: null
    };
  }

  public killAll() {
    console.log('no please!');
  }
  // getHandleProperty(property: string): any {
  //    return this._server.getHandleProperty(property);
  // }

  // setHandleProperty(property: string, value: any): void {
  //   this._server.setHandleProperty(property, value);
  // }
}

export const SERVER_WRAPPER_TOKEN = Symbol('ServerService');
