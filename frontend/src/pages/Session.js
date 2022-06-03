import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SocketConnection from "../lib/SocketConnection";
import WebRTCConnectionManager from "../lib/WebRTCConnection";

const socketConnection = new SocketConnection();
const webRtcManager = new WebRTCConnectionManager();

export default function Session() {
  const { sessionId } = useParams();
  const [session, setSession] = useState();
  const [showStream, setShowStream] = useState(false);
  const screenStreamRef = useRef();
  const videoElRef = useRef();
  // Is this user the screen broadcaster?
  const isBroadcaster = session?.broadcaster === socketConnection.socket.id;

  useEffect(() => {
    let mounted = true;

    if (socketConnection.currentSession?.id !== sessionId) {
      socketConnection.socket.emit("leave", socketConnection.currentSession);
      socketConnection.socket.emit("join or create", sessionId);
    }

    socketConnection.socket.on("session_update", (session) => {
      if (!mounted) return;
      if (!session.broadcaster) {
        setShowStream(false);
        webRtcManager.resetPeers();
        // Remove all old listeners for webrtc signaling.
        socketConnection.socket.off("webrtc-signal");
      }
      setSession(session);
    });

    return () => (mounted = false);
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;
    if (!session?.broadcaster) return;

    if (!isBroadcaster) {
      // When the broadcaster changes, we want to start a webrtc connection with
      // the new broadcaster for the video stream.
      const peer = webRtcManager.createRemotePeer(
        session.broadcaster,
        true,
        (signal) => {
          if (!mounted) return;
          // Use the socket.io server as the initial signaling server
          socketConnection.socket.emit("webrtc-signal", {
            to: session.broadcaster,
            from: socketConnection.socket.id,
            signal,
          });
        }
      );

      // Listen for streams from broadcaster
      peer.on("stream", (stream) => {
        console.log("Got peer stream:");
        console.log(stream);
        screenStreamRef.current = stream;
        setShowStream(true);
      });
    }

    socketConnection.socket.on("webrtc-signal", (incomingSignal) => {
      if (isBroadcaster) {
        // As a broadcaster, we need to listen for webrtc peer connection signals
        // and respond.
        if (!mounted) return;
        if (incomingSignal.to !== socketConnection.socket.id) {
          console.error(
            `Expected webrtc signal for this client but got signal for ${incomingSignal.to} instead.`
          );
          return;
        }

        console.log("Broadcaster received webrtc signal:");
        console.log(incomingSignal);

        let peer = webRtcManager.getPeer(incomingSignal.from);
        if (peer === undefined) {
          peer = webRtcManager.createRemotePeer(
            incomingSignal.from,
            false,
            (signal) => {
              if (!mounted) return;
              // Send a response signal back to the remote peer
              socketConnection.socket.emit("webrtc-signal", {
                to: incomingSignal.from,
                from: socketConnection.socket.id,
                signal,
              });
            }
          );

          peer.on("connect", () => {
            if (!mounted) return;
            console.log("Connected to peer " + incomingSignal.from);
            peer.addStream(screenStreamRef.current);
          });
        }
        // Give this peer object the signal we received
        peer.signal(incomingSignal.signal);
      } else {
        // Listen for answer signal from broadcaster
        if (incomingSignal.to !== socketConnection.socket.id) {
          console.error(
            `Expected webrtc signal for this client but got signal for ${incomingSignal.to} instead.`
          );
          return;
        }

        console.log("Received webrtc-signal:");
        console.log(incomingSignal);

        const peer = webRtcManager.getPeer(incomingSignal.from);
        peer.signal(incomingSignal.signal);
      }
    });

    return () => (mounted = false);
  }, [session?.broadcaster, isBroadcaster]);

  useEffect(() => {
    if (showStream) {
      videoElRef.current.srcObject = screenStreamRef.current;
    }
  }, [showStream]);

  const handleShare = async () => {
    // Fetch the screen share stream
    const captureStream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
    });
    screenStreamRef.current = captureStream;
    setShowStream(true);
    // Update session status
    socketConnection.socket.emit("share_screen", session.id);
  };

  return (
    <>
      <p>You are {socketConnection.socket.id}</p>
      {!session?.broadcaster ? (
        <button onClick={handleShare}>Share Screen</button>
      ) : (
        <>
          <p>Broadcaster: {session?.broadcaster}</p>
        </>
      )}
      <video
        autoPlay
        ref={videoElRef}
        hidden={!showStream}
        width="80%"
        height="80%"
      />
    </>
  );
}
