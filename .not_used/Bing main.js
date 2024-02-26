"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Injectable_1 = require("./Injectable");
const settingsInstance_1 = require("./private/settingsInstance");
const statsInstance_1 = require("./global/statsInstance");
const serverInstance_1 = require("./server/serverInstance");
const clientsInstance_1 = require("./clients/clientsInstance");
const EventEmitterMixin = (BaseClass) => class extends BaseClass {
    _emitter;
    _events;
    constructor(...args) {
        super(...args);
        this._emitter = new events_1.EventEmitter();
    }
    async on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
        console.log("on Event " + this._events.length, event);
    }
    async prepend(event, listener) {
        console.log("prepend Event " + this._events.length, event);
        this._events[event].push(listener);
    }
    async emit(event, ...args) {
        if (this._events[event]) {
            console.log("emit Event " + this._events.length, event);
            this._events[event].forEach((listener) => listener(...args));
        }
    }
    async off(event, listener) {
        console.log('event gone?:');
        this._events[event].push(listener);
    }
    async emitCustomEvent(event, ...args) {
        this.emit(event, ...args);
    }
};
let Main = class Main extends EventEmitterMixin(Object) {
    stats;
    server;
    settings;
    clients;
    constructor() {
        super();
        this.initServer();
        this.on('clientConnected', this.startInterval.bind(this));
    }
    async initServer() {
        this.updateStats("initServer");
        this.createServer();
    }
    async createServer() {
        this.server.handle.web.create().then(() => {
            this.on('connection', this.handleConnection.bind(this));
        });
    }
    async handleConnection(ws) {
        this.updateStats(ws);
        this.manageClient(ws);
        this.setupWebSocketEvents(ws);
    }
    async manageClient(ws) {
        if (!this.clients[ws.id]) {
            this.clients.addClient(this.stats.clientsCounter, { "ip": ws.ip }).then(() => {
                this.emit('clientConnected', ws);
                ws.id = this.clients.id;
                ws.ip = ws.socket.remoteAddress;
            }).catch(() => {
                console.error(`Could not create Client with ID: ${ws.id}`);
            });
        }
        if (this.clients[ws.id])
            this.clients.updateClientStats(ws.id).catch(() => {
                console.error(`Updating Client with ID: ${ws.id} failed`);
            });
        else
            console.error(`No Client with ID: ${ws.id} exists`);
        console.log(this.stats);
    }
    async setupWebSocketEvents(ws) {
        this.on('error', console.error);
        this.on('close', this.handleClose.bind(this, ws));
        this.on('message', this.handleMessage.bind(this, ws));
        this.setupInterval(ws);
    }
    async handleClose(ws, code) {
        console.log("dead ip(" + ws.ip + ") alive(" + ws.readyState + ") code(" + code + ") count(" + this.stats.clientsCounter + ")");
        this.server.handle.web.destroyClient(ws.ip);
        ws.terminate;
        if (this.stats.clientsCounter == 0) {
            clearInterval(this.interval_sendinfo);
            this.interval_sendinfo = undefined;
        }
    }
    async handleMessage(ws, data, isBinary) {
        const decodedJsonObject = Buffer.from(data, 'base64').toString();
        console.log("decodedJsonObject", decodedJsonObject);
        const obj = JSON.parse(decodedJsonObject);
        if (typeof obj.type !== "undefined") {
            switch (obj.type) {
                case 'greeting':
                    this.handleGreeting(ws, obj);
                    break;
            }
        }
    }
    async handleGreeting(ws, obj) {
        if (typeof obj.admin !== "undefined" && obj.admin == 1)
            this.settings.isAdmin = true;
        if (!this.clients[ws.id]) {
            console.error(`No Client with ID: ${ws.id} known`);
        }
        this.clients.client.setCustomClientConfig(ws.id, ws.ip, { "admin": obj.admin });
        this.server.handle.web.forEach(function each(ws_client) {
            if (ws_client.readyState === ws.OPEN) {
                this.clients[ws.id].getClientLatency();
                console.log('to ' + ws_client.ip + " admin " + ws_client.admin);
                if (ws_client.admin === true || ws.ip == "192.168.228.7") {
                    const dummy = true;
                }
            }
        });
    }
    async setupInterval(ws) {
        if (typeof this.interval_sendinfo === 'undefined') {
            if (!this.stats.getPid()) {
                console.log("wrong here");
                this.server.handle.web.close();
                clearInterval(this.interval_sendinfo);
                this.interval_sendinfo = undefined;
            }
            else {
                this.interval_sendinfo = setInterval(() => {
                    // Check if there are any connected clients
                    this.stats.updateGlobalStats();
                    this.clients.forEach((client) => {
                        if (client.readyState === client.OPEN) {
                            const timeDiff = Date.now() - client.now;
                            client.send(JSON.stringify({
                                latencyUser: timeDiff,
                                latencyGoogle: this.stats.latencyGoogle,
                                connectedSince: client.connectedSince,
                            }));
                        }
                    });
                }, 1000);
            }
        }
    }
    async startInterval() {
        if (this.stats.clientsCounter > 0) {
            if (typeof this.interval_sendinfo === 'undefined') {
                this.setupInterval({ ...this.server.handle.web });
            }
            else {
                clearInterval(this.interval_sendinfo); // Clear the interval if there are no connected clients
                this.interval_sendinfo = undefined;
            }
        }
    }
};
__decorate([
    (0, Injectable_1.Inject)(statsInstance_1.GLOBAL_VALUES_TOKEN),
    __metadata("design:type", typeof (_a = typeof statsInstance_1.IGlobalValues !== "undefined" && statsInstance_1.IGlobalValues) === "function" ? _a : Object)
], Main.prototype, "stats", void 0);
__decorate([
    (0, Injectable_1.Inject)(serverInstance_1.SERVER_VALUES_TOKEN),
    __metadata("design:type", typeof (_b = typeof serverInstance_1.IServerWrapper !== "undefined" && serverInstance_1.IServerWrapper) === "function" ? _b : Object)
], Main.prototype, "server", void 0);
__decorate([
    (0, Injectable_1.Inject)(settingsInstance_1.PRIVATE_SETTINGS_TOKEN),
    __metadata("design:type", typeof (_c = typeof settingsInstance_1.IPrivateSettings !== "undefined" && settingsInstance_1.IPrivateSettings) === "function" ? _c : Object)
], Main.prototype, "settings", void 0);
__decorate([
    (0, Injectable_1.Inject)(clientsInstance_1.CLIENTS_TOKEN),
    __metadata("design:type", typeof (_d = typeof clientsInstance_1.IClients !== "undefined" && clientsInstance_1.IClients) === "function" ? _d : Object)
], Main.prototype, "clients", void 0);
Main = __decorate([
    (0, Injectable_1.Injectable)(),
    __metadata("design:paramtypes", [])
], Main);
exports.default = Main;
