app.post("/webhook", (req, res) => {
  const userText = req.body.queryResult.queryText.toLowerCase();

  console.log("🔍 Received user input:", userText);

  const incident = incidentKeywords.find(word => userText.includes(word));
  const location = allowedZones.find(zone => userText.includes(zone));
  const timeMatch = userText.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/);

  console.log("📍 Matched incident:", incident);
  console.log("📍 Matched location:", location);
  console.log("📍 Matched time:", timeMatch?.[0]);

  if (!location) {
    console.log("⚠️ Location not in allowed zones.");
    return res.json({
      fulfillmentText: "Thanks for reporting. However, this location seems outside our safety coverage zone. Could you please clarify where it happened?"
    });
  }

  const response = `Thank you. You reported a "${incident || "safety concern"}" at "${location}"${timeMatch ? ` around ${timeMatch[0]}` : ""}. We've noted this.`;

  console.log("✅ Final response:", response);

  return res.json({
    fulfillmentText: response
  });
});

