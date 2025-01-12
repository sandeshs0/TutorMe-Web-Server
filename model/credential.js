const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["student", "tutor", "admin"],
        required: true,
    },

});

const Credentials =mongoose.model("credentials",credentialSchema);

module.exports=Credentials;