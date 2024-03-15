"use strict";

import { ClientType, MyWebSocket } from "../clients/clientInstance";
import { EventEmitterMixin } from "./EventEmitterMixin";

export const MainEventTypes = {
  BASIC: 'BASIC',
  MAIN: 'MAIN',
  STATS: 'STATS',
  SERVER: 'SERVER',
  CLIENTS: 'CLIENTS',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  EVENT: 'EVENT',
};
export const SubEventTypes = {
  BASIC: {
    FIRST: 'FIRST',
    LAST: 'LAST',
    DEFAULT: 'DEFAULT',
    MAIN: 'MAIN',
    STATS: 'STATS',
    SERVER: 'SERVER',
    CLIENTS: 'CLIENTS',
    EVENT: 'EVENT',
  },
  MAIN: {
    START_INTERVAL: 'START_INTERVAL',
    STOP_INTERVAL: 'STOP_INTERVAL',
    PID_AVAILABLE: 'PID_AVAILABLE',
    PID_UNAVAILABLE: 'PID_UNAVAILABLE',
    PRINT_DEBUG: 'PRINT_DEBUG',
  },
  STATS: {
    UPDATE_ALL: 'UPDATE_ALL',
    UPDATE_PI: 'UPDATE_PI',
    UPDATE_PU: 'UPDATE_PU',
    UPDATE_OTHER: 'UPDATE_OTHER',
    GET_PID: 'GET_PID',
    PREPARE: 'PREPARE',
    RCON_CONNECT: 'RCON_CONNECT',
    RCON_DISCONNECT: 'RCON_DISCONNECT',
    RCON_MESSAGE: 'RCON_MESSAGE',
    RCON_GET_STATS: 'RCON_GET_STATS',
    PRINT_DEBUG: 'PRINT_DEBUG',
    FORCE_UPDATE_ALL: 'FORCE_UPDATE_ALL',
    FORCE_UPDATE_ALL_FOR_ME: 'FORCE_UPDATE_ALL_FOR_ME',
  },
  SERVER: {
    LISTEN: 'LISTEN',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    MESSAGE: 'MESSAGE',
    PRINT_DEBUG: 'PRINT_DEBUG',
  },
  CLIENTS: {
    SUBSCRIBE: 'SUBSCRIBE',
    MODIFY: 'MODIFY',
    UNSUBSCRIBE: 'UNSUBSCRIBE',
    UPDATE_STATS: 'UPDATE_STATS',
    UPDATE_ALL_STATS: 'UPDATE_ALL_STATS',
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    MESSAGE: 'MESSAGE',
    GREETING: 'GREETING',
    OTHER: 'OTHER',
    MESSAGE_READY: 'MESSAGE_READY',
    SERVER_MESSAGE_READY: 'SERVER_MESSAGE_READY',
    PRINT_DEBUG: 'PRINT_DEBUG',
    MESSAGE_PAKET_READY: 'MESSAGE_PAKET_READY',
  },
  ERROR: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    FATAL: 'FATAL',
  },
};

export interface DebugDataCallback {
  (): Partial<IDebugEvent>;
  updateDuration(): void;
}

export const DEFAULT_VALUE_CALLBACKS = {
  timestamp: () => Date.now(),
  time: () => {
    const currentDate = new Date();
    return `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
  },
  // clientName: (clientId: string) => `Client-${clientId}`,
  activeEvents: (() => EventEmitterMixin.stats.activeEvents),
  eventCounter: (() => EventEmitterMixin.stats.eventCounter++)
};

export class DebugEventGenerator {
  private startTime: number;

  constructor() {
    this.startTime = DEFAULT_VALUE_CALLBACKS.timestamp();
  }

  generateDebugData(): IDebugEvent {
    return  {
      debugEvent: {
        timestamp: DEFAULT_VALUE_CALLBACKS.time(),
        eventName: "Debug Event",
        startTime: this.startTime,
        endTime: DEFAULT_VALUE_CALLBACKS.timestamp(),
        duration: 0,
        activeEvents: -1,
        eventCounter: -1
      }
    };
  }
  updateDuration(): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Assuming your IDebugEvent has a nested structure like debugEvent.debugEvent  
    this.generateDebugData().debugEvent.endTime = endTime;
    this.generateDebugData().debugEvent.duration = duration;
    this.generateDebugData().debugEvent.activeEvents = DEFAULT_VALUE_CALLBACKS.activeEvents();
    this.generateDebugData().debugEvent.eventCounter = DEFAULT_VALUE_CALLBACKS.eventCounter();
  }
}

export const debugDataCallback: IDebugEvent = new DebugEventGenerator().generateDebugData();

export class CustomErrorEvent extends Error {
  message: string;
  mainSource: string;
  data?: any;

  constructor(
    message: string,
    mainSource: string,
    data?: any
  ) {
    super();
    this.message = message;
    this.mainSource = mainSource;
    this.data = { ...data };
  }
}
export interface IBaseEvent {
  subType: string;
  message: string;
  counter?: number;
  data?: any;
  success?: boolean;
  debugEvent?: Partial<IDebugEvent>;
}

export interface IMainEvent extends IBaseEvent {
  mainEvent: { pid: number | undefined };
}

export interface IStatsEvent extends IBaseEvent {
  statsEvent: { statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any };
}

export interface IServerEvent extends IBaseEvent {
  serverEvent: { timerId?: number, startTime?: number, endTime?: number, duration?: number };
}

export interface IClientsEvent extends IBaseEvent {
  clientsEvent: { id: string, ip: string, clientType: ClientType, message?: string, client: MyWebSocket };
}

export interface IErrorEvent extends IBaseEvent {
  errorEvent: CustomErrorEvent;
}

export interface IDebugEvent {
  debugEvent: {
    timestamp: string;
    eventName: string;
    startTime: number;
    endTime: number;
    duration: number;
    activeEvents: number;
    eventCounter: number;
  };
  updateDuration?(): void;
}

export type IEventTypes = Partial<IBaseEvent> | Partial<IMainEvent> | Partial<IStatsEvent> | Partial<IServerEvent> | Partial<IClientsEvent>;

export class BaseEvent implements IBaseEvent {
  subType: string = SubEventTypes.BASIC.DEFAULT;
  message: string = "";
  data?: any;
  success: boolean = false;
  errorEvent?: CustomErrorEvent;
  debugEvent?: IDebugEvent;

  constructor(data?: Partial<IBaseEvent>) {
    Object.assign(this, data);
  }
}

export class MainEvent extends BaseEvent implements IMainEvent {
  mainEvent: { pid: number | undefined } = { pid: undefined }; // Default to the current process ID

  constructor(data?: Partial<IMainEvent>) {
    super(data);
    Object.assign(this.mainEvent, data?.mainEvent);
  }
}

export class StatsEvent extends BaseEvent implements IStatsEvent {
  statsEvent: { statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any } = {};

  constructor(data?: Partial<IStatsEvent>) {
    super(data);
    Object.assign(this.statsEvent, data?.statsEvent);
  }
}

export class ServerEvent extends BaseEvent implements IServerEvent {
  serverEvent: { timerId?: number, startTime?: number, endTime?: number, duration?: number } = {};

  constructor(data?: Partial<IServerEvent>) {
    super(data);
    Object.assign(this.serverEvent, data?.serverEvent);
  }
}

export class ClientsEvent extends BaseEvent implements IClientsEvent {
  clientsEvent: { id: string, ip: string, clientType: ClientType, message?: string, client: MyWebSocket } = { id: "NaN", ip: "NaN", clientType: ClientType.Unknown, client: {} as MyWebSocket };

  constructor(data?: Partial<IClientsEvent>) {
    super(data);
    Object.assign(this.clientsEvent, data?.clientsEvent);
  }
}

export class ErrorEvent extends BaseEvent implements IErrorEvent {
  errorEvent: CustomErrorEvent = new CustomErrorEvent("NaN", MainEventTypes.ERROR, {errCode: 0});

  constructor(data?: Partial<IErrorEvent>) {
    super(data);
    Object.assign(this.errorEvent, data?.errorEvent);
  }
}

export interface IEventStats {
  eventCounter: number;
  activeEvents: number;
  errorCounter: number;
}

export class activeClients {
  private value: number;
  callback: any;
  constructor(initialValue = 0) {
    this.value = initialValue;
  }

  plus(): void {
    this.value++;
    this.check();
  }

  minus(): void {
    if (this.value > 0) {
      this.value--;
      this.check();
    }
  }

  check(): void{
    if (this.callback) {
      this.callback(this.value > 0); 
    }
  }

  set(callback: (value: boolean) => void): void {
    this.callback = callback;
  }
}