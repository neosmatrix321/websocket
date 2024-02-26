"use strict";

import { createServer } from 'https';
import { readFileSync } from 'fs';
import { IncomingMessage } from 'http';
import { EventEmitterMixin } from '../global/globalEventHandling';
import { WebSocket, WebSocketServer, createWebSocketStream } from 'ws';
import Main from '../main';

class MyClass { }
const MyClassWithMixin = EventEmitterMixin(MyClass);
const globalEventEmitter = new MyClassWithMixin();

export default class Server extends Main {
    constructor() {
        super();
     }

    public async create() {
        const newStreamServer = new WebSocketServer({ noServer: true });
        const streamFile = new WebSocketServer({ noServer: true });
        this.stats.lastUpdates = { "web": Date.now() };
        this._server._handle.web = newStreamServer;
        this._server._handle.file = streamFile;

        const _serverCert = createServer({
            cert: readFileSync(this._settings.certPath),
            key: readFileSync(this._settings.keyPath)
        });

        _serverCert.on('upgrade', (request, socket, head) => {
            switch (true) {
                case this.stats.webHandle.isAlive:
                    this.handleUpgrade(request, socket, head, (ws: WebSocket) => {
                        this.emitConnection(ws, request);
                    });
                    break;
                default:
                    socket.destroy();
            }
        });

        _serverCert.listen(this._settings.streamServerPort, this._settings.ip, () => {
            console.log(`HTTPS server ${this._settings.ip} listening on ${this._settings.streamServerPort}`);
            globalEventEmitter.emitCustomEvent('server_created');
        });
    }

    public async createTimer() {
        // Interval function moved here
        // this.stats.updateAndGetPidIfNecessary();
        this.emitCustomEvent('createTimer', 'Global Timer started');

        this._server._handle.web._clients.forEach((ws_client: any) => {

            if (ws_client.admin === true) {
                console.log(ws_client.admin);
            }

            if (ws_client.readyState === ws_client.OPEN) {
                if (this._clients[ws_client.id]) {
                    console.error(`No Client with ID: ${ws_client.id} known`);
                }
                const time_diff = (Date.now() - ws_client.now);
                console.log("admin(" + ws_client.admin + ") sending to ip(" + ws_client.ip + ") alive(" + ws_client.readyState + ") count(" + this.stats.clientsCounter + ") connected(" + Main.stats.connectedClients + ") latency_user(" + ws_client.latency_user + ") latency_google(" + this.stats.latency_google + ") connected since(" + Main.stats.lastUpdates.web + ") diff(" + time_diff + ")");

                if (time_diff > 20000) {
                    const dummy = true;
                }
            }
        });
    }

    handleUpgrade(request: IncomingMessage, socket: internal.Duplex, head: Buffer, callback: (ws: any) => void) {
        this._server._handle.web.handleUpgrade(request, socket, head, callback);
    }

    emitConnection(ws: any, request: IncomingMessage) {
        this._server._handle.web.emit('connection', ws, request);
        globalEventEmitter.emit('clientConnected', ws);
    }

    destroyClient(ip: string) {
        // Implement the logic to destroy a client
    }
}
