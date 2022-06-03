const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = require("http").Server(app);

const io = new Server(server, { cors: { origin: "*" } });

// In memory db for PoC :)
const sessions = {};

io.on("connection", function (socket) {
  // Client wants to join or create a session
  socket.on("join or create", async function (sessionId) {
    console.log("join or create " + sessionId);
    console.log(sessions);
    if (!sessionId || !sessions[sessionId]) {
      // Create a new session
      const id = sessionId || socket.id;
      sessions[id] = {
        id,
        broadcaster: null,
      };
      socket.emit("created", socket.id);
      socket.emit("session_update", sessions[socket.id]);
    } else {
      // Notify new join to participants
      io.sockets.in(sessionId).emit("new_joiner", socket.id);
      socket.join(sessionId);
      socket.emit("session_update", sessions[sessionId]);
    }
  });

  // Leave a session
  socket.on("leave", (sessionId) => {
    socket.leave(sessionId);
    if (sessions[sessionId]?.broadcaster == socket.id) {
      sessions[sessionId] = {
        ...(sessions[sessionId] || { id: sessionId }),
        broadcaster: null,
      };
      io.in(sessionId).emit("session_update", sessions[sessionId]);
    }
  });

  socket.on("disconnecting", () => {
    console.log("Disconnecting: " + socket.id);
    console.log(socket.rooms);
    socket.rooms.forEach((sessionId) => {
      if (sessions[sessionId]?.broadcaster == socket.id) {
        sessions[sessionId] = {
          ...(sessions[sessionId] || { id: sessionId }),
          broadcaster: null,
        };
        io.in(sessionId).emit("session_update", sessions[sessionId]);
      }
    });
  });

  // Someone wants to share their screen to sessionId
  socket.on("share_screen", (sessionId) => {
    if (sessions[sessionId]?.isSharing) {
      socket.emit("session_occupied");
    } else {
      sessions[sessionId] = {
        ...sessions[sessionId],
        broadcaster: socket.id,
      };
      io.in(sessionId).emit("session_update", sessions[sessionId]);
    }
  });

  // WebRTC signaling
  socket.on("webrtc-signal", (signal) => {
    console.log("Got webrtc signal:");
    console.log(signal);
    io.in(signal.to).emit("webrtc-signal", signal);
  });
});

const path = require("path");
const { sign } = require("crypto");

app.use("/public", express.static("./frontend/build/", { etag: false }));
app.use("/*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./frontend/build/index.html"))
);

server.listen(process.env.PORT || 8000, () => console.log(`Server running.`));
