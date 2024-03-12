import { EventEmitter } from "events";
import "reflect-metadata";
import { MainEventTypes, IEventTypes, SubEventTypes, IEventStats, BaseEvent, debugDataCallback} from './eventInterface';


export class EventEmitterMixin {
  private static _instance: EventEmitterMixin;
  public static stats: IEventStats = { eventCounter: 0, activeEvents: 0 };
  private _emitter: EventEmitter;
  private _events: Map<string, any> = new Map(); // Store default events
  // private _listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  constructor() {
    this._emitter = new EventEmitter();
  }

  private storeEvent(event: string, eventData: any) {  // Modified parameter
    if (!this._events.has(event)) {
      if (eventData[0] && !this.isValidEvent(event, eventData[0])) {
        const { customKey, customData } = this.createEvent(event, eventData);
        // if (EventEmitterMixin.stats.activeEvents > 10) {
        //   process.exit(1);
        // }
        EventEmitterMixin.stats.activeEvents++;
        this._events.set(customKey, customData);
      }
    } else {
    }
  }

  private createEvent(event: string, ...args: any[]): { customKey: string, customData: IEventTypes } {
    try {
      // Ensure args[0] conforms to the expected event interface
      if (args[0] && !this.isValidEvent(event, args[0])) {
        console.error(`Invalid event data for event type ${event as string}`);
      }
      const originalEvent = this._events.get(event);
      if (!originalEvent) {
        const newData = new BaseEvent({ data: JSON.stringify(event) });
        // newData.errorEvent = { errCode: 6, data: { event, args } };
        this.emitError(MainEventTypes.ERROR, newData);
        return { customKey: SubEventTypes.ERROR.WARNING, customData: newData };
      }
      // Get the stored event (could be BaseEvent for unknown ones) and merge
      return { customKey: event, customData: { ...args[0] }};
    } catch (error) {
      const newData = new BaseEvent({ data: JSON.stringify(event) });
      this.emitError(MainEventTypes.ERROR, newData);
      return { customKey: SubEventTypes.ERROR.WARNING, customData: newData };
    }
  }
  private isValidEvent(event: string, eventData?: any): boolean {
    switch (event) {

      case typeof MainEventTypes:
        return true;
      default:
        const newEvent: BaseEvent = { subType: SubEventTypes.ERROR.FATAL, success: false, message: 'Fatal: Invalid event type', errorEvent: { errCode: 4, data: { event, eventData } } };
        this.emit(MainEventTypes.ERROR, newEvent);
        return false;
    }
  }
  private emitError(event: string, error?: any): void {
    const newEvent: BaseEvent = {
      ...(new BaseEvent({ subType: SubEventTypes.ERROR.INFO }) as BaseEvent),
      errorEvent: {
        errCode: 2, // A sample error code
        message: event as string,
        error: new Error('Something went wrong'), // A sample error
        data: error
      },
      debugEvent: debugDataCallback,
    };
    EventEmitterMixin.stats.activeEvents--;
    this._emitter.emit(MainEventTypes.ERROR, newEvent);
  }

  // ... other EventEmitter methods
  public handleError(error: any, errorBlob?: any): void {
    const errorData: any = { ...errorBlob || error };
    console.error('Error from eventManager:', error);
    this.emitError(`${MainEventTypes.ERROR}.${MainEventTypes.ERROR}`, errorData); // Emit the error for wider handling
  }

  public async on(event: string, listener: (...args: any[]) => void) {
    // EventEmitterMixin.stats.activeEvents++;
    EventEmitterMixin.stats.eventCounter++;
    if (!this._events.has(event)) {
      this.storeEvent(event, listener); // Ensure the event is registered
    }
    // console.warn('EventEmitterMixin.on:', createCustomDebugEvent(event, listener));  
    this._emitter.on(event, listener);
  }
  public async prepend(event: string, listener: (...args: any[]) => void) {
    // this.storeEvent(event, listener);
    // console.warn('EventEmitterMixin.prepend:', createCustomDebugEvent(event, listener));  
    this._emitter.prependListener(event, listener); // Use prependListener
  }

  public async off(event: string, listener: (...args: any[]) => void) {
    // console.warn('EventEmitterMixin.off:', createCustomDebugEvent(event, listener));  
    this._emitter.off(event, listener);
    if (this._events.has(event)) {
      this._events.delete(event); // Remove the event from the stored events
    }
  }

  public async emit(event: string, ...args: any[]) {
    // const eventData = this.createEvent(event, ...args);
    // if (!eventData) {
    //   return; // Handle event creation failure
    // }

    // this._events.push(eventData); // ??
    // this.emit(MainEventTypes.ERROR, createCustomDebugEvent(event, ...args));  

    // console.warn('EventEmitterMixin.emit:', createCustomDebugEvent(event, ...args));  
    EventEmitterMixin.stats.activeEvents--;
    this._emitter.emit(event, ...args);
  }
  public static getInstance(): EventEmitterMixin {
    if (!EventEmitterMixin._instance) {
      EventEmitterMixin._instance = new EventEmitterMixin();
    }
    return EventEmitterMixin._instance;
  }
}



/*
https://github.com/neosmatrix321/websocket/tree/master
*/

// export interface IeventManager {
//   stats: { eventCounter: number; activeEvents: number; };
//   handleTimerCreated(event: eH.IEventTypes): void;
//   handleStartTimer(event: eH.IEventTypes): void;
//   handleTimerStarted(event: eH.IEventTypes): void;
//   handleStartStopTimer(event: eH.IEventTypes): void;
//   gatherAndSendStats(): void;
//   handleStatsUpdated(event: eH.IEventTypes): void;
//   serverActive(event: eH.IEventTypes): void;
//   handleClientConnected(event: eH.IEventTypes): void;
//   clientMessageReady(event: eH.IEventTypes): void;
//   updateClientStats(): void;
//   broadcastMessage(clientId: string, message?: string): void;
//   handleClientDisconnected(event: eH.IEventTypes): void;
//   handleLatencyStopped(event: eH.IEventTypes): void;
//   clientBye(event: eH.IEventTypes): void;
//   clientSettingsUpdated(event: eH.IEventTypes): void;
// }

