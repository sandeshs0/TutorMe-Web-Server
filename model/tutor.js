const mongoose = require("mongoose")

const tutorSchema= new mongoose.Schema({
    full_name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String, 
        required:true
    },
    subject:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        required:true
    }
})

const User= mongoose.model("tutors",tutorSchema)