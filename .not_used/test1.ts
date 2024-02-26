// globalValues.ts
export interface IGlobalValues {
    stats: IStats;
    // ...weitere globale Werte, die du benötigst
  }
  
  export interface IStats {
    clientsConnected: number;
    serverUptime: number;
    // ...weitere Statistiken, die du benötigst 
  }
  
  // server.ts
  export interface IWebHandle {
    // ... Eigenschaften und Methoden, die sich auf die Web-Verbindung beziehen
  }
  
  export interface IFileHandle {
    // ... Eigenschaften und Methoden, die sich auf die Datei-Verbindung beziehen
  }
  
  export interface IServerWrapper {
    handle: {
      web: IWebHandle;
      file: IFileHandle;
    }
    start(): void;
    stop(): void;
    // ...weitere Server-bezogene Methoden
  }
  
  // privateSettings.ts
  export interface IPrivateSettings {
    apiKey: string;
    adminPassword: string;
    // ...weitere private Einstellungen 
  }
  
  // clients.ts 
  export interface IClient {
    id: string; 
    settings: IClientSettings;
    // ...weitere Client-Eigenschaften
  }
  
  export interface IClientSettings {
    // ... Client-spezifische Einstellungen
  }
  
  // uniqueClient.ts
export class UniqueClient implements IClient {
    public id: string; 
    public settings: IClientSettings;
  
    constructor(id: string, settings: IClientSettings) {...}
    // ...weitere Methoden, die für einen eindeutigen Client relevant sind
  }
  
  // serverWrapper.ts
  import { Injectable, Inject } from './Injectable';
  import { IWebHandle, IFileHandle, IServerWrapper } from './server';
  
  @Injectable()
  export class ServerWrapper implements IServerWrapper {
    protected handle: {
      web: IWebHandle;
      file: IFileHandle; 
    }
  
    constructor(
      @Inject(WEB_HANDLE_TOKEN) webHandle: IWebHandle,
      @Inject(FILE_HANDLE_TOKEN) fileHandle: IFileHandle
    ) {
      this.handle = { web: webHandle, file: fileHandle };
    } 
  
    // ... Implementierung der start, stop & anderen serverbezogenen Methoden
  }
  
  // main.ts
  import { Injectable, Inject } from './Injectable';
  import { IGlobalValues } from './globalValues';
  import { ServerWrapper, SERVER_WRAPPER_TOKEN } from './server';
  import { IPrivateSettings, PRIVATE_SETTINGS_TOKEN } from './privateSettings';
  import { IClient } from './clients'; // Wichtiger Import
  import { Container } from 'inversify';
  
  @Injectable()
  export class MainService {
    private _globalValues: IGlobalValues;
    protected _server: ServerWrapper;
    protected _settings: IPrivateSettings;
    protected _clients: IClient[] = [];
  
    constructor(
      @Inject(GLOBAL_VALUES_TOKEN) globalValues: IGlobalValues,
      @Inject(SERVER_WRAPPER_TOKEN) server: ServerWrapper,
      @Inject(PRIVATE_SETTINGS_TOKEN) settings: IPrivateSettings
    ) {
      this._globalValues = globalValues;
      this._server = server;
      this._settings = settings;
    }
    // ...Implementierung der Hauptmethoden 
  }
  // bindConfig.ts (Beispielhafte Konfigurationsdatei)
import { Container } from 'inversify';
import { ServerWrapper, SERVER_WRAPPER_TOKEN, MainService, MAIN_SERVICE_TOKEN, /*...weitere Imports */} from './...';

const container = new Container();

container.bind<MainService>(MAIN_SERVICE_TOKEN).to(MainService).inSingletonScope();
container.bind<ServerWrapper>(SERVICE_WRAPPER_TOKEN).to(ServerWrapper).inSingletonScope();
// ...weitere Bindungen hinzufügen
