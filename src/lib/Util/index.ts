import p5Types from "p5";
export { default as PubSub } from "./PubSub";
export { default as Easing } from "./Easing";

const map = (
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
): number => ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;

const mono = (rgba: Array<number>): number =>
    0.2125 * rgba[0] + 0.7154 * rgba[1] + 0.0721 * rgba[2];

const hexToRgb = (hex: string): Array<number> => {
    let c: Array<string> | number;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = Number("0x" + c.join(""));
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }
    throw new Error("Bad Hex");
};

const isEmpty = (obj: {}): boolean => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
};

const vectorHash = (v: p5Types.Vector, n: number = 99999999): number => {
    return Math.abs(((v.x * 40778063) ^ (v.y * 73176001) ^ (v.z * 20153153)) % n);
};

export { map, hexToRgb, mono, isEmpty, vectorHash };
