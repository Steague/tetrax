class Generation {
    private readonly _state: {};
    constructor() {
        this._state = {
            generating: true
        };
    }

    get state(): {} {
        return this._state;
    }
}

export default Generation;
