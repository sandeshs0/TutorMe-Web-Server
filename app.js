require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
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

app.use(
  cors({
    origin: "http://localhost:5173", // Frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Enable cookies if needed
  })
);

app.use(express.json());
app.use("/api/users", UserRoute);
app.use("/api/tutors", TutorRoute);
app.use("/api/subjects", SubjectRoute);
app.use("/api/student", StudentRoute);
app.use("/auth", AuthRoute);
app.use("/api/transaction", walletRoutes);

// app.use("/",()=>{
//     console.log("hi bro")
// })

const port = 3000;
app.listen(port, () => {
  console.log("Server Running at http://localhost:" + port);
});
