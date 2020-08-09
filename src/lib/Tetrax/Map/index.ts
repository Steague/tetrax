import Generation from "./Generation";
import { isEmpty } from "../../Util";

class Map {
    private readonly _state: {};

    constructor(state: {}) {
        if (!isEmpty(state)) this._state = state;
        else this._state = new Generation().state;
    }

    get state(): {} {
        return this._state;
    }
}

export default Map;
