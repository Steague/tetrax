/**
 * Singleton Publish / Subscriber Factory
 */
class PubSub {
    static _instance: PubSub;
    _subscribers: any;

    constructor() {
        if (PubSub._instance) return PubSub._instance;
        this._subscribers = {};
        return (PubSub._instance = this);
    }

    /**
     * A method for firing callbacks to listening subscribers
     * @param  {string} eventName A string describing the event being published
     * @param  {Object | string | number}  data      Data to be passed to the callback function
     * @return {undefined}
     */
    publish(eventName: string, data: any): void {
        if (!Array.isArray(this._subscribers[eventName])) return;

        this._subscribers[eventName].forEach(
            ({
                callback,
                unsubscribe
            }: {
                callback: (data: any, unsubscribe: () => void) => void;
                unsubscribe: () => void;
            }) => {
                callback(data, unsubscribe);
            }
        );
    }

    /**
     * A method for registering subscribers to events with callbacks
     * @param  {string}   eventName A string describing the event being subscribed to
     * @param  {Function} callback  A callback function to call when event is published
     * @return {Function}           The unsubscribe function to end a subscription
     */
    subscribe(
        eventName: string,
        callback: (data: any, unsubscribe: () => void) => void
    ): () => void {
        if (!Array.isArray(this._subscribers[eventName]))
            this._subscribers[eventName] = [];
        const index = this._subscribers[eventName].length;
        const unsubscribe = () => this._subscribers[eventName].splice(index, 1);
        this._subscribers[eventName].push({ callback, unsubscribe });

        return unsubscribe;
    }
}

export default new PubSub();
