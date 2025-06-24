const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// 🔐 FIREBASE
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 🔐 OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Allowed campus zones
const allowedZones = [
  "esikado", "esikado junction", "esikado campus", "lecture hall",
  "bu", "railway area", "hostel", "hall", "umat esikado", "university hostel"
];

// 🔍 Use GPT to extract report info
async function extractIncidentInfo(userText) {
  const systemPrompt = `
You are a campus safety assistant for the University of Mines and Technology, Esikado campus. 
Given a student’s message, extract:
1. Incident type
2. Location (only if it's on/around Esikado campus)
3. Time (if mentioned)

Reply ONLY in this JSON format:
{
  "incident": "...",
  "location": "...",
  "time": "..."
}
`;

 const response = await openai.chat.completions.create({
  model: "gpt-4o", // ← GPT-4.1 capabilities
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText }
  ]
});


  try {
    const cleanText = response.choices[0].message.content.trim();
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}") + 1;
    const jsonString = cleanText.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("❌ GPT response error:", err);
    return { incident: null, location: null, time: null };
  }
}

app.post("/webhook", async (req, res) => {
  const userText = req.body.queryResult.queryText || "";

  try {
    const info = await extractIncidentInfo(userText);

    const locationValid = allowedZones.some(zone =>
      (info.location || "").toLowerCase().includes(zone)
    );

    if (!locationValid) {
      return res.json({
        fulfillmentText: "Thanks. Could you please clarify the location? It seems outside the Esikado campus zone."
      });
    }

    const report = {
      incident: info.incident || "unspecified",
      location: info.location || "unspecified",
      time: info.time || "unspecified",
      fullText: userText,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("reports").add(report);

    return res.json({
      fulfillmentText: `Thank you. You reported a "${report.incident}" at "${report.location}"${report.time !== "unspecified" ? ` around ${report.time}` : ""}. We've recorded this.`
    });
  } catch (err) {
    console.error("🔥 Webhook error:", err);
    return res.json({
      fulfillmentText: "Sorry, I couldn’t process your report. Please try again."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ SAFEBOT with GPT is live on port", port);
});
