"use strict";
import { Container, inject, injectable, postConstruct } from "inversify";
import "reflect-metadata";
import mixin, { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import { SubEventTypes, MainEventTypes, IEventTypes, IMainEvent, BaseEvent, IBaseEvent, debugDataCallback, IErrorEvent, IClientsEvent, IServerEvent, INewErr } from './global/eventInterface';
import { Server } from './server/server';
import { Clients } from "./clients/clients";
import { Stats } from "./stats/stats";
import { consoleGui } from "./gui/gui";


export const STATS_WRAPPER_TOKEN = Symbol('statsWrapper');
export const CLIENTS_WRAPPER_TOKEN = Symbol('clientsWrapper');
export const MAIN_WRAPPER_TOKEN = Symbol('Main');
export const SERVER_WRAPPER_TOKEN = Symbol('serverWrapper');
// export const MAIN_WRAPPER_TOKEN = Symbol('Main');

@injectable()
export class Main {
  protected eV: EventEmitterMixin = mixin;
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
      console.info(`Console is TTY: ${process.stdout.isTTY}`)
      if (process.stdout.isTTY) {
        const MyGUI = new consoleGui();
        MyGUI.startIfTTY();
        // this.server.createServer();
      }
      console.log("Main Initialization ...");
      this.setupEventHandlers();
      this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.START, message: `starting server`, success: true, });
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "Main Initialization", MainEventTypes.MAIN, new Error(`start Routine`), error);
      console.error("Main Initialization Error: ", error);
    }
  }

  public static safeStringify(obj: any, maxDepth = 4, space: string | number = ''): string {
    const cache = new WeakSet(); // Use a WeakSet to handle circular references
    let depth = 0;

    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);

        if (depth > maxDepth) {
          return `[DEPTH LIMIT REACHED]: ${maxDepth}`; // Indicate depth limit
        }
        depth++;

        // Optionally try to get a custom string representation
        if (typeof value !== 'object' && typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
          return value.toString();
        }
      }
      return typeof value === 'function' ? value.toString() : value;
    }, space);
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
          this.eV.handleError(SubEventTypes.ERROR.WARNING, "BASIC event", MainEventTypes.ERROR, new Error(`Unknown BASIC event subtype ${event.subType}`), event);
      }
      // console.log(createCustomDebugEvent(event, ...data));
      if (event.debugEvent !== undefined) {
        event.debugEvent.updateDuration;
        console.info(event.debugEvent);
        this.eV.handleError(SubEventTypes.ERROR.DEBUG, 'looping though DEBUG', MainEventTypes.MAIN, new Error(`from ${event.subType}`));
      }
    });
    this.eV.on(MainEventTypes.MAIN, this.handleMainEvent.bind(this));
    this.eV.on(MainEventTypes.ERROR, (errorEvent: IErrorEvent) => {  // FIXME:
      this.eV.emit(MainEventTypes.GUI, { subType: SubEventTypes.GUI.FILL_ERROR_ARRAY, message: errorEvent });
      this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.LOG_TO_FILE, message: errorEvent });
    });
    this.eV.on(MainEventTypes.DEBUG, (errorEvent: IEventTypes) => {
      // console.log(errorEvent);
      console.error(`Global DEBUG Handler: ${errorEvent}`);
      // console.dir(errorEvent, { depth: null, colors: true });
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
    // this.eV.onAny((mainType: string, event: IEventTypes) => {
    //   if (!event.subType) return; // Safety check

    //   // console.warn(`Unknown event: ${mainType}.${event.subType}`);
    // });
  }

  private handleMainEvent(event: IEventTypes) {
    switch (event.subType) {
      case SubEventTypes.MAIN.PID_AVAILABLE:
        const newEvent: IBaseEvent = {
          subType: SubEventTypes.BASIC.STATS,
          message: `getPid | Pid Watcher online`,
          success: true,
        };
        this.eV.emit(MainEventTypes.BASIC, newEvent);
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
          subType: SubEventTypes.SERVER.RCON_DISCONNECT,
          message: `disconnect to rcon`,
          success: true,
        };
        this.eV.emit(MainEventTypes.STATS, pidUnEvent);
        break;
      case SubEventTypes.MAIN.PROCESS_FOUND:
        this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.RCON_CONNECT, message: `connect to rcon`, success: true });
        this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.START_INTERVAL, message: 'Start interval', success: true });
        break;
      case SubEventTypes.MAIN.PRINT_DEBUG:
        this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.DEBUG_LOG_TO_FILE, data: this, message: `MAIN` });

        // console.log("Clients:");
        // console.dir(this.clients, { depth: 3, colors: true });
        break;
      default:
        this.eV.handleError(SubEventTypes.ERROR.WARNING, "handleMainEvent", MainEventTypes.MAIN, new Error(`from ${event.subType}`), event);
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
