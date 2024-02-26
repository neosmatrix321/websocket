
// 

// @Injectable()
// export abstract class StatService extends Main {
//    @Inject(MAIN_SERVICE_TOKEN) protected allStats: typeof statInstance;
//    constructor(@Inject(MAIN_SERVICE_TOKEN) @optional allStats: typeof statInstance) {
//   }
//   public createMainService() {
//     super(statInstance)
//     const stats = new Container();
//     stats.bind<IStats>(GLOBAL_STATS_TOKEN).toConstantValue(null);
//     const statsInstance: IStats = stats.get<Main>
    
//     const settings = new Container();
//     settings.bind<ISettings>(PRIVATE_SETTINGS_TOKEN).toConstantValue(null);
//     const settingsInstance: ISettings = settings.get<Main>
    
//     const server = new Container();
//     server.bind<IServerWrapper>(SERVER_WRAPPER_TOKEN).toConstantValue(null);
//     const serverInstance: IServerWrapper = server.get<Main>
    
//     const clients = new Container();
//     clients.bind<IClients>(CLIENT_COLLECTOR_TOKEN).toConstantValue();
//     const clientsInstance: IClients = clients.get<IClients>
//     new Main(statsInstance, settingsInstance, serverInstance, clientsInstance);

//   }
// }

//         container.bind<IStats>(GLOBAL_STATS_TOKEN).to(null).inSingletonScope();
//         container.bind<ISettings>(PRIVATE_SETTINGS_TOKEN).to(null).inSingletonScope();
//         container.bind<IServerWrapper>(SERVER_WRAPPER_TOKEN).to(null).inSingletonScope();
//         container.bind<Map<any, IClient>>(CLIENT_COLLECTOR_TOKEN).to(null).inSingletonScope();



/*
const container = new Container();

// Bindings
container.bind<MainService>(MAIN_SERVICE_TOKEN).to(statContainerService); 
container.bind<MainService>(MAIN_SERVICE_TOKEN).to(serverWrapperService);
container.bind<MainService>(MAIN_SERVICE_TOKEN).to(clientsCollectorService);
container.bind<MainService>(MAIN_SERVICE_TOKEN).to(privateValuesService);

// Resolve the services 
const mainServices = container.getAll<MainService>(MAIN_SERVICE_TOKEN);

// Start the servers
for (const service of mainServices) {
    service.startServer(); 
}

const serverInstance = Server.getInstance();

// Getting a property value
const webValue = serverInstance.getHandleProperty('web');

// Setting a property value
serverInstance.setHandleProperty('file', someNewValue); */

/*
public abstract startServer(): void;

class MainServiceSingleton {
    protected static instance: MainService;
  
    private constructor() { }
  
    public static getInstance(): MainService {
      if (!MainServiceSingleton.instance) {
        MainServiceSingleton.instance = new MainService();
      }
      return MainServiceSingleton.instance;
    }
}
@Injectable()
export abstract class statContainerService extends MainService {
    @Inject(STAT_CONTAINER_TOKEN) protected readonly statContainer: statContainer
    _server: serverWrapper;
    _global: statContainer;
    _clients: clientsCollector;
    _private: privateValues;
    _interval_sendinfo: any;

    constructor(@Inject(STAT_CONTAINER_TOKEN) global: statContainer, 
                @Inject(SERVER_VALUES_TOKEN) server: serverWrapper, 
                @Inject(CLIENT_COLLECTOR_TOKEN) clients: clientsCollector, 
                @Inject(PRIVATE_VALUES_TOKEN) privateVal: privateValues) { 
        super({...statContainer.getInstance()});
        this._server = server;
        this._global = global;
        this._clients = clients;
        this._private = privateVal;
        // Initialize _interval_sendinfo as needed
    }
}



const container = new Container();

container.bind<MainService>(GLOBAL_VALUES_TOKEN, statContainerService);
container.bind<MainService>(SERVER_VALUES_TOKEN, serverWrapperService);
container.bind<MainService>(CLIENT_COLLECTOR_TOKEN, clientsCollectorService);
container.bind<MainService>(PRIVATE_VALUES_TOKEN, privateValuesService); */

//const updatedStats = { ...stats, connectedClients: stats.connectedClients + 1 };
//globalStats.getInstance().updateStats(updatedStats);