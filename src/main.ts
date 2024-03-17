"use strict";
import { Container, inject, injectable, postConstruct } from "inversify";
import "reflect-metadata";
import { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import { SubEventTypes, MainEventTypes, IEventTypes, IMainEvent, BaseEvent, IBaseEvent, debugDataCallback, CustomErrorEvent, IErrorEvent, IClientsEvent, IServerEvent } from './global/eventInterface';
import { Server } from "./server/server";
import { Clients } from "./clients/clients";
import { Stats } from "./stats/stats";
import { consoleGui } from "./gui/gui";


export const STATS_WRAPPER_TOKEN = Symbol('statsWrapper');
export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
export const MAIN_WRAPPER_TOKEN = Symbol('Main');
export const SERVER_WRAPPER_TOKEN = Symbol('serverWrapper');

const FirstEvent = new BaseEvent({
  subType: SubEventTypes.BASIC.FIRST,
  message: "First event",
  success: true,
  debugEvent: debugDataCallback,
});

export const MyGUI = new consoleGui();
// export const MAIN_WRAPPER_TOKEN = Symbol('Main');


@injectable()
export class Main {
  protected eV: EventEmitterMixin = EventEmitterMixin.getInstance();
  protected stats!: Stats;
  protected server!: Server;
  protected clients!: Clients;
  constructor() {
    this.stats = new Stats();
    this.server = new Server();
    this.clients = new Clients();
  }

  public async start() {
    try {
      MyGUI.startIfTTY();
      console.log("Main Initialization ...");
      this.setupEventHandlers();
      this.eV.emit(MainEventTypes.BASIC, FirstEvent);
      const firstErrorEvent: IErrorEvent = {
        subType: SubEventTypes.ERROR.INFO,
        message: "First Error",
        success: false,
        errorEvent: new CustomErrorEvent("from Main", MainEventTypes.DEBUG, { errCode: 0 }),
        data: { errCode: 0, errMessage: "First Error", errData: "NaN" },
      };
      this.eV.emit(MainEventTypes.ERROR, firstErrorEvent);
      this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.START, message: 'Start Server', success: true });
      // const debugEvent: IBaseEvent = {
      //   subType: SubEventTypes.MAIN.PRINT_DEBUG, // Define an appropriate subType
      //   message: 'printDebug',
      //   success: true,
      // };
      // this.eV.emit(MainEventTypes.MAIN, debugEvent);
      // console.log("createServer Initialization ...");

    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "Main Initialization", new CustomErrorEvent("from Main", MainEventTypes.ERROR, error));
      console.error("Main Initialization Error: ", error?.toString());
    }
  }
  public safeStringify(obj: any) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Duplicate reference found, discard key
          return;
        }
        // Store value in our set
        cache.add(value);
      }
      return value;
    });
  }
  protected setupEventHandlers() {
    // ... (your other event handlers)
    // Main event handler
    this.eV.on(MainEventTypes.BASIC, (event: IEventTypes) => {
      switch (event.subType) {
        case SubEventTypes.BASIC.DEFAULT:
        case SubEventTypes.BASIC.FIRST:
        case SubEventTypes.BASIC.MAIN:
        case SubEventTypes.BASIC.STATS:
        case SubEventTypes.BASIC.SERVER:
        case SubEventTypes.BASIC.CLIENTS:
        case SubEventTypes.BASIC.EVENT:
          console.log(`${event.subType} event | result: ${event.success} | message: ${event.message}`);
          break;
        default:
          this.eV.handleError(SubEventTypes.ERROR.WARNING, "BASIC event", new CustomErrorEvent(`from ${event.subType}`, MainEventTypes.ERROR, event));
          console.error('Unknown BASIC event subtype:', event.subType);
      }
      // console.log(createCustomDebugEvent(event, ...data));
      if (event.debugEvent !== undefined) {
        event.debugEvent.updateDuration;
        console.info(event.debugEvent);
        this.eV.handleError(SubEventTypes.ERROR.DEBUG, "BASIC event", new CustomErrorEvent(`from ${event.subType}`, MainEventTypes.ERROR, event));
      }
    });
    this.eV.on(MainEventTypes.MAIN, this.handleMainEvent.bind(this));
    this.eV.on(MainEventTypes.ERROR, (errorEvent: IErrorEvent) => {
      // console.log(errorEvent);
      const jsonOBJ = this.safeStringify({
        [`ERROR No.: ${errorEvent.counter}`]: {
          "from": `${errorEvent.errorEvent.mainSource}, ${errorEvent.message}`,
          "error": `${errorEvent.errorEvent.message}`,
          "logLevel": `${errorEvent.subType}`,
          [errorEvent.data]: errorEvent.errorEvent.data,
        }
      });
      this.eV.emit(MainEventTypes.GUI, { subType: SubEventTypes.GUI.FILL_ERROR_ARRAY, message: jsonOBJ, success: false });
      // const jsonData = JSON.stringify(errorEvent.errorEvent.data, null, 2);
      // console.warn(`Global ERROR ${errorEvent.counter}: ${errorEvent.message}`);
      // console.warn(`logLevel: ${errorEvent.subType}`);
      // console.warn(`from: ${errorEvent.errorEvent.mainSource}`);
      // console.warn(`message: ${errorEvent.errorEvent.message}`);
      // console.warn(`data: ${jsonData}`);
      // console.info(JSON.stringify(errorEvent.errorEvent.data, null, 2));
    });
    this.eV.on(MainEventTypes.DEBUG, (errorEvent: IEventTypes) => {
      // console.log(errorEvent);
      console.error(`Global DEBUG Handler: ${errorEvent}`);
      console.dir(errorEvent, { depth: null, colors: true });
    });


    // TODO: alternate Debug event handler ?
    // this.eV.on('DEBUG',  (event: IEventTypes) => {
    //   if (event.subType === 'START') {
    //     // console.log(`Debug event started: ${event.debugEvent.eventName}`);
    //   } else if (event.subType === 'STOP') {
    //     const duration = event.debugEvent.endTime - event.debugEvent.startTime;
    //     // console.log(`Debug event '${event.debugEvent.eventName}' completed in ${duration}ms`);
    //   }
    // });

    // Unknown event handler // TODO: catch rest of events
    // this.onAny((mainType: string, event: IEventTypes) => {
    //   if (!event.subType) return; // Safety check

    //   // console.warn(`Unknown event: ${mainType}.${event.subType}`);
    // });
  }

  private handleMainEvent(event: IMainEvent) {
    switch (event.subType) {
      case SubEventTypes.MAIN.PID_AVAILABLE:
        const pidAvEvent: IBaseEvent = {
          subType: SubEventTypes.STATS.PREPARE,
          message: `Prepare to gather`,
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, pidAvEvent);
        break;
      case SubEventTypes.MAIN.PID_UNAVAILABLE:
        // TODO: let interval run and send dummy data
        const pidUnEvent: IBaseEvent = {
          subType: SubEventTypes.STATS.RCON_DISCONNECT,
          message: `disconnect to rcon`,
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, pidUnEvent);
        break;
      case SubEventTypes.MAIN.PRINT_DEBUG:
        console.log("Main:");
        console.dir(this.eV, { depth: 2, colors: true });
        // console.dir(this.sendInfoInterval, { depth: 2, colors: true });
        // console.dir(this.intvalStats, { depth: 2, colors: true });
        const debugStatsEvent: IBaseEvent = {
          subType: SubEventTypes.STATS.PRINT_DEBUG, // Define an appropriate subType
          message: 'printDebug',
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, debugStatsEvent);
        const debugServerEvent: IBaseEvent = {
          subType: SubEventTypes.SERVER.PRINT_DEBUG, // Define an appropriate subType
          message: 'printDebug',
          success: true,
        };
        this.eV.emit(MainEventTypes.SERVER, debugServerEvent);
        const debugClientsEvent: IBaseEvent = {
          subType: SubEventTypes.CLIENTS.PRINT_DEBUG, // Define an appropriate subType
          message: 'printDebug',
          success: true,
        };
        this.eV.emit(MainEventTypes.CLIENTS, debugClientsEvent);
        break;
      default:
        this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleMainEvent", new CustomErrorEvent(`from ${event.subType}`, MainEventTypes.MAIN, event));
        // console.error('Unknown MAIN event subtype:', event.subType);
    }
  }


  // private async gatherAndSendStats() {
  //   await this.stats.updateAllStats();

  //   Object.values(this.clients).forEach((client: any) => {
  //     if (client.readyState === client.OPEN) {
  //       // . detailed logic to build and send the stats payload.
  //       const statsData = { ...this.stats, ...client.info };
  //       client.send(JSON.stringify(statsData));

  //     }
  //   });
  // }
}
const mainContainer = new Container();

mainContainer.bind<Main>(MAIN_WRAPPER_TOKEN).to(Main).inSingletonScope();

// Bind your services to their respective interfaces

// Get an instance of Main

export const mainAPP = mainContainer.get<Main>(MAIN_WRAPPER_TOKEN);
