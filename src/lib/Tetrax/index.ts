import Engine from "./Engine";

// Singleton pattern to only allow one instance of the game.
class Tetrax extends Engine {
    private static _instance: Tetrax;

    constructor() {
        super();
        if (Tetrax._instance) return Tetrax._instance;
        Tetrax._instance = this;
    }
}

const tetrax = new Tetrax();
Object.freeze(tetrax);

export default tetrax;
