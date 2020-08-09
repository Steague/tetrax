import { useEffect, useState, useRef } from "react";
import Tetrax from "../lib/Tetrax";

export const useCanvas = () => {
    const getSize = (): { width: number; height: number } => {
        return {
            width: Math.floor(
                Math.max(
                    document.documentElement.clientWidth - 250 || 0,
                    window.innerWidth - 250 || 0
                )
            ),
            height: Math.max(
                document.documentElement.clientHeight || 0,
                window.innerHeight || 0
            )
        };
    };

    const [windowSize, setWindowSize] = useState(getSize);

    const canvasRef = useRef(null);
    // const canvas = canvasRef.current;
    // console.log(canvas);

    useEffect(() => {
        const handleResize = () => setWindowSize(getSize());

        // const canvas = canvasRef.current;
        // canvas.width = windowSize.width;
        // canvas.height = windowSize.height;
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    });

    return {
        ref: canvasRef,
        width: windowSize.width,
        height: windowSize.height,
        tetrax: Tetrax
    };
};
