import React, { Component } from "react";
import Tetrax from "../Tetrax";
import Game from "../../lib/Tetrax";
import p5Types from "p5";
import { PubSub, vectorHash, map } from "../../lib/Util";
import { stars, starType } from "../../lib/Tetrax/Map/constants";
import p5 from "p5";
import "./App.scss";

const PoissonDiskSampling = require("poisson-disk-sampling");

interface ComponentState {
    p5: p5Types | undefined;
    camera: p5Types.Vector | undefined;
    cameraCenter: p5Types.Vector | undefined;
    cameraUp: p5Types.Vector | undefined;
    mouseDelta: p5Types.Vector | undefined;
    mouseWheelDelta: number;
    galaxy: Array<p5Types.Vector>;
    spiral: Array<p5Types.Vector>;
    width: number;
    height: number;
    font: string;
}

class App extends Component {
    private readonly _matrixSize: number;
    state: ComponentState;
    private purpleDust: p5Types.Image | undefined;
    private blueStar: p5Types.Image | undefined;
    private galaxyCore: p5Types.Image | undefined;
    private sg: p5Types.Graphics | undefined;
    private pd: p5Types.Graphics | undefined;
    private cg: p5Types.Graphics | undefined;
    private readonly _logStuff: { [key: string]: any };

    constructor(props: any) {
        super(props);

        this._logStuff = {};

        this.state = {
            p5: undefined,
            camera: undefined,
            cameraCenter: undefined,
            cameraUp: undefined,
            mouseDelta: undefined,
            mouseWheelDelta: 0,
            galaxy: [],
            spiral: [],
            width: 500,
            height: 500,
            font: ""
        };

        console.log(Game); // eslint-disable-line
        this.handlePreload = this.handlePreload.bind(this);
        this.handleSetup = this.handleSetup.bind(this);
        this.handleDraw = this.handleDraw.bind(this);
        this.handleMouseDragged = this.handleMouseDragged.bind(this);
        this.handleMousePressed = this.handleMousePressed.bind(this);
        this.handleMouseReleased = this.handleMouseReleased.bind(this);
        this.handleMouseWheel = this.handleMouseWheel.bind(this);

        this._matrixSize = 999999;
    }

    logStuff(
        id: string | number,
        stuff?: any,
        delay: number = 0,
        times: number = 1
    ): void {
        if (!this._logStuff[id] || this._logStuff[id] < times) {
        if (stuff) console.log(id, stuff); // eslint-disable-line
        else if (!stuff) console.log(id); // eslint-disable-line
            this._logStuff[id] = !this._logStuff[id] ? 1 : this._logStuff[id] + 1;
            if (!delay) return;
            setTimeout(() => (this._logStuff[id] = 0), delay);
        }
    }

    getStarType(v: p5.Vector): starType {
        const hash: number = map(
            vectorHash(v, this._matrixSize),
            0,
            this._matrixSize,
            0,
            1
        );
        const myStar: starType = {
            color: "",
            type: "",
            radius: 0,
            temp: 0,
            mass: 0,
            luminosity: 0
        };
        for (
            let i: number = 0, raritySum: number = stars[i].rarity;
            i < stars.length;
            raritySum = stars[i + 2] ? raritySum + stars[i + 1].rarity : 1, ++i
        ) {
            if (hash <= raritySum) {
                myStar.type = stars[i].type;
                myStar.color = stars[i].color;
                const newHash: number = map(vectorHash(v, 1000), 0, 1000, 0, 1);
                ["temp", "mass", "radius", "luminosity"].forEach(k => {
                    const [startRange, endRange] = (stars[i] as any)[k];
                    (myStar as any)[k] = map(newHash, 0, 1, startRange, endRange);
                });
                break;
            }
        }

        return myStar;
    }

    handleMouseDragged(p5: p5Types) {
        const { mouseDelta: oldMouseDelta } = this.state;
        if (oldMouseDelta === undefined) return;

        const sensitivity = 100;
        const dVector = p5.createVector(
            (oldMouseDelta.x - p5.mouseX) / sensitivity,
            (oldMouseDelta.y - p5.mouseY) / sensitivity,
            0
        );

        this.setState({ mouseDelta: p5.createVector(p5.mouseX, p5.mouseY) }, () => {
            this.orbit(p5, dVector);
        });
    }

    handleMouseWheel(p5: p5Types) {
        console.log((p5 as any)["_mouseWheelDeltaY"]); // eslint-disable-line
    }

    orbit(p5: p5Types, dVector: p5Types.Vector) {
        const { camera: curCamera, cameraCenter } = this.state;
        if (curCamera === undefined || cameraCenter === undefined) return;

        const diffX = curCamera.x - cameraCenter.x;
        const diffY = curCamera.y - cameraCenter.y;
        const diffZ = curCamera.z - cameraCenter.z;

        // get spherical coordinates for current camera position about origin
        let camRadius = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);
        let camTheta = Math.atan2(diffX, diffZ); // equatorial angle
        let camPhi = Math.acos(Math.max(-1, Math.min(1, diffY / camRadius))); // polar angle

        // add change
        camTheta += dVector.x;
        camPhi -= dVector.y;
        camRadius += dVector.z;

        // prevent zooming through the center:
        if (camRadius < 0) {
            camRadius = 0.1;
        }

        // prevent rotation over the zenith / under bottom
        if (camPhi > Math.PI) {
            camPhi = Math.PI;
        } else if (camPhi <= 0) {
            camPhi = 0.001;
        }

        const _x = Math.sin(camPhi) * camRadius * Math.sin(camTheta);
        const _y = Math.cos(camPhi) * camRadius;
        const _z = Math.sin(camPhi) * camRadius * Math.cos(camTheta);

        const camera = p5.createVector(
            _x + cameraCenter.x,
            _y + cameraCenter.y,
            _z + cameraCenter.z
        );

        this.setState({ camera });
    }

    handleMousePressed(p5: p5Types) {
        this.setState({ mouseDelta: p5.createVector(p5.mouseX, p5.mouseY) });
    }

    handleMouseReleased(p5: p5Types) {
        this.logStuff("p5", p5);
    }

    handlePreload(p5: p5Types, info: { [key: string]: any }) {
        const VT323 = p5.loadFont("/assets/fonts/VT323-Regular.ttf");
        // This puts the p5 object into the component state
        this.setState({ ...this.state, ...info, p5, font: VT323 });

        this.purpleDust = p5.loadImage("/assets/images/purple-dust.png");
        this.blueStar = p5.loadImage("/assets/images/blue-star.png");
        this.galaxyCore = p5.loadImage("/assets/images/core.png");

        // const p = new PoissonDiskSampling({
        //     shape: [900, 900, 3],
        //     minDistance: 30,
        //     maxDistance: 50,
        //     tries: 300
        // });
        // const points = p.fill().filter((p: number[]) => {
        //     const p0 = p[0] - 450;
        //     const p1 = p[1] - 450;
        //     return p0 * p0 + p1 * p1 < 450 * 450;
        // });
        // // const points = p.fill();
        //
        // const offsetVector = p5.createVector(-450, -450, 0);
        // const galaxy: Array<p5Types.Vector> = [];
        // for (let i = 0; i < points.length; i++) {
        //     let [x, y, z] = points[i];
        //     const nv = p5.createVector(x, y, z).add(offsetVector);
        //     galaxy.push(nv);
        // }
        // this.setState({ galaxy });
    }

    handleSetup(p5: p5Types, canvasParentRef: Element) {
        const { width, height } = this.state;
        p5.createCanvas(width, height, p5.WEBGL).parent(canvasParentRef);

        this.setState({
            camera: p5.createVector(
                0,
                0,
                (height / 2.0 / p5.tan((p5.PI * 30.0) / 180.0)) * 2
            ),
            cameraCenter: p5.createVector(0, 0, 0),
            cameraUp: p5.createVector(0, 1, 0)
        });

        let r = 100;
        let theta = 0;
        const offsetThreshold: number = 10;
        const spiral: Array<p5Types.Vector> = [];
        const rRate = 4; // p5.random(2, 2.5);
        const tRateDiv = 35; // p5.random(35, 55);
        while (r <= 450) {
            let zOffsetThreshold = offsetThreshold - r / (450 / offsetThreshold);

            for (let i = 0; i < 2; i++) {
                let x = r * p5.cos(theta) + p5.random(-offsetThreshold, offsetThreshold);
                let y = r * p5.sin(theta) + p5.random(-offsetThreshold, offsetThreshold);
                let z = p5.random(-zOffsetThreshold, zOffsetThreshold);
                // let x = r * p5.cos(theta);
                // let y = r * p5.sin(theta);
                // let z = 0;
                if (i > 0) {
                    x *= -1;
                    y *= -1;
                    z *= -1;
                }
                spiral.push(p5.createVector(x, y, z));
            }

            // Increase the angle over time
            r += rRate;
            theta -= rRate / tRateDiv;
        }

        const p = new PoissonDiskSampling({
            shape: [900, 900, 12],
            minDistance: 40,
            maxDistance: 45,
            tries: 300
        });
        const points = p.fill().map((p: number[]) => {
            return p5.createVector(p[0] - 450, p[1] - 450, p[2]);
        });

        const galaxy: Array<p5Types.Vector> = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = 0; j < spiral.length; j++) {
                if (points[i].dist(spiral[j]) <= 50) {
                    galaxy.push(points[i]);
                    break;
                }
            }
        }
        this.setState({ galaxy, spiral });

        this.sg = p5.createGraphics(128, 128, p5.P2D);
        this.pd = p5.createGraphics(128, 128, p5.P2D);
        this.cg = p5.createGraphics(350, 350, p5.P2D);

        if (
            this.blueStar !== undefined &&
            this.purpleDust !== undefined &&
            this.galaxyCore !== undefined
        ) {
            this.sg.image(this.blueStar, 0, 0);
            this.pd.image(this.purpleDust, 0, 0);
            this.cg.image(this.galaxyCore, 0, 0);
        }

        p5.textFont(this.state.font);
        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
    }

    /**
     * Get the vertices for a square, of passed size, facing the camera.
     * @param v p5 Vector indicating the center of the square.
     * @param size size of the square to be returned
     * @return Array<p5Types.Vector>
     */
    getSquareVertices(v?: p5Types.Vector, size: number = 30): Array<p5Types.Vector> {
        const { camera, cameraUp } = this.state;
        if (camera === undefined || cameraUp === undefined) return [];

        if (!v) {
            const { p5 } = this.state;
            if (p5 === undefined) return [];
            v = p5.createVector(0, 0, 0);
        }

        const normal: p5Types.Vector = camera.copy().sub(v);
        const left: p5Types.Vector = normal.cross(cameraUp);
        const squareUp = left.cross(normal);

        const leftNormMag: p5Types.Vector = left.copy().setMag(size / 2);
        const upNormMag: p5Types.Vector = squareUp.copy().setMag(size / 2);
        const leftNormMagAdd: p5Types.Vector = leftNormMag.copy().add(upNormMag);
        const leftNormMagSub: p5Types.Vector = leftNormMag.copy().sub(upNormMag);

        const vArray: Array<p5Types.Vector> = [];
        vArray.push(v.copy().sub(leftNormMagAdd));
        vArray.push(v.copy().add(leftNormMagSub));
        vArray.push(v.copy().add(leftNormMagAdd));
        vArray.push(v.copy().sub(leftNormMagSub));

        return vArray;
    }

    /**
     * Gets a rotated UV array for placing textures on shapes.
     * @param orientation A number between 0 and 1. Anything above 1 will default to normal.
     */
    getUvArray(orientation: number): Array<{ u: number; v: number }> {
        switch (true) {
            case orientation <= 0.25: {
                return [
                    { u: 0, v: 128 },
                    { u: 0, v: 0 },
                    { u: 128, v: 0 },
                    { u: 128, v: 128 }
                ];
            }
            case orientation <= 0.5: {
                return [
                    { u: 128, v: 128 },
                    { u: 0, v: 128 },
                    { u: 0, v: 0 },
                    { u: 128, v: 0 }
                ];
            }
            case orientation <= 0.75: {
                return [
                    { u: 128, v: 0 },
                    { u: 128, v: 128 },
                    { u: 0, v: 128 },
                    { u: 0, v: 0 }
                ];
            }
            default: {
                return [
                    { u: 0, v: 0 },
                    { u: 128, v: 0 },
                    { u: 128, v: 128 },
                    { u: 0, v: 128 }
                ];
            }
        }
    }

    handleDraw(p5: p5Types) {
        const { galaxy, spiral, camera, cameraCenter, cameraUp } = this.state;
        PubSub.publish("game-frame", p5.frameCount);

        if (
            camera === undefined ||
            cameraUp === undefined ||
            cameraCenter === undefined ||
            this.sg === undefined ||
            this.pd === undefined ||
            this.cg === undefined
        )
            return;
        // p5.resizeCanvas(width, height);

        p5.camera(
            camera.x,
            camera.y,
            camera.z,
            cameraCenter.x,
            cameraCenter.y,
            cameraCenter.z,
            cameraUp.x,
            cameraUp.y,
            cameraUp.z
        );

        p5.background("#03060A");

        const squareVertices = this.getSquareVertices();

        p5.push();
        p5.translate(0, 0, 0);
        p5.beginShape();
        p5.texture(this.cg);
        const uvArray = [
            { u: 0, v: 0 },
            { u: 256, v: 0 },
            { u: 256, v: 256 },
            { u: 0, v: 256 }
        ];
        for (let i = 0; i < squareVertices.length; i++) {
            const sv = squareVertices[i];
            const uv = uvArray[i];
            const lsv = sv.copy().mult(20);
            p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
        }
        p5.endShape(p5.CLOSE);
        p5.pop();

        let starCount = 0;
        for (let i: number = 0; i < galaxy.length; i++) {
            const vector = galaxy[i];
            const star = this.getStarType(vector);
            const { x, y, z } = vector;

            p5.push();
            p5.translate(x, y, z);
            // if (hash > 0.7) {
            p5.tint(star.color);
            p5.beginShape();
            p5.texture(this.sg);
            for (let i = 0; i < squareVertices.length; i++) {
                const sv = squareVertices[i];
                const uv = this.getUvArray(1)[i];
                const lsv = sv
                    .copy()
                    .mult(map(star.radius, 0.00001, 10, 0.3, 1))
                    .add(vector);
                p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
            }
            p5.endShape(p5.CLOSE);
            starCount++;
            // }
            p5.pop();
        }

        for (let i: number = 0; i < spiral.length; i++) {
            const vector = spiral[i];
            const star = this.getStarType(vector);
            const { x, y, z } = vector;
            const hash: number = map(vectorHash(vector, 1000), 0, 1000, 0, 1);

            p5.push();
            p5.translate(x, y, z);
            // if (hash < 0.7) {
            p5.tint(star.color);
            p5.beginShape();
            p5.texture(this.pd);
            for (let i = 0; i < squareVertices.length; i++) {
                const sv = squareVertices[i];
                const uv = this.getUvArray(map(hash, 0, 0.2, 0, 1))[i];
                const lsv = sv
                    .copy()
                    .mult(map(star.radius, 0.00001, 10, 10, 10))
                    .add(vector);
                p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
            }
            p5.endShape(p5.CLOSE);
            // }
            p5.pop();
        }

        this.logStuff("star count", starCount);
    }

    render() {
        return (
            <div className="App">
                <div className="App-Left-Sidebar">left</div>
                <div className="App-Main-Content">
                    <Tetrax
                        className="App-Tetrax"
                        preload={this.handlePreload}
                        setup={this.handleSetup}
                        draw={this.handleDraw}
                        mouseDragged={this.handleMouseDragged}
                        mousePressed={this.handleMousePressed}
                        mouseReleased={this.handleMouseReleased}
                        mouseWheel={this.handleMouseWheel}
                    />
                </div>
            </div>
        );
    }
}

export default App;
