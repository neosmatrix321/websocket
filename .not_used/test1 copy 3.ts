import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { EventEmitterMixin, catType, IBaseEvent, IEventMap } from '../global/globalEventHandling';
import si from 'systeminformation';
import pidusage from 'pidusage';
import * as settings from '../settings/settingsInstance'; 

// ... interfaces (IStatsEvent, statsType - assume these are defined) ...

class BaseStatsEvent implements IBaseEvent {
    cat = catType.stats; 
}

const GLOBAL_STATS_TOKEN = Symbol('GlobalStats'); // Assuming you have an IStats interface

@injectable()
export default class Stats extends EventEmitterMixin<IStatsEvent>(BaseStatsEvent) {
    @inject(GLOBAL_STATS_TOKEN) stats!: IStats; // Assuming this exists
    @inject(PRIVATE_SETTINGS_TOKEN) private _settings!: settings.ISettings;

    constructor() {
        super();
        this.updateAllStats(); // Trigger initial update
    }

    // ... other helper functions (createStatContainer, etc.) ...

    public async updateAllStats() {
        try {
            await this.getPid();
            await this.getLatencyGoogle();
            await this.getSI();
            await this.getPU();

            this.emit('statsUpdated', { 
                type: statsType.update,
                message: 'All stats updated',
                data: { errCode: 0 } // Success
            }); 

        } catch (error) {
            this.emit('statsUpdated', {
                type: statsType.update,
                message: 'Error updating stats',
                data: {
                    errCode: 1,
                    message: error.message 
                }
            });
        }
    }

    private async getLatencyGoogle(): Promise<void> {
        try {
            const latency = await si.inetLatency();
            this.stats.latencyGoogle = latency;

            this.emit('latencyUpdated', {
                type: statsType.update,
                message: 'Google latency updated',
                data: { errCode: 0, blob: { latency } }
            });

        } catch (error) {
            this.emit('latencyUpdated', {
                type: statsType.update,
                message: 'Error fetching Google latency',
                data: { errCode: 1, message: error.message }
            });
        }
    }

    // Similar refactoring for getSI and getPU ...
}

const stats = new Stats(); // Assuming it's initialized 

stats.on('latencyUpdated', (event: IStatsEvent) => {
    if (event.data.errCode === 0) {
        console.log('Latency:', event.data.blob.latency);
    } else {
        console.error('Latency error:', event.data.message);
    }
});

stats.on('statsUpdated', (event: IStatsEvent) => {
    // Process the updated stats object (this.stats)
}); 