const mongoose = require("mongoose")

const tutorSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true,
    },
    image:{
        type:String,
        required:false
    },
    bio:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        required:true
    },
    hourlyRate:{
        type:Number,
        required:true
    },

    subjects:{
        type:[String],
        required:true
    },
    rating:{
        type:Number,
        required:false
    },
    dateJoined: {
        type: Date,
        default: Date.now,
    },


})

const User= mongoose.model("tutors",tutorSchema)
module.exports=user;