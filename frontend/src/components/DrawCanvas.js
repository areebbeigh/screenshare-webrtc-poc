import { useEffect, useRef } from "react";
import WebRTCConnectionManager from "../lib/WebRTCConnection";

const webRtcManager = new WebRTCConnectionManager();
export default function DrawCanvas({ videoEl }) {
  const canvasEl = useRef();
  const divEl = useRef();

  useEffect(() => {
    let mounted = true;

    setTimeout(() => {
      canvasEl.current.width = videoEl.current.getBoundingClientRect().width;
      canvasEl.current.height = videoEl.current.getBoundingClientRect().height;
    }, 2000);

    const ctx = canvasEl.current?.getContext("2d");
    
    // Draw only on mouse down
    let enableDraw = false;
    let pathEnabled = false;
    canvasEl.current.addEventListener("mousedown", () => {
        enableDraw = true;
    });
    canvasEl.current.addEventListener("mouseup", () => {
        const broadcastPeer = webRtcManager.listPeers()[0];
        enableDraw = false;
        pathEnabled = false;
        ctx.closePath();
        broadcastPeer.write(
            JSON.stringify({
                type: "closePath",
            })
            );
        });
        
        // If we are not broadcasting, we're connected to only the broadcaster
        canvasEl.current?.addEventListener("mousemove", (e) => {
            if (!mounted) return;
            ctx.strokeStyle = "red";
            const position = {
                x: e.offsetX || e.layerX,
                y: e.offsetY || e.layerY,
            };
            
            if (enableDraw) {
                const broadcastPeer = webRtcManager.listPeers()[0];
        const sourceCanvas = {
          width: canvasEl.current.width,
          height: canvasEl.current.height,
        };
        if (!pathEnabled) {
          ctx.moveTo(position.x, position.y);
          ctx.beginPath();
          pathEnabled = true;
          broadcastPeer?.write(
            JSON.stringify({
              type: "beginPath",
              position,
              sourceCanvas,
            })
          );
        } else {
          ctx.lineTo(position.x, position.y);
          ctx.stroke();
          broadcastPeer?.write(
            JSON.stringify({
              type: "draw",
              position,
              sourceCanvas,
            })
          );
        }
      }
    });

    return () => (mounted = false);
  }, []);

  return (
    <div
      ref={divEl}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        zIndex: 2,
      }}
    >
      <canvas ref={canvasEl}>
        <p>Canvas not supported</p>
      </canvas>
    </div>
  );
}
