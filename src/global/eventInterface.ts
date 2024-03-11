"use strict";

import { ClientType } from "../clients/clientInstance";
import { DEFAULT_VALUE_CALLBACKS } from "../global/EventEmitterMixin";

export const MainEventTypes = {
  BASIC: 'BASIC',
  MAIN: 'MAIN',
  STATS: 'STATS',
  SERVER: 'SERVER',
  CLIENTS: 'CLIENTS',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

export const SubEventTypes = {
  BASIC: {
    FIRST: 'FIRST',
    LAST: 'LAST',
    DEFAULT: 'DEFAULT'
  },
  MAIN: {
    START_INTERVAL: 'START_INTERVAL',
    STOP_INTERVAL: 'STOP_INTERVAL',
    PID_AVAILABLE: 'PID_AVAILABLE'
  },
  STATS: {
    UPDATE_ALL: 'UPDATE_ALL',
    UPDATE_PI: 'UPDATE_PI',
    UPDATE_PU: 'UPDATE_PU',
    UPDATE_OTHER: 'UPDATE_OTHER'
  },
  SERVER: {
    LISTEN: 'LISTEN',
    CONNECT: 'CONNECT',
    DISCONNECT: 'DISCONNECT',
    MESSAGE: 'MESSAGE',
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
  },
  ERROR: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    FATAL: 'FATAL',
  },
};


export interface IBaseEvent {
  subType?: string;
  success?: boolean;
  message: string;
  data?: any;
  statsEvent?: { statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any };
  mainEvent?: { pid?: number };
  serverEvent?: { timerId?: number, startTime?: number, endTime?: number, duration?: number };
  clientsEvent?: { id?: string, ip?: string, clientType: ClientType, message?: string };
  errorEvent?: { errCode: number, error?: Error, message?: string, data?: any };
}

export class BaseEvent implements IBaseEvent {
  subType: string = SubEventTypes.BASIC.DEFAULT;
  success: boolean = true;
  message: string = "";
  data?: any;
  statsEvent?: {
    statsId?: number, newValue?: any, oldValue?: any, updatedFields?: any
  } = {
      statsId: -1, newValue: -1, oldValue: -1, updatedFields: {}
    };
  mainEvent?: {
    pid?: number
  } = {
      pid: -1
    };
  serverEvent?: {
    timerId?: number, startTime?: number, endTime?: number, duration?: number
  } = {
      timerId: -1, startTime: -1, endTime: -1, duration: -1
    };
  clientsEvent?: {
    id: string, ip: string, clientType: ClientType, message?: string
  } = {
      id: "", ip: "", clientType: ClientType.Unknown, message: ""
    };
  errorEvent?: {
    errCode: number, error?: Error, data?: any, message?: string
  } = {
      error: new Error(), errCode: -1
    };
  constructor(data?: Partial<IBaseEvent>) {
    Object.assign(this, data);
  }
}

interface IDebugEvent extends IBaseEvent {
  debugEvent: {
    timestamp?: number;
    success?: boolean;
    eventName?: string;
    enabled: boolean;
    startTime?: number;
    endTime?: number;
    duration?: number;
    activeEvents?: number;
    eventCounter?: number;
  };
}
export class DebugEvent extends BaseEvent implements IDebugEvent {
  debugEvent = {
      timestamp: DEFAULT_VALUE_CALLBACKS.timestamp(),
      success: false,
      eventName: "Debug Event",
      enabled: true,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      activeEvents: DEFAULT_VALUE_CALLBACKS.activeEvents(),
      eventCounter: DEFAULT_VALUE_CALLBACKS.eventCounter()
    };

  constructor(data?: Partial<IDebugEvent>) {
    super(data);
    Object.assign(this.debugEvent, data?.debugEvent);
    this.updateData();
  }

  updateData() { // Method to update debugEvent
    this.debugEvent.endTime = Date.now();
    this.debugEvent.duration = this.debugEvent.endTime - this.debugEvent.startTime;
  }
}

export type IEventTypes = IBaseEvent | IDebugEvent;

export interface IEventStats {
  eventCounter: number;
  activeEvents: number;
}

export interface IEventManager {
  stats: IEventStats;
}
// export interface IEventTypes {
//   [key: string]: { // Main event categories
//     [key: string]: any; // subType
//     BASIC: {
//       FIRST: any;
//       LAST: any;
//       DEFAULT: any;
//     }
//     MAIN: {
//       START_INTERVAL: any;
//       STOP_INTERVAL: any;
//       PID_AVAILABLE: any;
//     };
//     STATS: {
//       UPDATE_ALL: any;
//       UPDATE_PI: any;
//       UPDATE_PU: any;
//       UPDATE_OTHER: any;
//     };
//     SERVER: {
//       LISTEN: any;
//     };
//     CLIENTS: {
//       CREATE: any;
//       DELETE: any;
//       MODIFY: any;
//     };
//     CLIENT: {
//       CONNECT: any;
//       DISCONNECT: any;
//       MESSAGE: any;
//       UPDATE_STATS: any;
//       UPDATE_SETTINGS: any;
//     };
//     DEBUG: {
//       START: any;
//       STOP: any;
//     };
//     ERROR: {
//       GLOBAL: any;
//     }
//   };
// }

