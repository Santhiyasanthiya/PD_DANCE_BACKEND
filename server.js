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
  subject: "✅ Registration Successful - Pd Dance Academy",
  html: `
    <div style="
      font-family: 'Poppins', 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #fff8f8, #ffe6f0);
      border: 2px solid #0e5200ff;
      border-radius: 12px;
      padding: 25px;
      color: #333;
      max-width: 600px;
      margin: 20px auto;
      box-shadow: 0 4px 10px rgba(130, 255, 92, 0.3);
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 15px;">
        <img 
          src="https://res.cloudinary.com/dk50cmtps/image/upload/v1758199428/pd-logo-design_853558-129-removebg-preview_sdmpyy.png" 
          alt="Pd Dance Academy Logo"
          style="width: 120px; height: auto; margin-bottom: 10px;"
        />
        <h1 style="color: #074e01ff; margin: 0;">Pd Dance Academy</h1>
        <p style="color: #555; font-size: 14px;">Feel the rhythm. Express your soul.</p>
      </div>

      <!-- Body -->
      <div style="background: #fff; border-radius: 10px; padding: 20px;">
        <h2 style="color: #116101ff;">Hello ${studentName},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Thank you for contacting <b>Pd Dance Academy</b>! 💃  
          We’ve received your details and our team will get in touch with you soon.
        </p>

      

        <p style="font-size: 15px; color: #444;">
          🎉 Stay tuned for updates about our latest dance programs and events!
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 25px; font-size: 13px; color: #777;">
        <hr style="border: none; border-top: 1px solid #013d04ff; margin: 15px 0;">
        <p>
          © 2020 Pd Dance Academy<br/>
          Chennai, India | <a href="mailto:pddanceacademy@gmail.com" style="color: #1b5500ff; text-decoration: none;">pddanceacademy@gmail.com</a>
        </p>
      </div>
    </div>
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
