const EventEmitter = require('events');

class EventEmitterMixin extends EventEmitter {
    constructor() {
        super();
        this.eventMap = {};
    }

    on(eventName, listener) {
        if (!this.eventMap[eventName]) {
            this.eventMap[eventName] = [];
        }
        this.eventMap[eventName].push(listener);
        super.on(eventName, listener);
    }

    prepend(eventName, listener) {
        if (!this.eventMap[eventName]) {
            this.eventMap[eventName] = [];
        }
        this.eventMap[eventName].unshift(listener);
        super.prependListener(eventName, listener);
    }

    emit(eventName, ...args) {
        if (this.eventMap[eventName]) {
            super.emit(eventName, ...args);
        }
    }

    off(eventName, listener) {
        if (this.eventMap[eventName]) {
            const index = this.eventMap[eventName].indexOf(listener);
            if (index > -1) {
                this.eventMap[eventName].splice(index, 1);
            }
            super.removeListener(eventName, listener);
        }
    }
}