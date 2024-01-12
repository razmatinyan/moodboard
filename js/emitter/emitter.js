'use strict';

/**
 * Class to make custom events and emit them from anywhere.
 */
export class Emitter extends EventTarget {
    emit(eventName, data) {
        const customEvent = new CustomEvent(eventName, { detail: data });
        this.dispatchEvent(customEvent);
    }
}