export interface starTypes {
    type: string;
    color: string;
    temp: Array<number>;
    mass: Array<number>;
    radius: Array<number>;
    luminosity: Array<number>;
    rarity: number;
}
export interface starType {
    type: string;
    color: string;
    temp: number;
    mass: number;
    radius: number;
    luminosity: number;
}

export const stars: Array<starTypes> = [
    {
        type: "BH",
        color: "#000000",
        temp: [0, 0.000001],
        mass: [5, 60],
        radius: [0.00001, 0.00015],
        luminosity: [900000, 1100000],
        rarity: 0.01
    },
    {
        type: "O",
        color: "#BCC1ED",
        temp: [30000, 50000],
        mass: [16, 90],
        radius: [6.6, 10],
        luminosity: [30000, 1000000],
        rarity: 0.0050003
    },
    {
        type: "B",
        color: "#C9D3E3",
        temp: [10000, 30000],
        mass: [2.1, 16],
        radius: [1.8, 6.6],
        luminosity: [25, 30000],
        rarity: 0.0113
    },
    {
        type: "A",
        color: "#D4D5D1",
        temp: [7500, 10000],
        mass: [1.4, 2.1],
        radius: [1.4, 1.8],
        luminosity: [5, 25],
        rarity: 0.016
    },
    {
        type: "F",
        color: "#E3D7AE",
        temp: [6000, 7500],
        mass: [1.04, 1.4],
        radius: [1.15, 1.4],
        luminosity: [1.5, 5],
        rarity: 0.03
    },
    {
        type: "G",
        color: "#D7D182",
        temp: [5200, 6000],
        mass: [0.8, 1.04],
        radius: [0.96, 1.15],
        luminosity: [0.6, 1.5],
        rarity: 0.076
    },
    {
        type: "K",
        color: "#E4B978",
        temp: [3700, 5200],
        mass: [0.45, 0.8],
        radius: [0.7, 0.96],
        luminosity: [0.08, 0.6],
        rarity: 0.121
    },
    {
        type: "M",
        color: "#AA4443",
        temp: [2400, 3700],
        mass: [0.08, 0.45],
        radius: [0.7, 0.7],
        luminosity: [0.08, 0.08],
        rarity: 0.7295
    }
];
