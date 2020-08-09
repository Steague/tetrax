import Map from "../Map";
import { PubSub } from "../../Util";

class Engine {
    private readonly _map: Map;
    private _frameUnsub: () => void;

    constructor() {
        // send serialized map to the Map constructor
        this._map = new Map({});
        this._frameUnsub = () => {};

        this.initFrameSub();

        this.tick = this.tick.bind(this);
    }

    initFrameSub() {
        this._frameUnsub = PubSub.subscribe("game-frame", frame => this.tick(frame));
    }

    tick(frame: number) {
        // console.log("tick", frame);
    }

    get map(): Map {
        return this._map;
    }
}

export default Engine;
