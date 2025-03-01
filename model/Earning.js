const { ref } = require('joi');
const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
    tutorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true,
    },
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    amount:{
        type: Number,
        required: true,
    },
    type:{
        type: String,
        enum: ['BookingFee', 'SessionFee'],
    },
    date:{
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Earning", earningSchema);