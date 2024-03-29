"use strict";
import { Container, injectable } from "inversify";
import "reflect-metadata";
import mixin, { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import { SubEventTypes, MainEventTypes, IEventTypes, IBaseEvent, IErrorEvent } from './global/eventInterface';
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
      const TTYonly = process.argv.includes('--tty') || process.argv.includes('-t') ? true : false;
      console.info(`Console is TTY: ${process.stdout.isTTY} | TTYonly: ${TTYonly}`)
      if (!TTYonly && process.stdout.isTTY) {
        const MyGUI = new consoleGui();
        MyGUI.startIfTTY();
        // this.server.createServer();
      }
      console.log("Main Initialization ...");
      this.setupEventHandlers();
      this.eV.handleError(SubEventTypes.ERROR.DEBUG, "Main Initialization", MainEventTypes.MAIN, new Error(`start Routine`), { "test": "works", "time": Date.now() });
      this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.START, message: `starting server`, success: true, });
    } catch (error) {
      this.eV.handleError(SubEventTypes.ERROR.FATAL, "Main Initialization", MainEventTypes.MAIN, new Error(`start Routine`), error);
      console.error("Main Initialization Error: ", error);
    }
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
        case SubEventTypes.BASIC.GUI:
          console.log(`${event.success ? '+' : '-'} ${event.subType}: ${event.message}`);
          break;
        default:
          console.log(`${event.success ? '+' : '-'} ${event.subType}: ${event.message}`);
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
      // console.error(`Global ERROR Handler: ${errorEvent}`);
    });
    // this.eV.on(MainEventTypes.DEBUG, (errorEvent: IEventTypes) => {
    //   // console.log(errorEvent);
    //   console.error(`Global DEBUG Handler: ${errorEvent}`);
    //   // console.dir(errorEvent, { depth: null, colors: true });
    // });

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
    let subType = typeof event.subType === 'string' ? event.subType : 'no subtype';
    let message = typeof event.message === 'string' ? event.message : `no message | ${subType}`;
    let success = typeof event.success === 'boolean' ? event.success : false;
    let json = typeof event.json !== 'undefined' ? event.json : { "no": "json" };

    const newEvent: IBaseEvent = {
      subType: SubEventTypes.BASIC.MAIN,
      success: success,
      message: message,
      json: json,
    };
    this.eV.emit(MainEventTypes.BASIC, newEvent);

    switch (event.subType) {
      case SubEventTypes.MAIN.START:
        this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.START_INTERVAL, message: 'START -> STATS.START_INTERVAL' });
        break;
      case SubEventTypes.MAIN.PID_AVAILABLE:
        // const newEvent: IBaseEvent = {
        //   subType: SubEventTypes.BASIC.STATS,
        //   message: `startPidWatcher | Pid Watcher online`,
        //   success: true,
        // };
        // this.eV.emit(MainEventTypes.BASIC, newEvent);
        if (event.success) this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.PREPARE, message: 'PID_AVAILABLE -> STATS.PREPARE' });
        else this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.IDLE_INTERVAL, message: 'PID_UNAVAILABLE -> STATS.IDLE_INTERVAL' });
        break;
      // case SubEventTypes.MAIN.PID_UNAVAILABLE:
      //   // this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.STOP_INTERVAL, message: 'PID_UNAVAILABLE -> STATS.STOP_INTERVAL' });
      //   this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.PREPARE, message: 'PID_UNAVAILABLE -> STATS.PREPARE' });
      //   break;
      case SubEventTypes.MAIN.PROCESS_FOUND:
        if (event.success) this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.READY, message: 'PROCESS_FOUND -> STATS.READY' });
        else this.eV.emit(MainEventTypes.STATS, { subType: SubEventTypes.STATS.IDLE_INTERVAL, message: 'PROCESS_NOT_FOUND -> STATS.IDLE_INTERVAL' });
        // this.eV.emit(MainEventTypes.SERVER, { subType: SubEventTypes.SERVER.RCON_GET_STATS, message: `PROCESS_FOUND -> SERVER.RCON_GET_STATS` });
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

}
const mainContainer = new Container();

mainContainer.bind<Main>(MAIN_WRAPPER_TOKEN).to(Main).inSingletonScope();

export const mainAPP = mainContainer.get<Main>(MAIN_WRAPPER_TOKEN);
