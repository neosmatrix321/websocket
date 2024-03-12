"use strict";
import "reflect-metadata";
import { Container, inject, injectable, postConstruct } from "inversify";
import { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import { ClientType } from "./clients/clientInstance";
import { SubEventTypes, MainEventTypes, IEventTypes, IMainEvent, BaseEvent, IBaseEvent, debugDataCallback, DebugEventGenerator } from './global/eventInterface';
import { Stats } from "./stats/stats";
import { Server } from "./server/server";
import { Clients } from "./clients/clients";
export const STATS_WRAPPER_TOKEN = Symbol('Stats');
export const CLIENTS_WRAPPER_TOKEN = Symbol('Clients');
export const SERVER_WRAPPER_TOKEN = Symbol('Server');

const FirstEvent = new BaseEvent({
  subType: SubEventTypes.BASIC.FIRST,
  message: "First event",
  success: true,
  debugEvent: debugDataCallback,
});



/*
  statsEvent: {
    statsId: 1,
    updatedFields: ["newValue"]
  },
  mainEvent: {
    pid: -1
  },
  serverEvent: {
    timerId: 1,
    startTime: Date.now(),
    endTime: 0,
    duration: 0
  },
  clientsEvent: { id: "", ip: "", clientType: ClientType.Unknown },
  errorEvent: { errCode: 0, error: new Error("First event error") },
*/
const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Main {
  protected eV: EventEmitterMixin = EventMixin;
  private sendInfoInterval: any;
  private intvalStats = { idleStart: 0, idleEnd: 0, duration: 0 };
  @inject(STATS_WRAPPER_TOKEN) protected stats!: Stats;
  @inject(SERVER_WRAPPER_TOKEN) protected server!: Server;
  @inject(CLIENTS_WRAPPER_TOKEN) protected clients!: Clients;
  public constructor(
  ) {
    this.eV = EventMixin;
    this.sendInfoInterval = undefined;

    // console.log("Main constructor: ", this.eV, this.stats, this.server, this.clients);
    this.setupEventHandlers();
    this.eV.emit(MainEventTypes.BASIC, FirstEvent);
    // this.initialize();
    // this.eV.on('createTimer', () => {
    //   this.startTimer();
    // });  
  }

  protected setupEventHandlers() {
    // ... (your other event handlers)
    // Main event handler
    this.eV.on(MainEventTypes.BASIC, (event: IBaseEvent) => {
      if (event.subType === SubEventTypes.SERVER.LISTEN) this.intvalStats.idleStart = Date.now();
      console.log(`type: ${event.subType} | message: ${event.message}`);
      // console.log(createCustomDebugEvent(event, ...data));
      if (event.debugEvent !== undefined) {
        event.debugEvent.updateDuration;
        console.dir(event.debugEvent, { depth: null, colors: true });
      }
    });
    this.eV.on(MainEventTypes.MAIN, this.handleMainEvent.bind(this));
    this.eV.on(MainEventTypes.ERROR, (errorEvent: IEventTypes) => {
      // console.log(errorEvent);
      console.error(`Global ERROR Handler: ${errorEvent}`);
      // console.dir(errorEvent, { depth: null, colors: true });
    });
    this.eV.on(MainEventTypes.DEBUG, (errorEvent: IEventTypes) => {
      // console.log(errorEvent);
      console.error(`Global DEBUG Handler: ${errorEvent}`);
      // console.dir(errorEvent, { depth: null, colors: true });
    });


    // TODO: alternate Debug event handler ?
    // this.eV.on('DEBUG',  (event: IEventTypes) => {
    //   if (event.subType === 'START') {
    //     console.log(`Debug event started: ${event.debugEvent.eventName}`);
    //   } else if (event.subType === 'STOP') {
    //     const duration = event.debugEvent.endTime - event.debugEvent.startTime;
    //     console.log(`Debug event '${event.debugEvent.eventName}' completed in ${duration}ms`);
    //   }
    // });

    // Unknown event handler // TODO: catch rest of events
    // this.onAny((mainType: string, event: IEventTypes) => {
    //   if (!event.subType) return; // Safety check

    //   console.warn(`Unknown event: ${mainType}.${event.subType}`);
    // });
  }

  public initialize() {
    console.log(this);
    try {
      this.server.createServer();
    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private handleMainEvent(event: IMainEvent) {
    switch (event.subType) {
      case SubEventTypes.MAIN.START_INTERVAL:
        this.intervalStart();
        break;
      case SubEventTypes.MAIN.STOP_INTERVAL:
        this.intervalStop();
        break;
      // ... other MAIN subType
      default:
        console.warn('Unknown main event subtype:', event.subType);
    }
  }

  private intervalStart() {
    if (!this.sendInfoInterval) {
      this.intvalStats.idleEnd = Date.now();
      console.log(`intervalStart: Interval started, idle time: ${this.intvalStats.idleEnd - this.intvalStats.idleStart}ms.`);
      this.sendInfoInterval = setInterval(() => {
        try {
          this.eV.emit(MainEventTypes.STATS, {
            subType: SubEventTypes.STATS.UPDATE_ALL
          });
          this.eV.emit(MainEventTypes.CLIENTS, {
            subType: SubEventTypes.CLIENTS.UPDATE_ALL_STATS
          });
          // this.clients.handleClientsUpdateStats();
        } catch (error) {
          this.eV.emit(MainEventTypes.ERROR, {
            subType: SubEventTypes.ERROR.INFO,
            message: 'Error updating stats',
            success: false,
            errorEvent: { errCode: 2, data: { error } }
          });
        }
      }, 5000);
    }
    //  else {
    //   console.log("intervalStart: no action taken. clientsCounter:");
    // }
  }
  private intervalStop() {
    if (this.sendInfoInterval) {
      this.intvalStats.idleStart = Date.now();

      clearInterval(this.sendInfoInterval);
      this.sendInfoInterval = null;
      console.log("intervalStop: Interval stopped.");
    }
    //  else {
    //   console.log("intervalStop: no action taken. clientsCounter:");
    // }
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
