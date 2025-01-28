const { ref } = require('joi');
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    studentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    amount:{
        type: Number,
        required: true,
    },
    status:{
        type: String,
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending',
    },
    paymentGateway:{
        type: String,
        enum: ['Khalti', 'Esewa',"Stripe"],
        required: true,
    },
    transactionId:{
        type: String,
        required: true,
    },
    paymentDate:{
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Transaction", transactionSchema);