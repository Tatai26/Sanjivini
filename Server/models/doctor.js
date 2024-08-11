const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    specialization: [String],
    qualification: String,
    experience: Number,
    practiceAddress: String,
    languagesSpoken: [String],
    consultationFeeChat: Number,
    consultationFeeVideoCall: Number,
});

module.exports = mongoose.model("Doctor", doctorSchema);