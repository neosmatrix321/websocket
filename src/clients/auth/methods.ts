"use strict";
// import { IClient, ClientType } from "../client/clientInstance";

// export class AdvancedClient implements IClient {
//   id: string;
//   type: ClientType = ClientType.Advanced;
//   settings: IClientSettings;
//   stats: IClientStats;

//   constructor(id: string, settings: IClientSettings) {
//     this.id = id;
//     this.settings = settings;
//     this.stats = { };
//   }

//   connect(): void {
//     // Implementiere die erweiterte Verbindungslogik
//   }

//   disconnect(): void {
//     // Implementiere die erweiterte Trennungslogik
//   }

//   sendMessage(message: string): void {
//     // Implementiere die Nachrichtenversandlogik
//   }

//   receiveMessage(message: string): void {
//     // Implementiere die Nachrichtenempfangslogik
//   }
// }

// export class BasicClient implements IClient {
//   id: string;
//   type: ClientType = ClientType.Basic;
//   settings: IClientSettings;
//   stats: IClientStats;

//   constructor(id: string, settings: IClientSettings) {
//     this.id = id;
//     this.settings = settings;
//     this.stats = { };
//   }

//   connect(): void {
//     // Implementiere die Verbindungslogik
//   }

//   disconnect(): void {
//     // Implementiere die Trennungslogik
//   }
// }