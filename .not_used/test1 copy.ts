on(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents++;
    EventEmitterMixin.stats.eventCounter++;
    this.storeEvent(event); // Ensure the event is registered
    if (args[0] && args[0].debug && args[0].debug.enabled) {
      console.log('Debug event:', event, args[0]);
    }
    this._emitter.on(event.toString(), listener);
  }

  prepend(event: string, listener: (...args: any[]) => void) {
    this.storeEvent(event);
    this._emitter.prependListener(event.toString(), listener); // Use prependListener
  }

  off(event: string, listener: (...args: any[]) => void) {
    EventEmitterMixin.stats.activeEvents--;
    this._emitter.off(event.toString(), listener);
  }

  emit(event: string, ...args: any[]) {
    const eventData = this.createEvent(event, ...args);
    if (!eventData) {
      return; // Handle event creation failure
    }
    this._emitter.emit(event.toString(), eventData);
  }

  // ... rest of the code
