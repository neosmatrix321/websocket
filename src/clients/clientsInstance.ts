"use strict";
import "reflect-metadata";

import { inject, injectable, optional } from "inversify";
import { IClient } from "./client/clientInstance";

export interface IClientsWrapper {
  _clients: Map<string, IClient>;
}

export interface IClientsService {
  addClient(client: IClient): void;
  removeClient(clientId: string): void;
  getClient(clientId: string): IClient | undefined;
  getAllClients(): IClient[];
  // findClient(predicate: (client: IClient) => boolean): IClient | undefined;
  // notifyClients(event: string, data: any): void;
}


@injectable()
export class clientsWrapper {
  private readonly _clients: Map<string, IClient>;
  public constructor(@inject(CLIENTS_WRAPPER_TOKEN) @optional() clientsInstance:  Map<string, IClient>) {
    this._clients = clientsInstance ?? new Map<string, IClient>();
  }

  public addClient(client: IClient): void {
    if (!client.info || !client.info.id) {
      throw new Error('Client is missing an ID');
    }
    this._clients.set(client.info.id, client);
  }

  public removeClient(clientId: string): void {
    this._clients.delete(clientId);
  }

  public getClient(clientId: string): IClient | undefined {
    return this._clients.get(clientId);
  }

  public getAllClients(): IClient[] {
    return Array.from(this._clients.values());
  }
  // public get client(): IClient {
  //   return this._client;
  // }

  // public set client(clientInstance: IClient) {
  //   this._client = clientInstance;
  // }
  // findClient(predicate: (client: IClient) => boolean): IClient | undefined {
  //   for (const client of this._clients.values()) {
  //     if (predicate(client)) {
  //       return client;
  //     }
  //   }
  //   return undefined;
  // }

  // notifyClients(event: string, data?: object | null): void {
  //   for (const client of this._clients.values()) {
  //     client.receiveMessage(event, data);
  //   }
  // }
}

export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');


