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
const connectedUsers = require("./socketStore");
const NotificationRoute = require("./routes/NotificationRoute");
const SessionRoute = require("./routes/SessionRoute");

const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server

global.io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend connection
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ✅ Fix CORS issue
  },
});

// Store connected users for real-time updates
global.connectedUsers = {};
// ✅ Handle WebSocket connections
global.io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  console.log("Connected Users:", global.connectedUsers);

  // ✅ Register user on login
  socket.on("register", (userId) => {
    if (userId) {
      global.connectedUsers[userId.toString()] = socket.id;
      console.log(`✅ User ${userId} registered with socket ID ${socket.id}`);
      console.log("Connected Users:", global.connectedUsers);
      console.log(typeof global.connectedUsers);
    } else {
      console.log("⚠️ No userId provided for registration.");
    }
  });
  // console.log("Connected Users:", connectedUsers);
  // console.log(typeof connectedUsers);

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
    Object.keys(global.connectedUsers).forEach((key) => {
      if (global.connectedUsers[key] === socket.id) {
        delete global.connectedUsers[key];
        console.log(`❌ User ${key} disconnected.`);
      }
    });
    console.log(`❌ Socket disconnected: ${socket.id}`);
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
app.use("/api/notifications", NotificationRoute);
app.use("/api/sessions", SessionRoute);

const port = 3000;
server.listen(port, () => {
  console.log(`✅ Server Running at http://localhost:${port}`);
});

module.exports = { app };
