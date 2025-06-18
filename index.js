const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

const allowedZones = ["esikado", "esikado campus", "esikado junction", "railway area", "bu", "campus", "umat esikado", "lecture hall", "hall", "hostel", "nearby communities"];

function extractIncidentInfo(text) {
  const locationMatch = allowedZones.find(zone => text.toLowerCase().includes(zone));
  const timeMatch = text.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/i);
  const incidentMatch = text.match(/(robbery|theft|assault|attack|rape|stab|threat|kidnap|chased|followed|harassed)/i);

  return {
    incident: incidentMatch?.[0] || null,
    location: locationMatch || null,
    time: timeMatch?.[0] || null
  };
}

app.post("/webhook", (req, res) => {
  const userInput = req.body.queryResult.queryText;
  const info = extractIncidentInfo(userInput);

  if (!info.location) {
    return res.json({
      fulfillmentText: "Thanks for reporting. However, this location seems outside our safety coverage. Please clarify the area."
    });
  }

  const reply = `Thank you. You reported a "${info.incident || "safety concern"}" at "${info.location}"${info.time ? ` around ${info.time}` : ""}. We’ll look into it.`;

  return res.json({
    fulfillmentText: reply
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("SAFEBOT Webhook running on port", port);
});
