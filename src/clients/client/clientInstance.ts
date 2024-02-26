"use strict";
export enum ClientType {
  Basic,
  Admin,
  Server
  // ...
}

export interface IClientInfo {
  id: string;
  ip: string;
}
export interface IClientStats {
  eventCount: number;
  lastUpdates: Record<string, number>;
  messagesReceived: string[];
  messagesToSend: string[];
  latency: number;
}
export interface IClientConfig {
  type: ClientType; // 'basic' | 'advanced' | ...
}
export interface IClientSettings {
  pw_hash: string | false;
}
export interface IClientSuper {
  custom_intervall_time: number | false;
}

export interface IClientService extends IClient { 
    connect(): void;
    disconnect(): void;
    update(): void;
    sendMessage(message: string): void;
    receiveMessage(message: string, data?: object | null): void;
  // ...weitere Methoden für die Client-Funktionen
}

export interface IClient extends clientWrapper {
  info: IClientInfo;
  _stats?: IClientStats;
  _config?: IClientConfig; // Generisches Objekt für Konfiguration
  _settings?: IClientSettings;
  _super?: IClientSuper;
}

// client.ts
export class clientWrapper {
  info: IClientInfo;
  private constructor(newID: string, newIP: string) { this.info = { id: newID, ip: newIP }; }
  connect(): void {
    console.log('lets connect!');
  }
  disconnect(): void {
    return;
  }
  update(): void {
    return;
  }
  sendMessage(message: string): void {
    return;
  }
  receiveMessage(message: string, data?: object | null): void {
    return;
  }

} 
 