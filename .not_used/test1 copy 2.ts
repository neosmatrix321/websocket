import { inject, injectable } from 'inversify';
import { EventEmitterMixin, catType, IStatsEvent, statsType, IBaseEvent } from '../global/globalEventHandling';
import { IStats } from './statsInstance';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as settings from '../settings/settingsInstance'; 

// ... interfaces (IStatsEvent, IBaseEvent) ...

class BaseStatsEvent implements IBaseEvent {
    cat = catType.stats;
}

@injectable()
export default class Stats extends EventEmitterMixin<IStatsEvent>(BaseStatsEvent) {
    @inject(GLOBAL_STATS_TOKEN) stats!: IStats;
    @inject(PRIVATE_SETTINGS_TOKEN) _settings!: settings.ISettings;

    constructor() {
        super();
        this.initialize();
    }

    private async initialize() {
        // ... (Potentially fetch initial stats here) ...
        this.updateStatsPeriodically(); 
    }

    private updateStatsPeriodically() {
        // Example: Update stats every 5 seconds
        setInterval(() => {
            this.updateAllStats(); 
        }, 5000);
    }

    // ... (other Stats class methods) ...

    public async updateAllStats() {
        try {
            await this.getPid(); 
            await this.comparePids(); 
            await this.getLatencyGoogle();
            await this.getSI();
            await this.getPU();

            this.emit('statsUpdated', { 
                type: statsType.update, 
                data: { errCode: 0, blob: this.stats } 
            }); 
        } catch (e) {
            this.emit('statsUpdated', {
                type: statsType.update,
                data: { errCode: 1, message: e.message }
            }); 
        }
    }

    private async getLatencyGoogle(): Promise<void> {
        // ... (your existing logic) ...

        const eventData: IStatsEvent = {
            type: statsType.update,
            message: 'Google latency updated', // Or a more specific message
            data: {
                errCode: 0, 
                blob: { latencyGoogle: this.stats.latencyGoogle }
            } 
        };
        this.emit('latencyUpdated', eventData); 
    }

    // ... (Similar refactoring for getSI, getPU, etc.) ...
}
Verwende den Code mit Vorsicht.
Subscriber Example

TypeScript
import { inject, injectable } from 'inversify';
import { Stats } from './stats'; 

@injectable()
export class StatsMonitor {
    @inject(Stats) private statsService!: Stats;

    startMonitoring() {
        this.statsService.on('latencyUpdated', (event: IStatsEvent) => {
            // Handle latency updates
        });

        this.statsService.on('statsUpdated', (event: IStatsEvent) => {
            // Handle comprehensive stats updates
        });
    }
}