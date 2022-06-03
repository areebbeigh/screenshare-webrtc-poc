import { io } from "socket.io-client";

// Singleton class for managing socket connection
export default class SocketConnection {
  constructor() {
    if (!SocketConnection._instance) {
      SocketConnection._instance = this;
      this.initConnection();
    }
    return SocketConnection._instance;
  }

  initConnection() {
    this.socketUrl = process.env.REACT_APP_SOCKET_URL;
    console.log("Init socket conn: " + this.socketUrl);
    this.socket = io(this.socketUrl);
    console.log(this.socket);

    this.socket.on("session_update", (session) => {
      this.currentSession = session;
      console.log("Session updated:");
      console.log(session);
    });

    this.socket.on("invalid_session_id", () => {
      alert("Invalid room!");
    });
  }
}
