const mongoose=require("mongoose");
const connectDB= async ()=>{
    try{
        await mongoose.connect("mongodb://localhost:27017/db_tutorme")
        console.log("Database connected")
    }catch(e){
        console.log("Error connecting database")
    }
}

module.exports=connectDB;