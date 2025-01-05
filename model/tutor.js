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
    description:{
        type:String,
        required:true
    },
    hourlyRate:{
        type:Number,
        required:true
    },

    subjects: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'subjects', // Referencing the subjects collection for better queries
        },
      ],
      availability: {
        type: String, // Can be a JSON string or a structured format (e.g., "Monday: 9-5")
        required: false,
      },
    rating:{
        type:Number,
        required:false,
        default:0,
    },
    dateJoined: {
        type: Date,
        default: Date.now,
    },


})

const tutor= mongoose.model("tutors",tutorSchema)
module.exports=tutor;