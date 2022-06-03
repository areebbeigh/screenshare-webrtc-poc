import { useNavigate } from "react-router-dom";
import SocketConnection from "../lib/SocketConnection";

const socketConnection = new SocketConnection();

export default function Home() {
  const navigate = useNavigate();

  const handleCreate = () => {
    socketConnection.socket.emit("join or create");
    socketConnection.socket.on("created", (sessionId) => {
      console.log("Created session " + sessionId);
      navigate(`/session/${sessionId}`);
    });
  };

  return <button onClick={handleCreate}>Create Session</button>;
}
