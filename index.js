const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

const allowedZones = [
  "esikado", "esikado campus", "esikado junction", "campus", 
  "lecture hall", "botwe", "railway area", "umat esikado", 
  "hostel", "hall", "university hostel"
];

const incidentKeywords = [
  "robbery", "robbed", "theft", "stolen", "assault", "attacked",
  "stab", "stabbing", "rape", "chased", "followed", "harassed",
  "snatched", "kidnap", "injured", "hit", "threat"
];

app.post("/webhook", (req, res) => {
  const userTextRaw = req.body.queryResult.queryText || "";
  const userText = userTextRaw.toLowerCase().replace(/[^\w\s]/gi, " ");

  console.log("🔍 Input:", userText);

  // Match incident
  const incident = incidentKeywords.find(word => userText.includes(word));

  // Match location (allow partial matches)
  const location = allowedZones.find(zone => {
    const zoneWords = zone.toLowerCase().split(" ");
    return zoneWords.every(word => userText.includes(word));
  });

  // Match time
  const timeMatch = userText.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/i);

  console.log("📍 Incident:", incident);
  console.log("📍 Location:", location);
  console.log("📍 Time:", timeMatch?.[0]);

  if (!location) {
    return res.json({
      fulfillmentText: "Thanks for your report. However, the location seems outside our safety zone. Can you clarify where it happened?"
    });
  }

  const response = `Thank you. You reported a "${incident || "safety concern"}" at "${location}"${timeMatch ? ` around ${timeMatch[0]}` : ""}. We've recorded this.`;

  return res.json({ fulfillmentText: response });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("✅ SAFEBOT Webhook running on port", port);
});
