import React from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { useCanvas } from "../../hooks/useCanvas";

interface ComponentProps {
    //Your component props
    className?: string;
    style?: {};
    setup: (p5: p5Types, canvasParentRef: Element) => void;
    draw: (p5: p5Types) => void;
    mouseMoved?: (p5: p5Types) => void;
    mousePressed?: (p5: p5Types) => void;
    mouseDragged?: (p5: p5Types) => void;
    mouseReleased?: (p5: p5Types) => void;
    mouseWheel?: (p5: p5Types) => void;
    preload?: (p5: p5Types, info: any) => void;
    // windowResized	❌	Function	The windowResized() function is called once every time the browser window is resized.
    // preload	❌	Function	Called directly before setup(), the preload() function is used to handle asynchronous loading of external files in a blocking way.
    // mouseClicked	❌	Function	The mouseClicked() function is called once after a mouse button has been pressed and then released.
    // doubleClicked	❌	Function	The doubleClicked() function is executed every time a event listener has detected a dblclick event which is a part of the DOM L3 specification.
    // mouseWheel	❌	Function	The function mouseWheel() is executed every time a vertical mouse wheel event is detected either triggered by an actual mouse wheel or by a touchpad.
    // mouseDragged	❌	Function	The mouseDragged() function is called once every time the mouse moves and a mouse button is pressed. If no mouseDragged() function is defined, the touchMoved() function will be called instead if it is defined.
    // mouseReleased	❌	Function	The mouseReleased() function is called every time a mouse button is released.
    // keyPressed	❌	Function	The keyPressed() function is called once every time a key is pressed. The keyCode for the key that was pressed is stored in the keyCode variable.
    // keyReleased	❌	Function	The keyReleased() function is called once every time a key is released. See key and keyCode for more information.
    // keyTyped	❌	Function	The keyTyped() function is called once every time a key is pressed, but action keys such as Backspace, Delete, Ctrl, Shift, and Alt are ignored.
    // touchStarted	❌	Function	The touchStarted() function is called once after every time a touch is registered.
    // touchMoved	❌	Function	The touchMoved() function is called every time a touch move is registered.
    // touchEnded	❌	Function	The touchEnded() function is called every time a touch ends. If no touchEnded() function is defined, the mouseReleased() function will be called instead if it is defined.
    // deviceMoved	❌	Function	The deviceMoved() function is called when the device is moved by more than the threshold value along X, Y or Z axis. The default threshold is set to 0.5. The threshold value can be changed using setMoveThreshold()
    // deviceTurned	❌	Function	The deviceTurned() function is called when the device rotates by more than 90 degrees continuously.
    // deviceShaken
}

const Tetrax: React.FC<ComponentProps> = (props: ComponentProps) => {
    const { ref, width, height } = useCanvas();

    const preload = (p5: p5Types) => {
        if (props.preload) props.preload(p5, { ref, width, height });
        if (ref !== null && ref.current !== null) {
            // Stupid dumb hack to get transparent PNG textures to work.
            setTimeout(() => {
                // @ts-ignore
                const gl = ref.current.sketch._renderer.GL;
                gl.disable(gl.DEPTH_TEST);
            }, 200);
        }
    };

    return (
        <Sketch
            ref={ref}
            className={props.className}
            style={props.style || {}}
            preload={preload}
            setup={props.setup}
            draw={props.draw}
            mouseDragged={props.mouseDragged}
            mousePressed={props.mousePressed}
            mouseReleased={props.mouseReleased}
            mouseWheel={props.mouseWheel}
        />
    );
};

export default Tetrax;
