import { inject, injectable } from 'inversify';
import { EventEmitterMixin } from '../global/globalEventHandling';
import { IStats } from './statsInstance';
import pidusage from 'pidusage';
import si from 'systeminformation';
import * as settings from '../settings/settingsInstance'; 
import * as eH from "../global/globalEventHandling";

interface IStatsUpdateData {
    errCode: number;  
    message?: string; 
    data?: any; 
}

@injectable()
export default class Stats extends EventEmitterMixin<IStatsEvent>(BaseStatsEvent) {
    @inject(GLOBAL_STATS_TOKEN) stats!: IStats;
    @inject(PRIVATE_SETTINGS_TOKEN) _settings!: settings.ISettings;

    constructor() {
        super();
        this.startStatsUpdater(); // Start periodic updates
    }

    // ... other methods ...

    private async updateLatency(): Promise<void> {
        try {
            const latency = await si.inetLatency();
            this.stats.latencyGoogle = latency;
            this.emitEvent('latencyUpdated', { errCode: 0, data: { latency } }); 
        } catch (e) {
            this.emitEvent('latencyUpdated', { errCode: 1, message: 'Failed to fetch latency' }); 
        }
    }

    private async updateSystemInfo(): Promise<void> {
        // ... similar logic to update latency, emitting 'systemInfoUpdated'
    }

    private async updateProcessUsage(): Promise<void> {
        // ... similar logic, emitting 'processUsageUpdated'
    }

    private async startStatsUpdater() {
        setInterval(() => {
            this.updateLatency();
            this.updateSystemInfo();
            this.updateProcessUsage();
        }, 5000); // Update every 5 seconds (adjust as needed)
    }

    private emitEvent(type: statsType, data: IStatsUpdateData) {
        this.emit(type, {
            type, 
            message: data.message || 'Stats updated', 
            data
        });
    }
}

const stats = new Stats();

stats.on('latencyUpdated', (event) => {
    if (event.data.errCode === 0) {
        console.log('Google Latency:', event.data.data.latency);
    } else {
        console.error('Error:', event.data.message); 
    }
});