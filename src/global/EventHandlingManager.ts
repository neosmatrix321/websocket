import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { Server } from "https";
import * as eH from "./EventHandlingMixin";
import { WebSocketServer } from "ws";
import * as sI from "../stats/statsInstance";
import * as S from "../stats/stats";
import * as cI from "../clients/clientInstance";
import * as C from "../clients/clients";
import * as srvI from "../server/serverInstance";
import * as srv from "../server/server";

// ... your other imports 
export const EVENT_MANAGER_TOKEN = Symbol('eventManager');

export enum eMType {
    started,
    stopped
}

export interface IeMEvent extends eH.IEventMap {
    type: eMType;
    message: string;
    data?: {
        errCode: number;
        message?: string;
        blob?: any;
    };
}

class BaseEMEvent implements eH.IBaseEvent {
    "cat": eH.catType = eH.catType.eventManager;
}

@injectable()
export class eventManager extends EventEmitterMixin<IeMEvent>(BaseEMEvent) {
    @inject(EVENT_MANAGER_TOKEN) private eM!: eventManager;
    public webServer: WebSocketServer;
    constructor() {
        super();
        this.webServer = new WebSocketServer({ noServer: true });
        this.setupWebSocketListeners();
        // Register event listeners
        // Stats Event Handlers
        this.on('stats', (event: S.IStatsEvent) => {
            switch (event.type) {
                case S.statsType.updated:
                    this.handleStatsUpdate(event);
                    break;
                case S.statsType.timerCreated:
                    this.handleTimerCreated(event);
                    break;
                case S.statsType.timerStarted:
                    this.handleTimerStarted(event);
                    break;
                case S.statsType.timerStopped:
                    this.handleLatencyStopped(event);
                    break;
                // ... other 'stats' event types
            }
        });

        // Client Event Handlers
        this.on('client', (event: C.IClientsEvent) => {
            switch (event.type) {
                case C.clientsType.create:
                    break;
                case C.clientsType.update:
                    this.clientSettingsUpdated(event);
                    break;
                case C.clientsType.delete:
                    this.clientBye(event);
                    break;
                case C.clientsType.statsUpdated:
                    this.clientMessageReady(event);
                    break;
                // ... other 'client' event types
            }
        });
        this.on('client', (event: C.IClientsEvent) => {
            switch (event.type) {
                case srv.serverType.listen:
                    this.serverActive(event);
                    break;
                case srv.serverType.clientConnected:
                    this.handleClientConnected(event);
                    break;
                case srv.serverType.clientMessageReady:
                    this.handleClientMessage(event);
                    break;
                case srv.serverType.clientDisconcted:
                    this.clientBye(event);
                    this.handleClientConnected(event);
                    break;
                // ... other 'client' event types
            }
        });
        this.eM.on('serverCreated', this.gatherAndSendStats.bind(this));
        this.eM.on('latencyUpdated', (event: IStatsEvent) => {
            this.eM.on(eMType.clientLatencyThresholdExceeded, this.handleClientLatency.bind(this));
            this.eM.on(eMType.statsUpdated, this.handleStatsUpdate.bind(this)); if (event.data.errCode === 0) {
                console.log('Latency:', event.data.blob.latency);
            } else {
                console.error('Latency error:', event.data.message);
            }
        });
        this.eM.on('clientConnected', this.handleClientConnected.bind(this));
        this.eM.on('clientDisconnected', this.handleClientDisconnected.bind(this));
        this.eM.on('statsUpdated', this.handleStatsUpdated.bind(this));

        this.eM.on('statsUpdated', (event: IStatsEvent) => {
            // Process the updated stats object (this.stats)
        });
    }
    private setupWebSocketListeners() {
        this.webServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
            this.emit('clientConnected', ws);
        });

        // ... other event listeners for 'close', 'message', etc.
    }

    private handleClientLatency(event: IeMEvent) {
        console.log('Client Latency Exceeded:', event.data);
        // ... React to client latency (e.g., send warning, log data)
    }

    private handleLatencyUpdate(event: IStatsEvent) {
        if (event.data.errCode === 0) {
            console.log('Latency:', event.data.blob.latency);
        } else {
            console.error('Latency error:', event.data.message);
        }
    }

    private handleStatsUpdate(event: S.IStatsEvent | IeMEvent) {
        this.clientMessageReady(event);

    }
    private handleClientConnected(ws: WebSocket) {
        // ... manage client connection ...
    }

    private handleClientDisconnected(ws: WebSocket) {
        // ... handle client disconnection ...
    }

    private handleStatsUpdated(stats: IStats) { // Assuming IStats exists
        // ... process updated stats, potentially send to clients ...
    }
}

/* https://github.com/neosmatrix321/websocket/tree/master
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { WebSocketServer } from "ws";
import * as sI from "../stats/statsInstance";
import * as S from "../stats/stats";
import * as cI from "../clients/clientInstance";
import * as C from "../clients/clients";

// ... other imports 

@injectable()
export class eventManager extends EventEmitterMixin<IeMEvent>(BaseEMEvent) {
  // ... properties

  constructor() {
    super();
    this.webServer = new WebSocketServer({ noServer: true });
    this.setupWebSocketListeners();
    this.registerEventHandlers(); 
  }

  private registerEventHandlers() {
    this.on('stats', this.handleStatsEvent); 
    this.on('client', this.handleClientEvent);

    // Consider registering server handlers separately if needed:
    // this.on('server', this.handleServerEvent); 
  }

  private handleStatsEvent(event: S.IStatsEvent) {
    switch (event.type) {
      case S.statsType.updated:
        this.handleStatsUpdated(event);
        break;
      case S.statsType.latencyUpdated:
        this.handleLatencyUpdated(event);
        break;
      // ... other stats cases
      default: 
        console.warn('Unhandled stats event type:', event.type);
    }
  }

  private handleClientEvent(event: C.IClientEvent) {
    // ... similar structure as handleStatsEvent
  }

  // ... other handlers and helper functions */