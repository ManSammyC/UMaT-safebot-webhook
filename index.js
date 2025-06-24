const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const app = express();

app.use(bodyParser.json());

// 🔐 Load Firebase credentials from env variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Zones we accept
const allowedZones = [
  "esikado", "esikado campus", "esikado junction", "campus", 
  "lecture hall", "botwe", "railway area", "umat esikado", 
  "hostel", "hall", "university hostel"
];

// Keywords to detect incident
const incidentKeywords = [
  "robbery", "robbed", "theft", "stolen", "assault", "attacked",
  "stab", "stabbing", "rape", "chased", "followed", "harassed",
  "snatched", "kidnap", "injured", "hit", "threat"
];

app.post("/webhook", async (req, res) => {
  const userTextRaw = req.body.queryResult.queryText || "";
  const userText = userTextRaw.toLowerCase().replace(/[^\w\s]/gi, " ");

  const incident = incidentKeywords.find(word => userText.includes(word));
  const location = allowedZones.find(zone => {
    const zoneWords = zone.toLowerCase().split(" ");
    return zoneWords.every(word => userText.includes(word));
  });
  const timeMatch = userText.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/i);

  if (!location) {
    return res.json({
      fulfillmentText: "Thanks for your report. However, the location seems outside our safety zone. Can you clarify where it happened?"
    });
  }

  const report = {
    incident: incident || "unknown",
    location,
    time: timeMatch ? timeMatch[0] : "unspecified",
    fullText: userTextRaw,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("reports").add(report);
    const reply = `Thank you. You reported a "${report.incident}" at "${report.location}"${timeMatch ? ` around ${report.time}` : ""}. We've recorded this.`;
    return res.json({ fulfillmentText: reply });
  } catch (error) {
    console.error("🔥 Error saving report:", error);
    return res.json({
      fulfillmentText: "Sorry, we couldn't save your report. Please try again later."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ SAFEBOT webhook running with Firestore integration.");
});
