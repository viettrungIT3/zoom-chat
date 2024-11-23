require('dotenv').config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGODB_URL;
const TOTAL_ROOMS = parseInt(process.env.TOTAL_ROOMS) || 10;
const MAX_MESSAGES_LOAD = parseInt(process.env.MAX_MESSAGES_LOAD) || 50;

function connectWithRetry() {
  mongoose
    .connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: "majority",
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
      console.error(
        "MongoDB connection unsuccessful, retry after 5 seconds.",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

const MessageSchema = new mongoose.Schema({
  room: String,
  userId: String,
  message: String,
  type: { type: String, enum: ["message", "system"] },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);

const rooms = {};
for (let i = 1; i <= TOTAL_ROOMS; i++) {
  rooms[`Room ${i}`] = {
    id: i,
    members: new Set(),
    createdAt: new Date(),
  };
}

app.use(express.static("public"));

app.get("/rooms", async (req, res) => {
  const roomList = Object.keys(rooms).map((roomName) => ({
    name: roomName,
    memberCount: rooms[roomName].members.size,
  }));
  res.json(roomList);
});

app.get("/messages/:roomName", async (req, res) => {
  try {
    const messages = await Message.find({
      room: req.params.roomName,
    })
      .sort({ timestamp: -1 })
      .limit(MAX_MESSAGES_LOAD);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: "Error retrieving messages" });
  }
});

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.emit(
    "room-list-update",
    Object.keys(rooms).map((roomName) => ({
      name: roomName,
      memberCount: rooms[roomName].members.size,
    }))
  );

  socket.on("join-room", async (roomName) => {
    socket.join(roomName);
    rooms[roomName].members.add(socket.id);

    const systemMessage = new Message({
      room: roomName,
      userId: "SYSTEM",
      message: `User ${socket.id} has joined the room.`,
      type: "system",
    });
    await systemMessage.save();

    socket.to(roomName).emit("user-joined", {
      userId: socket.id,
      message: `User ${socket.id} has joined the room.`,
    });

    io.emit(
      "room-list-update",
      Object.keys(rooms).map((roomName) => ({
        name: roomName,
        memberCount: rooms[roomName].members.size,
      }))
    );
  });

  socket.on("send-message", async ({ room, message }) => {
    const newMessage = new Message({
      room: room,
      userId: socket.id,
      message: message,
      type: "message",
    });
    await newMessage.save();

    socket.to(room).emit("receive-message", {
      userId: socket.id,
      message: message,
    });
  });

  socket.on("leave-room", async (roomName) => {
    socket.leave(roomName);
    rooms[roomName].members.delete(socket.id);

    const systemMessage = new Message({
      room: roomName,
      userId: "SYSTEM",
      message: `User ${socket.id} has left the room.`,
      type: "system",
    });
    await systemMessage.save();

    socket.to(roomName).emit("user-left", {
      userId: socket.id,
      message: `User ${socket.id} has left the room.`,
    });

    io.emit(
      "room-list-update",
      Object.keys(rooms).map((roomName) => ({
        name: roomName,
        memberCount: rooms[roomName].members.size,
      }))
    );
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (let roomName in rooms) {
      if (rooms[roomName].members.has(socket.id)) {
        rooms[roomName].members.delete(socket.id);

        const systemMessage = new Message({
          room: roomName,
          userId: "SYSTEM",
          message: `User ${socket.id} has disconnected.`,
          type: "system",
        });
        await systemMessage.save();

        socket.to(roomName).emit("user-left", {
          userId: socket.id,
          message: `User ${socket.id} has disconnected.`,
        });
      }
    }

    io.emit(
      "room-list-update",
      Object.keys(rooms).map((roomName) => ({
        name: roomName,
        memberCount: rooms[roomName].members.size,
      }))
    );
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});