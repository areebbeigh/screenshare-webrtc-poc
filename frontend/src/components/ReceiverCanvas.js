import { useEffect, useRef } from "react";
import WebRTCConnectionManager from "../lib/WebRTCConnection";

const webRtcManager = new WebRTCConnectionManager();
export default function ReceiverCanvas() {
  const canvasEl = useRef();

  useEffect(() => {
    canvasEl.current.width = document.body.getBoundingClientRect().width;
    canvasEl.current.height = document.body.getBoundingClientRect().height;

    const ctx = canvasEl.current.getContext("2d");
    ctx.strokeStyle = "aqua";
    // Receive draw events from all peers
    webRtcManager.onNewPeer((peer) => {
      peer.on("data", (data) => {
        const drawEvent = JSON.parse(data.toString());
        console.log("Received remote draw event", drawEvent);

        if (drawEvent.type === "closePath") {
          ctx.closePath();
        } else {
          // Translate coordinates to receiver dimension coordinates
          const receiverWidth = canvasEl.current.width;
          const receiverHeight = canvasEl.current.height;
          const newX = Math.floor(
            (drawEvent.position.x / drawEvent.sourceCanvas.width) *
              receiverWidth
          );
          const newY = Math.floor(
            (drawEvent.position.y / drawEvent.sourceCanvas.height) *
              receiverHeight
          );

          // Apply remote canvas event to this canvas
          if (drawEvent.type === "beginPath") {
            ctx.moveTo(newX, newY);
            ctx.beginPath();
          } else if (drawEvent.type === "draw") {
            ctx.lineTo(newX, newY);
            ctx.stroke();
          }
        }
      });
    });
  }, []);

  return (
    <canvas
      ref={canvasEl}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
    ></canvas>
  );
}
