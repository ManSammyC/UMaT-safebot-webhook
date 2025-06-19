const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const allowedZones = [
  "esikado", "esikado campus", "esikado junction", "railway area", "botwe",
  "campus", "umat esikado", "lecture hall", "hall", "hostel", "nearby communities"
];

const incidentKeywords = [
  "robbery", "robbed", "theft", "stolen", "attack", "attacked", "assault",
  "rape", "stab", "stabbing", "threat", "kidnap", "kidnapping", "chased",
  "followed", "harassed", "molest", "snatched", "pursued", "injured", "hit"
];

function extractIncidentInfo(text) {
  const lowerText = text.toLowerCase();

  // Incident matching
  const incidentMatch = incidentKeywords.find(word => lowerText.includes(word));

  // Location matching
  const locationMatch = allowedZones.find(zone =>
    lowerText.includes(zone) || zone.includes(lowerText)
  );

  // Time matching
  const timeMatch = lowerText.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/);

  console.log("🧩 Matched Incident:", incidentMatch);
  console.log("🧭 Matched Location:", locationMatch);
  console.log("⏰ Matched Time:", timeMatch?.[0]);

  return {
    incident: incidentMatch || null,
    location: locationMatch || null,
    time: timeMatch?.[0] || null
  };
}

app.post("/webhook", (req, res) => {
  const userInput = req.body.queryResult.queryText;
  const info = extractIncidentInfo(userInput);

  if (!info.location) {
    return res.json({
      fulfillmentText: "Thank you for the report. Could you please clarify the location? We support incidents around the UMaT Esikado campus."
    });
  }

  const reply = `Thank you. You reported a "${info.incident || "safety issue"}" at "${info.location}"${info.time ? ` around ${info.time}` : ""}. We'll take note of it.`;

  return res.json({ fulfillmentText: reply });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("SAFEBOT Webhook running on port", port);
});


