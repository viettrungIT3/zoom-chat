require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
const MONGO_URL =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI // Heroku/Production MongoDB
    : process.env.MONGODB_URL; // Local MongoDB
const TOTAL_ROOMS = parseInt(process.env.TOTAL_ROOMS) || 10;
const MAX_MESSAGES_LOAD = parseInt(process.env.MAX_MESSAGES_LOAD) || 50;
const NUMBER_RETRY_CONNECT_DB = parseInt(process.env.NUMBER_RETRY_CONNECT_DB) || 5;
var count_retry_connect_db = 0;

let isDbConnected = false; // Biến trạng thái kết nối DB

// connect MongoDB with retry logic
function connectWithRetry() {
  mongoose
    .connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: "majority",
    })
    .then(() => {
      console.log("MongoDB connected successfully");
      isDbConnected = true;
    })
    .catch((err) => {
      isDbConnected = false;
      if (count_retry_connect_db < NUMBER_RETRY_CONNECT_DB) {
        count_retry_connect_db++;
        console.error(
          "MongoDB connection unsuccessful, retrying in 5 seconds.",
          err
        );
        setTimeout(connectWithRetry, 5000);
      } else {
        console.error("MongoDB connection failed after 5 retries.");
      }
    });
}

connectWithRetry();

// Define Schema and Model if DB connected successfully
let Message;
if (isDbConnected) {
  const MessageSchema = new mongoose.Schema({
    room: String,
    userId: String,
    message: String,
    type: { type: String, enum: ["message", "system"] },
    timestamp: { type: Date, default: Date.now },
  });

  Message = mongoose.model("Message", MessageSchema);
}

// Initialize room list
const rooms = {};
for (let i = 1; i <= TOTAL_ROOMS; i++) {
  rooms[`Room ${i}`] = {
    id: i,
    members: new Set(),
    createdAt: new Date(),
  };
}

app.use(express.static("public"));

// API get room list
app.get("/rooms", async (req, res) => {
  const roomList = Object.keys(rooms).map((roomName) => ({
    name: roomName,
    memberCount: rooms[roomName].members.size,
  }));
  res.json(roomList);
});

// API get messages in room
app.get("/messages/:roomName", async (req, res) => {
  if (!isDbConnected || !Message) {
    return res.json([]); // Trả về mảng rỗng nếu không có DB
  }

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

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Send room list when connected
  socket.emit(
    "room-list-update",
    Object.keys(rooms).map((roomName) => ({
      name: roomName,
      memberCount: rooms[roomName].members.size,
    }))
  );

  // Handle join room
  socket.on("join-room", async (roomName) => {
    socket.join(roomName);
    rooms[roomName].members.add(socket.id);

    if (isDbConnected && Message) {
      const systemMessage = new Message({
        room: roomName,
        userId: "SYSTEM",
        message: `User ${socket.id} has joined the room.`,
        type: "system",
      });
      await systemMessage.save();
    }

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

  // Handle send message
  socket.on("send-message", async ({ room, message }) => {
    if (isDbConnected && Message) {
      const newMessage = new Message({
        room: room,
        userId: socket.id,
        message: message,
        type: "message",
      });
      await newMessage.save();
    }

    socket.to(room).emit("receive-message", {
      userId: socket.id,
      message: message,
    });
  });

  // Handle leave room
  socket.on("leave-room", async (roomName) => {
    socket.leave(roomName);
    rooms[roomName].members.delete(socket.id);

    if (isDbConnected && Message) {
      const systemMessage = new Message({
        room: roomName,
        userId: "SYSTEM",
        message: `User ${socket.id} has left the room.`,
        type: "system",
      });
      await systemMessage.save();
    }

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

  // Handle when user disconnect
  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (let roomName in rooms) {
      if (rooms[roomName].members.has(socket.id)) {
        rooms[roomName].members.delete(socket.id);

        if (isDbConnected && Message) {
          const systemMessage = new Message({
            room: roomName,
            userId: "SYSTEM",
            message: `User ${socket.id} has disconnected.`,
            type: "system",
          });
          await systemMessage.save();
        }

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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
