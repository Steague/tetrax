import React, { Component } from "react";
import Tetrax from "../Tetrax";
import Game from "../../lib/Tetrax";
import p5Types from "p5";
import Delaunator from "delaunator";
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
    lanes: { (): any }[];
    width: number;
    height: number;
    font: string;
}

class App extends Component {
    private readonly _matrixSize: number;
    state: ComponentState;
    private dust: p5Types.Image | undefined;
    private blueStar: p5Types.Image | undefined;
    private galaxyCore: p5Types.Image | undefined;
    private sg: p5Types.Graphics | undefined;
    private dg: p5Types.Graphics | undefined;
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
            lanes: [],
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

        this.dust = p5.loadImage("/assets/images/dust.png");
        this.blueStar = p5.loadImage("/assets/images/blue-star.png");
        this.galaxyCore = p5.loadImage("/assets/images/core.png");
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

        const coreRadius = 100;
        let r = coreRadius;
        let theta = 0;
        const offsetThreshold: number = 1;
        const spiral: Array<p5Types.Vector> = [];
        const rRate = p5.TWO_PI; // p5.random(2, 2.5);
        const galaxyRadius = 400;
        while (r <= galaxyRadius) {
            let zOffsetThreshold = offsetThreshold - r / (galaxyRadius / offsetThreshold);

            for (let i = 0; i < 2; i++) {
                let x = r * p5.cos(theta) + p5.random(-offsetThreshold, offsetThreshold);
                let y = r * p5.sin(theta) + p5.random(-offsetThreshold, offsetThreshold);
                let z = p5.random(-zOffsetThreshold, zOffsetThreshold);
                if (i > 0) {
                    x *= -1;
                    y *= -1;
                    z *= -1;
                }
                spiral.push(p5.createVector(x, y, z));
            }

            // Increase the angle over time
            r += rRate;
            theta -= 0.1;
        }

        const p = new PoissonDiskSampling({
            shape: [900, 900, 3],
            minDistance: 40,
            maxDistance: 45,
            tries: 150
        });
        const points = p.fill().map((p: number[]) => {
            return p5.createVector(p[0] - 450, p[1] - 450, p[2]);
        });

        const centerVector = p5.createVector(0, 0, 0);

        const galaxy: Array<p5Types.Vector> = [];
        for (let i = 0; i < points.length; i++) {
            if (points[i].dist(centerVector) > galaxyRadius) {
                continue;
            }
            if (points[i].dist(centerVector) < coreRadius) {
                continue;
            }
            galaxy.push(points[i]);
        }
        const { triangles } = Delaunator.from(galaxy.map(s => [s.x, s.y]));
        const coordinates = [];
        for (let i = 0; i < triangles.length; i += 3) {
            coordinates.push([
                galaxy[triangles[i]],
                galaxy[triangles[i + 1]],
                galaxy[triangles[i + 2]]
            ]);
        }

        const laneDict: any = {};
        const lanes: any = [];
        for (let i: number = 0; i < coordinates.length; i++) {
            const triangle = coordinates[i];
            for (let j: number = 0; j < triangle.length; j++) {
                let p1 = !triangle[j + 1] ? triangle[0] : triangle[j];
                let p2 = !triangle[j + 1] ? triangle[j] : triangle[j + 1];
                if (p1.dist(p2) > 60) continue;
                p1 = p1.copy().mult(2);
                p2 = p2.copy().mult(2);
                const dictKey = `${p1.toString()}:${p2.toString()}`;
                if (laneDict[dictKey]) continue;
                laneDict[dictKey] = true;

                lanes.push(() => p5.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z));
            }
        }

        this.setState({ galaxy, spiral, lanes });

        this.sg = p5.createGraphics(128, 128, p5.P2D);
        this.dg = p5.createGraphics(128, 128, p5.P2D);
        this.cg = p5.createGraphics(256, 256, p5.P2D);

        if (
            this.blueStar !== undefined &&
            this.dust !== undefined &&
            this.galaxyCore !== undefined
        ) {
            this.sg.image(this.blueStar, 0, 0);
            this.dg.image(this.dust, 0, 0);
            this.cg.image(this.galaxyCore, 0, 0);
        }

        p5.blendMode(p5.ADD);
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
        if (this.sg === undefined) return [];
        const { width, height } = this.sg;
        switch (true) {
            case orientation <= 0.25: {
                return [
                    { u: 0, v: height },
                    { u: 0, v: 0 },
                    { u: width, v: 0 },
                    { u: width, v: height }
                ];
            }
            case orientation <= 0.5: {
                return [
                    { u: width, v: height },
                    { u: 0, v: height },
                    { u: 0, v: 0 },
                    { u: width, v: 0 }
                ];
            }
            case orientation <= 0.75: {
                return [
                    { u: width, v: 0 },
                    { u: width, v: height },
                    { u: 0, v: height },
                    { u: 0, v: 0 }
                ];
            }
            default: {
                return [
                    { u: 0, v: 0 },
                    { u: width, v: 0 },
                    { u: width, v: height },
                    { u: 0, v: height }
                ];
            }
        }
    }

    handleDraw(p5: p5Types) {
        const frameStart = Date.now();
        const { galaxy, spiral, lanes, camera, cameraCenter, cameraUp } = this.state;
        PubSub.publish("game-frame", p5.frameCount);

        if (
            camera === undefined ||
            cameraUp === undefined ||
            cameraCenter === undefined ||
            this.sg === undefined ||
            this.dg === undefined ||
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
            { u: this.cg.width, v: 0 },
            { u: this.cg.width, v: this.cg.height },
            { u: 0, v: this.cg.height }
        ];
        for (let i = 0; i < squareVertices.length; i++) {
            const sv = squareVertices[i];
            const uv = uvArray[i];
            const lsv = sv.copy().mult(20);
            p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
        }
        p5.endShape(p5.CLOSE);
        p5.pop();

        const startLoop = (vector: p5Types.Vector, texture: p5Types.Graphics) => {
            const star = this.getStarType(vector);
            const { x, y, z } = vector;
            const hash: number = map(vectorHash(vector, 1000), 0, 1000, 0, 1);

            p5.push();
            p5.translate(x, y, z);
            p5.tint(star.color);
            p5.beginShape();
            p5.texture(texture);

            return { star, x, y, z, hash };
        };

        let starCount = 0;
        for (let i: number = 0; i < galaxy.length; i++) {
            const galaxyVector = galaxy[i];
            const { star, x, y, z, hash } = startLoop(galaxyVector, this.sg);

            for (let i = 0; i < squareVertices.length; i++) {
                const sv = squareVertices[i];
                const uv = this.getUvArray(1)[i];
                const lsv = sv
                    .copy()
                    .mult(map(star.radius, 0.00001, 10, 0.3, 1))
                    .add(galaxyVector);
                p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
            }
            p5.endShape(p5.CLOSE);
            starCount++;
            p5.pop();

            p5.push();
            p5.translate(x, y, z);
            p5.tint(star.color);
            p5.beginShape();
            p5.texture(this.dg);
            for (let i = 0; i < squareVertices.length; i++) {
                const sv = squareVertices[i];
                const uv = this.getUvArray(hash)[i];
                const lsv = sv.copy().mult(5).add(galaxyVector);
                p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
            }
            p5.endShape(p5.CLOSE);
            p5.pop();
        }

        // console.time("lines");
        for (let i: number = 0; i < lanes.length; i++) {
            p5.push();
            p5.stroke("#8888FF11");
            p5.strokeWeight(2);
            p5.fill("#8888FF11");
            lanes[i]();
            p5.pop();
        }
        // console.timeEnd("lines");

        for (let i: number = 0; i < spiral.length; i++) {
            const spiralVector = spiral[i];
            const { hash } = startLoop(spiralVector, this.dg);

            for (let i = 0; i < squareVertices.length; i++) {
                const sv = squareVertices[i];
                const uv = this.getUvArray(hash)[i];
                const lsv = sv.copy().mult(map(hash, 0, 1, 10, 15)).add(spiralVector);
                p5.vertex(lsv.x, lsv.y, lsv.z, uv.u, uv.v);
            }
            p5.endShape(p5.CLOSE);
            p5.pop();
        }

        this.logStuff("star count", starCount);
        this.logStuff("lane count", lanes.length);
        this.logStuff("spiral points", spiral.length);
        this.logStuff("dust clouds", starCount);
        const frameTime = Date.now() - frameStart;
        if (frameTime >= 17) {
            console.log("FDT", frameTime, "FPS", (1000 / frameTime).toFixed(2)); // eslint-disable-line
        }
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
