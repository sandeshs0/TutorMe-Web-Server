require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const UserRoute = require("./routes/userRoute");
const TutorRoute = require("./routes/tutorRoute");
const AuthRoute = require("./routes/AuthRoute");
const Subject = require("./model/subject");
const app = express();
const SubjectRoute = require("./routes/SubjectRoute");
const Student = require("./model/student");
const StudentRoute = require("./routes/StudentRoute");
const walletRoutes = require("./routes/WalletRoute");

connectDb();
const server = http.createServer(app); // ✅ Create HTTP server

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// ✅ Handle WebSocket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room (for chat or session updates)
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

    // Handle real-time messages
    socket.on("send-message", (data) => {
      io.to(data.roomId).emit("receive-message", data);
    });
  
    // Notify when user disconnects
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

app.use(
  cors({
    origin: "http://localhost:5173", // Frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Enable cookies if needed
  })
);

// console.log(process.env)
app.use(express.json());
app.use("/api/users", UserRoute);
app.use("/api/tutors", TutorRoute);
app.use("/api/subjects", SubjectRoute);
app.use("/api/student", StudentRoute);
app.use("/auth", AuthRoute);
app.use("/api/transaction", walletRoutes);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// app.use("/",()=>{
//     console.log("hi bro")
// })

const port = 3000;
app.listen(port, () => {
  console.log("Server Running at http://localhost:" + port);
});
