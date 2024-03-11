"use strict";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import { ClientType } from "./clients/clientInstance";
import { DebugEvent, SubEventTypes, MainEventTypes, IEventTypes } from "./global/eventInterface";
import { Stats } from "./stats/stats";
import { Server } from "./server/server";
import { Clients } from "./clients/clients";

const FirstEvent = new DebugEvent({
  subType: SubEventTypes.BASIC.FIRST,
  message: "First event",
  success: true,
  data: "First event data",
  statsEvent: {
    statsId: 1,
    newValue: 100,
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
  debugEvent: { enabled: true }
});

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Main {
  protected eV: EventEmitterMixin = EventMixin;
  private sendInfoInterval: any;
  public constructor(
    @inject(Stats) private stats?: Stats,
    @inject(Server) private server?: Server,
    @inject(Clients) private clients?: Clients,
  ) {
    this.eV = EventMixin;
    this.sendInfoInterval = undefined;

    console.log("Main constructor: ", this.eV, this.stats, this.server, this.clients);
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
    this.eV.on(MainEventTypes.MAIN, this.handleMainEvent);
    this.eV.on(MainEventTypes.ERROR, (errorEvent: IEventTypes) => {
      console.error("Global Error Handler:", errorEvent);
    });
    // Stats event handler
    // Server event handler
    // Client event handler

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
      this.server?.createServer();
    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private handleMainEvent(event: IEventTypes) {
    switch (event.subType?.[0]) {
      case SubEventTypes.MAIN.START_INTERVAL:
        this.IntervalStart();
        break;
      case SubEventTypes.MAIN.STOP_INTERVAL:
        this.IntervalStop();
        break;
      // ... other MAIN subType
      default:
        console.warn('Unknown main event subtype:', event.subType?.[0]);
    }
  }

  public IntervalStart() {
    if (!this.sendInfoInterval) {
      this.sendInfoInterval = setInterval(() => {
        this.stats?.updateAndGetPidIfNecessary().then((result) => {
          if (result) {
            this.eV.emit(MainEventTypes.STATS, {
              subType: SubEventTypes.STATS.UPDATE_ALL
            });
            this.eV.emit(MainEventTypes.CLIENTS, {
              subType: SubEventTypes.CLIENTS.UPDATE_ALL_STATS
            });
            this.clients?.handleClientsUpdateStats();
          }
        }).catch((error) => {
          this.eV.emit(MainEventTypes.ERROR, {
            mainTypes: [SubEventTypes.ERROR.INFO],
            subType: ["IntervalStartStop"],
            message: 'Error updating stats',
            success: false,
            errorEvent: { errCode: 2, data: { error } }
          });
        });
      }, 5000);
    } else {
      console.log("IntervalStartStop: no action taken. clientsCounter:", this.sendInfoInterval);
    }
  }
  public IntervalStop() {
    if (this.sendInfoInterval) {
      clearInterval(this.sendInfoInterval);
      this.sendInfoInterval = null;
    } else {
      console.log("IntervalStartStop: no action taken. clientsCounter:", this.sendInfoInterval);
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
