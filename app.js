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
const EarningRoute = require("./routes/EarningRoute");
const ReviewRoute = require("./routes/ReviewRoute");

const app = express();
const server = http.createServer(app);

module.exports = { app };

global.io = socketIo(server, {
  cors: {
    origin: "https://tutor-me-web-client.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

global.connectedUsers = {};
global.io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  console.log("Connected Users:", global.connectedUsers);

  socket.on("register", (userId) => {
    if (userId) {
      global.connectedUsers[userId.toString()] = socket.id;
      console.log(`✅ User ${userId} registered with socket ID ${socket.id}`);
      console.log("Connected Users:", global.connectedUsers);
      console.log(typeof global.connectedUsers);
    } else {
      console.log(" No userId provided for registration.");
    }
  });
  // console.log("Connected Users:", connectedUsers);
  // console.log(typeof connectedUsers);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("send-message", (data) => {
    io.to(data.roomId).emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    Object.keys(global.connectedUsers).forEach((key) => {
      if (global.connectedUsers[key] === socket.id) {
        delete global.connectedUsers[key];
        console.log(`User ${key} disconnected.`);
      }
    });
    console.log(` Socket disconnected: ${socket.id}`);
  });
});

connectDb();

app.use(
  cors({
    origin: "https://tutor-me-web-client.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", AuthRoute);
app.use("/api/users", UserRoute);
app.use("/api/tutors", TutorRoute);
app.use("/api/subjects", SubjectRoute);
app.use("/api/student", StudentRoute);
app.use("/api/transaction", WalletRoute);
app.use("/api/bookings", BookingRoute);
app.use("/api/notifications", NotificationRoute);
app.use("/api/sessions", SessionRoute);
app.use("/api/earning", EarningRoute);
app.use("/api/review", ReviewRoute);

const port = process.env.PORT || 5000;
// server.listen(port, () => {
//   console.log(` Server Running at http://localhost:${port}`);
// });

// module.exports = { app };

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    console.log(`✅ Server Running at http://localhost:${port}`);
  });
}

module.exports = { app, server };
