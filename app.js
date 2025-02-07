require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const http = require("http");
const socketIo = require("socket.io");

const UserRoute = require("./routes/userRoute");
const TutorRoute = require("./routes/tutorRoute");
const AuthRoute = require("./routes/AuthRoute");
const SubjectRoute = require("./routes/SubjectRoute");
const StudentRoute = require("./routes/StudentRoute");
const WalletRoute = require("./routes/WalletRoute");
const BookingRoute = require("./routes/BookingRoute");

const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend connection
    methods: ["GET", "POST"],
  },
});

// Store connected users for real-time updates
const connectedUsers = {};

// ✅ Handle WebSocket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // ✅ Register user on login
  socket.on("register", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });

  // ✅ Join a chat/session room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // ✅ Handle real-time messages
  socket.on("send-message", (data) => {
    io.to(data.roomId).emit("receive-message", data);
  });

  // ✅ Notify on user disconnect
  socket.on("disconnect", () => {
    Object.keys(connectedUsers).forEach((userId) => {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
      }
    });
    console.log("User disconnected:", socket.id);
  });
});

// ✅ Connect to MongoDB
connectDb();

// ✅ Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Routes
app.use("/api/users", UserRoute);
app.use("/api/tutors", TutorRoute);
app.use("/api/subjects", SubjectRoute);
app.use("/api/student", StudentRoute);
app.use("/auth", AuthRoute);
app.use("/api/transaction", WalletRoute);
app.use("/api/bookings", BookingRoute);

const port = 3000;
server.listen(port, () => {
  console.log(`✅ Server Running at http://localhost:${port}`);
});

module.exports = { app, io, connectedUsers };
