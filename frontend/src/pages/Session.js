import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SocketConnection from "../lib/SocketConnection";

const socketConnection = new SocketConnection();

export default function Session() {
  const { sessionId } = useParams();
  const [session, setSession] = useState();

  useEffect(() => {
    let mounted = true;

    if (socketConnection.currentSession?.id !== sessionId) {
      socketConnection.socket.emit("leave", socketConnection.currentSession);
      socketConnection.socket.emit("join or create", sessionId);
    }

    socketConnection.socket.on("session_update", (session) => {
      if (!mounted) return;
      setSession(session);
    });

    return () => (mounted = false);
  }, [sessionId]);

  const handleShare = () => {
    socketConnection.socket.emit("share_screen", session.id);
  };

  return (
    <>
      {!session?.broadcaster ? (
        <button onClick={handleShare}>Share Screen</button>
      ) : (
        <p>{session?.broadcaster}</p>
      )}
    </>
  );
}
