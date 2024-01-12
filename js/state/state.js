'use strict';

/**
 * State manager for konva.js by Raz.
 * Class to control board state and have a board history
 * to switch between previous and next states, and save current state.
 */
export class State {
    static #instance;
    #state = [];
    #step = 0;
    #maxSize = 100;

    /**
     * @param {Konva.Stage} stage - konva.js stage (Dependency Injection)
     * @param {Emitter} emitter - custom event emitter (Dependency Injection)
     */
    constructor(stage, emitter) {
        if (State.#instance) return State.#instance;
        State.#instance = this;

        if (!stage) throw new Error('Stage need to be provided!');
        if (!emitter || !(emitter instanceof Emitter)) throw new Error('Emitter instance is required!');

        this.$emitter = emitter;
        this.stage = stage;
        this.layer = stage.findOne('.layer');
    }

    /**
     * Add new state
     * @returns instance
     */
    add() {
        if (this.size >= this.#maxSize) this.#state.shift();
        if (this.#step < this.size) this.#removeStateByIndex(this.#step);

        const newState = this.layer.toObject().children;
        this.#state.push({ ...newState });

        if (this.size < this.#maxSize) this.#step++;

        this.$emitter.emit('add');

        return this;
    }

    /**
     * Update state, relevant to step
     * @returns instance
     */
    #update() {
        this.$emitter.emit('update', this.currentState);
        return this;
    }

    /**
     * Empty whole state
     * @returns instance
     */
    empty() {
        this.#state.length = 0;
        this.$emitter.emit('empty');
        return this;
    }

    /**
     * Remove elements starting from given index
     * from this.#state array
     * @param {number} index - index to delete from
     * @returns instance
     */
    #removeStateByIndex(index) {
        this.#state.splice(index);
        return this;
    }

    /**
     * Undo
     * Switch to previous state
     * @returns instance
     */
    undo() {
        if (this.#step <= 0) return this;

        this.#step--;
        this.#update();
        this.$emitter.emit('undo');
        return this;
    }

    /**
     * Redo
     * Switch to next state
     * @returns instance
     */
    redo() {
        if (this.#step + 1 > this.#maxSize || this.#step + 1 > this.size) return this;

        this.#step++;
        this.#update();
        this.$emitter.emit('redo');
        return this;
    }

    /**
     * Listen to concrete event from this class
     * @param {string} eventName - event name to listen
     * @param {Function} callback - callback function for event
     */
    on(eventName, callback) {
        this.$emitter.addEventListener(eventName, event => callback(event));
    }

    /**
     * Get all states
     */
    get states() {
        return this.#state;
    }

    /**
     * Get current state
     */
    get currentState() {
        return this.#state[this.#step - 1] ?? {};
    }

    /**
     * Get first state
     */
    get firstState() {
        return this.#state[0];
    }

    /**
     * Get last state
     */
    get lastState() {
        return this.#state[this.#state.length - 1];
    }

    /**
     * Can undo state
     */
    get canUndo() {
        return this.#step > 0;
    }

    /**
     * Can redo state
     */
    get canRedo() {
        return this.#step < this.size;
    }

    /**
     * Get state size
     * @usage state.size
     */
    get size() {
        return this.#state.length;
    }
}