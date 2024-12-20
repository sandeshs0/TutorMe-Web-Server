const express = require("express")
const connectDb=require("./config/db")
const app= express();


connectDb();

app.use("/",()=>{
    console.log("hi bro")
})


const port=3000;
app.listen(port,()=>{
    console.log('Server Running at http://localhost:'+port)
})