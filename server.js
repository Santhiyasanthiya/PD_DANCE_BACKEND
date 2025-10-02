import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 4000;
const URL = process.env.DB;

// ✅ DB connect function
let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(URL);
    await client.connect();
    console.log("✅ MongoDB connected");
  }
  return client.db("PdDance");
}

app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

// ✅ Mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

// ------------------------ ROUTES ------------------------

// Server test
app.get("/", (req, res) => {
  res.send("🎉 Pd Dance Server Running...");
});

// ✅ Contact Form Register Route
app.post("/register", async (req, res) => {
  try {
    const { studentName, email, phone, location, purpose, subject } = req.body;

    if (!studentName || !email || !phone || !location || !purpose || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await getDb();
    const collection = db.collection("register");

    // Insert into MongoDB
    await collection.insertOne({
      studentName,
      email,
      phone,
      location,
      purpose,
      subject,
      createdAt: new Date(),
    });

    // ✅ Mail to Client
    const clientMail = {
      from: process.env.EMAIL,
      to: email,
      subject: "✅ Registration Successful - Pd Dance",
      html: `
        <h2>Hello ${studentName},</h2>
        <p>Thank you for contacting <b>Pd Dance Academy</b>. 
        We have received your details and will reach out soon.</p>
        <p><b>Submitted Details:</b></p>
        <ul>
          <li>Name: ${studentName}</li>
          <li>Email: ${email}</li>
          <li>Phone: ${phone}</li>
          <li>Location: ${location}</li>
          <li>Purpose: ${purpose}</li>
          <li>Subject: ${subject}</li>
        </ul>
        <p>🎉 Stay tuned for our updates!</p>
      `,
    };

    await transporter.sendMail(clientMail);

    // ✅ Mail to Admin
    const adminMail = {
      from: process.env.EMAIL,
      to: process.env.EMAIL, // Admin mail = same as env EMAIL
      subject: "📩 New Registration - Pd Dance",
      html: `
        <h2>New Registration Received</h2>
        <p><b>Student Details:</b></p>
        <ul>
          <li>Name: ${studentName}</li>
          <li>Email: ${email}</li>
          <li>Phone: ${phone}</li>
          <li>Location: ${location}</li>
          <li>Purpose: ${purpose}</li>
          <li>Subject: ${subject}</li>
        </ul>
        <p>🕒 Received at: ${new Date().toLocaleString()}</p>
      `,
    };

    await transporter.sendMail(adminMail);

    res.json({ message: "Registration successful & emails sent ✅" });
  } catch (error) {
    console.error("❌ Error in /register:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Listening on port", PORT);
});
