const express = require("express")
const connectDb=require("./config/db")
const UserRoute=require("./routes/userRoute")
const TutorRoute=require("./routes/tutorRoute")
const AuthRoute=require("./routes/AuthRoute")
const app= express();


connectDb();

app.use(express.json());
app.use("/api/users",UserRoute );
app.use("/api/tutors",TutorRoute );
app.use("/auth",AuthRoute);


// app.use("/",()=>{
//     console.log("hi bro")
// })


const port=3000;
app.listen(port,()=>{
    console.log('Server Running at http://localhost:'+port)
})