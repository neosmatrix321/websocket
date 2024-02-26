// globalValues.ts
import { IMainService } from './interfaces';

export interface IGlobalValues {
  stats: IStats;
  main: IMainService;  // Hauptdienst-Referenz für die Interaktion
}

export interface IStats {
  clientsConnected: number;
  serverUptime: number;
  webHandleStatus: IHandleStatus;  // Ersetzen von Basisarten
  fileHandleStatus: IHandleStatus;
  // ...weitere Statistiken
}

export interface IHandleStatus {
  isAlive: boolean;
  hasConnection: boolean;
  // ...weitere Handle-spezifische Status
}
//server.ts
import { IHandleStatus } from './globalValues';

export interface IServerWrapper {
  handle: {
    web: IWebHandle;
    file: IFileHandle;
  }
  start(): void;
  stop(): void;
  // ...weitere serverbezogene Methoden
}

export interface IWebHandle {
  getStatus(): IHandleStatus;
  // ...weitere Methoden für die Webverbindung
}

export interface IFileHandle {
  getStatus(): IHandleStatus;
  // ...weitere Methoden für die Dateiverbindung
}

// (Implementierung von ServerWrapper hier)
// privateSettings.ts
export interface IPrivateSettings {
  apiKey: string;
  adminPassword: string;
  // ...weitere private Einstellungen 
}

// (Implementierung von privateSettings hier)
// clients.ts 
export interface IClient {
  id: string; 
  settings: IClientSettings;
  // ...weitere Client-Eigenschaften
}

export interface IClientSettings {
  // ... Client-spezifische Einstellungen
}

// (Implementierung von UniqueClient und ClientContainer hier)
// main.ts
import { Injectable, Inject } from './Injectable';
import { IGlobalValues } from './globalValues';
import { ServerWrapper, SERVER_WRAPPER_TOKEN } from './server';
import { ClientContainer, CLIENT_COLLECTOR_TOKEN } from './clients'; // Wichtiger Import
import { IPrivateSettings, PRIVATE_SETTINGS_TOKEN } from './privateSettings';
import { Container } from 'inversify';

@Injectable()
export class MainService {
  private _globalValues: IGlobalValues;
  protected _server: ServerWrapper;
  protected _settings: IPrivateSettings;
  protected _clients: ClientContainer;

  constructor(
    @Inject(GLOBAL_VALUES_TOKEN) globalValues: IGlobalValues,
    @Inject(SERVER_WRAPPER_TOKEN) server: ServerWrapper,
    @Inject(CLIENT_COLLECTOR_TOKEN) clients: ClientContainer // Clients-Injection
    @Inject(PRIVATE_SETTINGS_TOKEN) settings: IPrivateSettings
  ) {
    this._globalValues = globalValues;
    this._server = server;
    this._settings = settings;
    this._clients = clients;
  }

  // ...Implementierung der Hauptmethoden 
}
// bindConfig.ts (Beispielhafte Konfigurationsdatei)
import { Container } from 'inversify';
import { ServerWrapper, SERVER_WRAPPER_TOKEN, MainService, MAIN_SERVICE_TOKEN, /*...weitere Imports */ } from './...';

const container = new Container();

container.bind<MainService>(MAIN_SERVICE_TOKEN).to(MainService).inSingletonScope();
container.bind<ServerWrapper>(SERVER_WRAPPER_TOKEN).to(ServerWrapper).inSingletonScope();
// ...weitere Bindungen hinzufügen
