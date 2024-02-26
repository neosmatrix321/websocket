import "reflect-metadata";
import { injectable, inject, Container } from "inversify";

// Definieren Sie die Tokens
const MAIN_SERVICE_TOKEN = Symbol("MainService");
const GLOBAL_VALUES_TOKEN = Symbol("GlobalValues");
const SERVER_WRAPPER_TOKEN = Symbol("ServerWrapper");
const PRIVATE_SETTINGS_TOKEN = Symbol("PrivateSettings");
const CLIENTS_TOKEN = Symbol("Clients");
const UNIQUE_CLIENT_TOKEN = Symbol("UniqueClient");

// Definieren Sie die Schnittstellen
interface IHandle {
  web: any;
  file: any;
}

interface IGlobalValues {
  // ...
}

interface IServerWrapper {
  handle: IHandle;
  // ...
}

interface IPrivateSettings {
  // ...
}

interface IClients {
  [id: string]: any; // Ersetzen Sie 'any' durch den tatsächlichen Typ
}

interface IUniqueClient {
  // ...
}

interface IMainService {
  stats: IGlobalValues;
  server: IServerWrapper;
  settings: IPrivateSettings;
  clients: IClients;
  uniqueClient: IUniqueClient;
}

// Implementieren Sie die Klassen
@injectable()
class GlobalValues implements IGlobalValues {
  // ...
}

@injectable()
class ServerWrapper implements IServerWrapper {
  handle: IHandle = { web: null, file: null };
  // ...
}

@injectable()
class PrivateSettings implements IPrivateSettings {
  // ...
}

@injectable()
class Clients implements IClients {
  // ...
}

@injectable()
class UniqueClient implements IUniqueClient {
  // ...
}

@injectable()
class MainService implements IMainService {
  @inject(GLOBAL_VALUES_TOKEN) public stats: IGlobalValues;
  @inject(SERVER_WRAPPER_TOKEN) public server: IServerWrapper;
  @inject(PRIVATE_SETTINGS_TOKEN) public settings: IPrivateSettings;
  @inject(CLIENTS_TOKEN) public clients: IClients;
  @inject(UNIQUE_CLIENT_TOKEN) public uniqueClient: IUniqueClient;
}

// Erstellen Sie den IoC-Container und registrieren Sie die Bindungen
const container = new Container();
container.bind<IGlobalValues>(GLOBAL_VALUES_TOKEN).to(GlobalValues);
container.bind<IServerWrapper>(SERVER_WRAPPER_TOKEN).to(ServerWrapper);
container.bind<IPrivateSettings>(PRIVATE_SETTINGS_TOKEN).to(PrivateSettings);
container.bind<IClients>(CLIENTS_TOKEN).to(Clients);
container.bind<IUniqueClient>(UNIQUE_CLIENT_TOKEN).to(UniqueClient);
container.bind<IMainService>(MAIN_SERVICE_TOKEN).to(MainService);

// Holen Sie sich eine Instanz des MainService
const mainService = container.get<IMainService>(MAIN_SERVICE_TOKEN);
