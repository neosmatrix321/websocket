"use strict";
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";
import { EventEmitterMixin } from "./global/EventEmitterMixin";
// import Stats from "./stats/stats";
// import Server from "./server/server";
// import Clients from "./clients/clients";
import * as statsI from "./stats/statsInstance";
import * as serverI from "./server/serverInstance";
import * as clientsI from "./clients/clientInstance";
import * as settingsI from "./settings/settingsInstance";
import * as eventI from "./global/eventInterface";
import { Stats, STATS_WRAPPER_TOKEN } from "./stats/stats";
import { Server, SERVER_WRAPPER_TOKEN } from "./server/server";
import { Clients, CLIENTS_WRAPPER_TOKEN } from "./clients/clients";
import { Settings, PRIVATE_SETTINGS_TOKEN } from "./settings/settings";

const FirstEvent = new eventI.DebugEvent({
  subType: eventI.SubEventTypes.BASIC.FIRST,
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
  clientsEvent: { id: "", ip: "", clientType: clientsI.ClientType.Unknown },
  errorEvent: { errCode: 0, error: new Error("First event error") },
  debugEvent: { enabled: true }
});

const EventMixin = EventEmitterMixin.getInstance();

@injectable()
export class Main {
  protected eV: EventEmitterMixin = EventMixin;
  protected stats: statsI.IStats;
  protected server: serverI.IServerWrapper;
  protected clients: clientsI.IClientsWrapper;

  public constructor(
    @inject(STATS_WRAPPER_TOKEN) statsInstance: statsI.IStats,
    @inject(SERVER_WRAPPER_TOKEN) serverInstance: serverI.IServerWrapper,
    @inject(CLIENTS_WRAPPER_TOKEN) clientsInstance: clientsI.IClientsWrapper,
    @inject(Stats) private statsService: Stats,
    @inject(Server) private serverService: Server,
    @inject(Clients) private clientsService: Clients,
    @inject(Settings) private settingsService: Settings,

  ) {
    this.eV = EventMixin;
    this.stats = statsInstance;
    this.server = serverInstance;
    this.clients = clientsInstance;
    console.log("Main constructor: ", this.stats, this.server, this.clients, this.settingsService.settings.pid);
    this.setupEventHandlers();
    this.eV.emit(eventI.MainEventTypes.BASIC, FirstEvent);
    // this.initialize();
    // this.eV.on('createTimer', () => {
    //   this.startTimer();
    // });  
  }
  protected setupEventHandlers() {
    // ... (your other event handlers)
    // Main event handler
    this.eV.on(eventI.MainEventTypes.MAIN, this.handleMainEvent);
    this.eV.on(eventI.MainEventTypes.ERROR, (errorEvent: eventI.IEventTypes) => {
      console.error("Global Error Handler:", errorEvent);
    });
    // Stats event handler
    // Server event handler
    // Client event handler

    // TODO: alternate Debug event handler ?
    // this.eV.on('DEBUG',  (event: eventI.IEventTypes) => {
    //   if (event.subType === 'START') {
    //     console.log(`Debug event started: ${event.debugEvent.eventName}`);
    //   } else if (event.subType === 'STOP') {
    //     const duration = event.debugEvent.endTime - event.debugEvent.startTime;
    //     console.log(`Debug event '${event.debugEvent.eventName}' completed in ${duration}ms`);
    //   }
    // });

    // Unknown event handler // TODO: catch rest of events
    // this.onAny((mainType: string, event: eventI.IEventTypes) => {
    //   if (!event.subType) return; // Safety check

    //   console.warn(`Unknown event: ${mainType}.${event.subType}`);
    // });
  }

  public initialize() {
    console.log(this);
    try {
      this.serverService.createServer();
    } catch (err) {
      console.error("Main Initialization Error: ", err);
    }
  }

  private handleMainEvent(event: eventI.IEventTypes) {
    switch (event.subType?.[0]) {
      case eventI.SubEventTypes.MAIN.START_STOP_INTERVAL:
        this.IntervalStartStop();
        break;
      // ... other MAIN subType
      default:
        console.warn('Unknown main event subtype:', event.subType?.[0]);
    }
  }

  public IntervalStartStop() {
    if (this.clients.stats.clientsCounter > 0 && !this.stats.interval_sendinfo) {
      this.stats.interval_sendinfo = setInterval(() => {
        this.statsService.updateAndGetPidIfNecessary().then((result) => {
          if (result) {
            this.eV.emit(eventI.MainEventTypes.STATS, {
              subType: eventI.SubEventTypes.STATS.UPDATE_ALL
            });
            this.eV.emit(eventI.MainEventTypes.CLIENTS, {
              subType: eventI.SubEventTypes.CLIENTS.UPDATE_ALL_STATS
            });
            this.clientsService.handleClientsUpdateStats();
          }
        }).catch((error) => {
          this.eV.emit(eventI.MainEventTypes.ERROR, {
            mainTypes: [eventI.SubEventTypes.ERROR.INFO],
            subType: ["IntervalStartStop"],
            message: 'Error updating stats',
            success: false,
            errorEvent: { errCode: 2, data: { error } }
          });
        });
      }, 5000);
    } else if (this.clients.stats.clientsCounter === 0 && this.stats.interval_sendinfo) {
      clearInterval(this.stats.interval_sendinfo);
      this.stats.interval_sendinfo = null;
    } else {
      console.log(`IntervalStartStop: no action taken. clientsCounter: ${this.clients.stats.clientsCounter}`);
    }
  }

  // private async gatherAndSendStats() {
  //   await this.statsService.updateAllStats();

  //   Object.values(this.clients).forEach((client: any) => {
  //     if (client.readyState === client.OPEN) {
  //       // . detailed logic to build and send the stats payload.
  //       const statsData = { ...this.stats, ...client.info };
  //       client.send(JSON.stringify(statsData));

  //     }
  //   });
  // }
}
