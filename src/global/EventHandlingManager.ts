import "reflect-metadata";
import { inject, injectable } from "inversify";
import { EventEmitterMixin } from "./EventHandlingMixin";
import { Server } from "https";
import * as eH from "./EventHandlingMixin";

// ... your other imports 
export const EVENT_MANAGER_TOKEN = Symbol('eventManager');

export enum eMType {
    update,
    timerCreated,
    timerStarted,
    timerStopped
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
export interface IStatsEvent {
    type: eMType;
    data?: {
        errCode: number;
        message?: string;
        blob?: any;
    };
}
export class StatsEvent {
    type?: eMType;
    data?: {
        errCode: number;
        message?: string;
        blob?: any;
    };
}

class BaseStatsEvent implements eH.IBaseEvent {
    "cat": eH.catType = eH.catType.stats;
}


@injectable()
export class eventManager extends EventEmitterMixin(BaseStatsEvent) {
    @inject(EVENT_MANAGER_TOKEN) private eM!: eventManager;

    constructor() {
        super();
        // Register event listeners
        this.eM.on('latencyUpdated', this.handleLatencyUpdate.bind(this));
        this.eM.on('statsUpdated', this.handleStatsUpdate.bind(this));
        this.eM.on('serverCreated', this.gatherAndSendStats.bind(this));
        this.eM.on('latencyUpdated', (event: IStatsEvent) => {
            this.eM.on(eMType.clientLatencyThresholdExceeded, this.handleClientLatency.bind(this));
            this.eM.on(eMType.statsUpdated, this.handleStatsUpdate.bind(this)); if (event.data.errCode === 0) {
                console.log('Latency:', event.data.blob.latency);
            } else {
                console.error('Latency error:', event.data.message);
            }
        });

        Stats.on('statsUpdated', (event: IStatsEvent) => {
            // Process the updated stats object (this.stats)
        });
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

    private handleStatsUpdate(event: <IStatsEvent | IeMEvent>) {
    this.clientManager.sendStatsUpdate(event.data.blob);  // Delegate to ClientManager
} 
}
