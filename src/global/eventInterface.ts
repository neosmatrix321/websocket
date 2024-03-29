"use strict";

import { MyWebSocket } from "../clients/clientInstance";
import { EventEmitterMixin } from "./EventEmitterMixin";

export const MainEventTypes = {
  BASIC: 'BASIC',
  MAIN: 'MAIN',
  STATS: 'STATS',
  SERVER: 'SERVER',
  CLIENTS: 'CLIENTS',
  GUI: 'GUI',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  EVENT: 'EVENT',
  PROMISE: 'PROMISE',
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
    GUI: 'GUI',
  },
  MAIN: {
    PID_AVAILABLE: 'PID_AVAILABLE',
    PID_UNAVAILABLE: 'PID_UNAVAILABLE',
    PRINT_DEBUG: 'PRINT_DEBUG',
    START: 'START',
    PROCESS_FOUND: 'PROCESS_FOUND',
  },
  GUI: {
    PRINT_DEBUG: 'PRINT_DEBUG',
    UPDATE_STATS: 'UPDATE_STATS',
    FILL_ERROR_ARRAY: 'FILL_ERROR_ARRAY',
    CHANGE_INTERVAL: 'CHANGE_INTERVAL',
    IDLE_INTERVAL: 'IDLE_INTERVAL',
    DRAW: 'DRAW',
  },
  STATS: {
    UPDATE_ALL: 'UPDATE_ALL',
    UPDATE_PI: 'UPDATE_PI',
    UPDATE_PU: 'UPDATE_PU',
    UPDATE_OTHER: 'UPDATE_OTHER',
    PREPARE: 'PREPARE',
    PRINT_DEBUG: 'PRINT_DEBUG',
    START_INTERVAL: 'START_INTERVAL',
    STOP_INTERVAL: 'STOP_INTERVAL',
    RESUME_INTERVAL: 'RESUME_INTERVAL',
    IDLE_INTERVAL: 'IDLE_INTERVAL',
    READY: 'READY',
  },
  SERVER: {
    LISTEN: 'LISTEN',
    KILLED: 'KILLED',
    START: 'START',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    MESSAGE: 'MESSAGE',
    PRINT_DEBUG: 'PRINT_DEBUG',
    LOG_TO_FILE: 'LOG_TO_FILE',
    DEBUG_LOG_TO_FILE: 'DEBUG_LOG_TO_FILE',
    RCON_MESSAGE: 'RCON_MESSAGE',
    RCON_GET_STATS: 'RCON_GET_STATS',
    RCON_DISCONNECT: 'RCON_DISCONNECT',
    PREPARE: 'PREPARE',
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
    START_INTERVAL: 'START_INTERVAL',
    STOP_INTERVAL: 'STOP_INTERVAL',
    CHANGE_INTERVAL: 'CHANGE_INTERVAL',
  },
  ERROR: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    FATAL: 'FATAL',
    DEBUG: 'DEBUG',
  },
  PROMISE: {
    CLIENT_SUBSCRIBE: 'CLIENT_SUBSCRIBE',
  }
};


// interface JSONObject {
//   [key: string]: string;
// }

// export interface JSONArray extends Array<string> {}

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
  activeEvents: (() => EventEmitterMixin.eventStats.activeEvents++),
  // eventCounter: (() => EventEmitterMixin.eventStats.eventCounter++)
};

export class DebugEventGenerator {
  private startTime: number;

  constructor() {
    this.startTime = DEFAULT_VALUE_CALLBACKS.timestamp();
  }

  generateDebugData(): IDebugEvent {
    return {
        timestamp: DEFAULT_VALUE_CALLBACKS.time(),
        eventName: "Debug Event",
        startTime: this.startTime,
        endTime: DEFAULT_VALUE_CALLBACKS.timestamp(),
        duration: 0,
        activeEvents: 0,
        // eventCounter: -1
    };
  }
  updateDuration(): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Assuming your IDebugEvent has a nested structure like debugEvent.debugEvent  
    this.generateDebugData().endTime = endTime;
    this.generateDebugData().duration = duration;
    this.generateDebugData().activeEvents = DEFAULT_VALUE_CALLBACKS.activeEvents();
    // this.generateDebugData().eventCounter = DEFAULT_VALUE_CALLBACKS.eventCounter();
  }
}

export const debugDataCallback: IDebugEvent = new DebugEventGenerator().generateDebugData();

export interface IBaseEvent {
  subType: string;
  message: string;
  success?: boolean;
  debugEvent?: IDebugEvent;
  json?: any;
}

export interface IMainEvent extends IBaseEvent {
  pid: number | "NaN";
}

export interface IStatsEvent extends IBaseEvent {
  statsId?: number;
  newValue?: any;
  oldValue?: any;
  updatedFields?: any;
}

export interface IServerEvent extends IBaseEvent {
  timerId?: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export interface IClientsEvent extends IBaseEvent {
  id: string;
  client: MyWebSocket;
  type: string[];
  data: any;
}

export interface IGuiEvent extends IBaseEvent {
  newNumberValue: number;
  newStringValue: string;
}

export interface IErrorEvent extends IBaseEvent {
  counter: number;
  mainSource: string;
  errorEvent: Error;
}

export interface IDebugEvent {
    timestamp: string;
    eventName: string;
    startTime: number;
    endTime: number;
    duration: number;
    activeEvents: number;
    // eventCounter: number;
  updateDuration?(): void;
}

export interface IPromiseEvent<T> extends IBaseEvent {
  (value?: T | PromiseLike<T>): void;
}

export type IEventTypes = Partial<IBaseEvent> | Partial<IMainEvent> | Partial<IStatsEvent> | Partial<IServerEvent> | Partial<IClientsEvent> | Partial<IGuiEvent>;


export class BaseEvent implements IBaseEvent {

  subType: string = SubEventTypes.BASIC.DEFAULT;
  message: string = "NaN";
  success?: boolean = false;
  debugEvent?: IDebugEvent;
  json?: any;

  constructor(subType: string, message: string, success?: boolean, debugEvent?: IDebugEvent, json?: any) {
    this.subType = subType;
    this.message = message;
    this.success! = success || false;
    this.debugEvent = debugEvent;
    this.json = json;
  }
}

export class MainEvent extends BaseEvent implements IMainEvent {
  pid: number | "NaN" = "NaN"; // Default to the current process ID

  constructor(subType: string, message: string, success: boolean, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.pid = process.pid;
  }
}

export class StatsEvent extends BaseEvent implements IStatsEvent {
  statsId: number;
  newValue: any;
  oldValue: any;
  updatedFields: any;

  constructor(statsId: number, newValue: any, oldValue: any, updatedFields: any, subType: string, message: string, success: boolean, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.statsId = statsId;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.updatedFields = updatedFields;
  }
}

export class ServerEvent extends BaseEvent implements IServerEvent {
  timerId: number;
  startTime: number;
  endTime: number;
  duration: number;

  constructor(timerId: number, startTime: number, endTime: number, duration: number, subType: string, message: string, success: boolean, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.timerId = timerId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.duration = duration;
  }
}

export class ClientsEvent extends BaseEvent implements IClientsEvent {
  id: string;
  client: MyWebSocket;
  type: string[];
  data: any;

  constructor(subType: string, id: string, message: string, client: MyWebSocket, success: boolean, type: string[],data: any, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.id = id;
    this.type = type;
    this.client = client;
    this.data = data;
  }
}

export class GuiEvent extends BaseEvent implements IGuiEvent {
  newNumberValue: number;
  newStringValue: string;

  constructor(subType: string, message: string, success: boolean, newNumberValue: number, newStringValue: string, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.newNumberValue = newNumberValue;
    this.newStringValue = newStringValue;
  }
}

export class ErrorEvent extends BaseEvent implements IErrorEvent{
  counter: number;
  mainSource: string;
  errorEvent: Error = new Error("NaN");

  constructor(subType: string, message: string, success: boolean, counter: number, mainSource: string, errorEvent: Error, debugEvent?: IDebugEvent, json?: any) {
    super(subType, message, success, debugEvent, json);
    this.counter = counter;
    this.mainSource = mainSource;
    this.errorEvent = errorEvent;
  }
}

// export class promiseEvent<T> implements IPromiseEvent {
//   (value?: T | PromiseLike<T>): void;
//     constructor(subType: string, message: string, success: boolean, debugEvent?: IDebugEvent, json?: any, (value?: any)) {
//     super(subType, message, success, debugEvent, json);
//     this.value = value;
//     get value() {
//     return await value;
//     }

//   }
// }

export interface INewErr {
  counter: number;
  mainSource: string;
  errorEvent: Error;
  subType: string;
  message: string;
  success: boolean;
  debugEvent: IDebugEvent;
  json: string;
}


export interface IEventStats {
  // eventCounter: number;
  activeEvents: number;
  errorCounter: number;
  guiEventCounter: number;
  guiActiveEvents: number;
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

  check(): void {
    if (this.callback) {
      this.callback(this.value > 0);
    }
  }

  set(callback: (value: boolean) => void): void {
    this.callback = callback;
  }
}