const mongoose = require("mongoose");

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
});

// Contact schema
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  phone: String,
  email: String,
});

// SOS Alert schema
const sosSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
});

module.exports = {
  User: mongoose.model("User", userSchema),
  Contact: mongoose.model("Contact", contactSchema),
  SOS: mongoose.model("SOS", sosSchema),
};