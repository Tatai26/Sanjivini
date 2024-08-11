const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: "string",
    email: "string",
    hash: "string",
    phone: Number
})

module.exports = mongoose.model("User", UserSchema);