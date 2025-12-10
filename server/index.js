
const axios = require("axios");
require("dotenv").config();
const express = require("express");
const connectDB = require("./db");
const { hashPassword, verifyPassword, generateToken, authenticateToken } = require("./utils");
const { User, Contact, SOS } = require("./models");
const twilio = require("twilio"); 

const app = express();
app.use(express.json());

const path = require("path");
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

connectDB();


//  Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


//  Signup
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashed = hashPassword(password);
    const user = await User.create({ email, password: hashed, name });
    const token = generateToken({ id: user._id, email });
    res.json({ token, user });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ error: "User already exists" });
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//  Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken({ id: user._id, email });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//  Get contacts
app.get("/api/contacts", authenticateToken, async (req, res) => {
  const contacts = await Contact.find({ userId: req.user.id });
  res.json({ contacts });
});

//  Add contact
app.post("/api/contacts", authenticateToken, async (req, res) => {
  const { name, phone, email } = req.body;
  const contact = await Contact.create({ userId: req.user.id, name, phone, email });
  res.json({ contact });
});

//  SOS Alert
app.post("/api/sos", authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;

    // Save SOS to MongoDB
    const alert = await SOS.create({
      userId: req.user.id,
      message,
      latitude,
      longitude,
      timestamp: new Date(),
    });

    // Fetch user contacts
    const contacts = await Contact.find({ userId: req.user.id });
    if (!contacts.length) {
      return res.status(400).json({ error: "No emergency contacts found!" });
    }

    // Compose message
    // Build clean SOS message (no duplicates)
    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    const alertMsg = `🚨 SOS ALERT! 🚨I'm in danger and need urgent help.
    📍 Location: ${locationUrl}
    📝 Message: ${message || "Please contact me immediately."}`;


    // 🆕 Send message via Twilio WhatsApp
    for (const contact of contacts) {
      try {
        const sentMsg = await client.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:${contact.phone}`,
          body: alertMsg,
        });
        console.log(` SOS sent to ${contact.phone} | SID: ${sentMsg.sid}`);
      } catch (error) {
        console.error(` Failed to send to ${contact.phone}:`, error.message);
      }
    }

    res.json({ ok: true, alert });
  } catch (error) {
    console.error("SOS Error:", error.message);
    res.status(500).json({ error: "Server error sending SOS" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
