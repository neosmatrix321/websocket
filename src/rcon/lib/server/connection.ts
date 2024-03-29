import net from 'net';
import crypto from 'crypto';
import { settingsContainer, statsContainer } from '../../../global/containerWrapper';
import {
  SERVERDATA_AUTH,
  // SERVERDATA_AUTH_RESPONSE,
  SERVERDATA_EXECCOMMAND,
  createRequest,
  readResponse,
  type RconResponse,
} from './rcon';
import { statsWrapper } from '../../../global/statsInstance';
import { settingsWrapper } from '../../../settings/settingsInstance';

enum RconState {
  IDLE,
  CONNECTING,
  CONNECTED,
  ERROR, 
}

export class RconConnection {
  client: net.Socket = new net.Socket();
  connected: boolean = false;
  connectedWithoutError: boolean = false;
  authenticated: boolean = false;
  callback: Function | null = null;
  stats: statsWrapper = statsContainer;
  settings: settingsWrapper = settingsContainer;
  rconState: RconState = RconState.IDLE;

  constructor() {
    this.client.on('data', (data) => {
      const response = readResponse(data);
      if (this.callback) this.callback(response);
    });

    this.client.on('error', (err) => {
      console.error('RCON:', err);
      this.cleanup();
    });

    this.client.on('close', () => {
      // this.client.end();
      this.cleanup();
    });
  }

  public isPortOpen(host: string, port: number, timeout: number = 2000): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            socket.end();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.end();
            resolve(false); 
        });

        socket.on('error', (err) => {
            socket.end();
            reject(err); 
        });

        socket.connect(port, host);
    });
  }

  private cleanup() {
    // this.client.end();
    if (this.client) this.client.removeAllListeners();
    this.callback = null;
    this.connected = false;
    this.authenticated = false;
    this.stats.global.rcon.isConnected = false;
    this.connectedWithoutError = false;
    this.rconState = RconState.IDLE;
  }

  async connect(): Promise<void> {
    const hostname: string = `${this.settings.rcon.host}`;
    const port: number = this.settings.rcon.port;
    if (!this.stats.global.pid.processFound || !this.isPortOpen(hostname, port) || this.rconState !== RconState.IDLE) return;
    this.rconState = RconState.CONNECTING;
    this.stats.updateLastUpdates("server", "rconConnect");
    try {
      this.client.connect(port, hostname, async () => {
        const password: string = `${this.settings.rcon.pw}`;
        this.connected = true;
        // extra response handler to catch failed authentication, which returns message ID -1
        const res = await this.exec(password, SERVERDATA_AUTH);
        if (!res || (res && res.id == -1)) {
          // this.cleanup();
          this.rconState = RconState.ERROR;
          this.cleanup();
          throw new Error(`RCON authentication failed`);
        }
        this.rconState = RconState.CONNECTED;
        this.authenticated = true;
        this.connectedWithoutError = true;
        this.stats.global.rcon.isConnected = true;
        this.stats.updateLastUpdates("server", "rconConnect", true);
      });
    } catch (err: any) {
      // this.client.end();
      this.rconState = RconState.ERROR;
      console.error('Connection failed', err);
      // this.client.end();
    }
}

  async exec(
    body: string,
    type: number = SERVERDATA_EXECCOMMAND,
    messageId: number = this.randU32Sync()
  ): Promise<RconResponse> {
    return new Promise((resolve, reject) => {
      try {
        const timeoutId = setTimeout(() => {
          reject('RCON command timed out');
        }, 2000);
        
        this.callback = async (res: RconResponse) => {
          clearTimeout(timeoutId);
          resolve(res);
        };
        this.client.write(createRequest(type, messageId, body));
      } catch (err: any) {
        reject(`RCON: Command send failed - ${err.message}`);
        // reject(err);
      }
    });
  }

  private randU32Sync(): number {
    return Math.abs(crypto.randomBytes(4).readInt32LE(0));
  }
}
