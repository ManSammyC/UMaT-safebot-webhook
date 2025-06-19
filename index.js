require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `
You are a smart and friendly assistant called SAFEBOT, built for students and residents around UMaT Esikado campus to report crimes and safety concerns.

When a user gives you any message, do the following:

1. Extract:
- "incident": what happened
- "location": where it happened
- "time": when it happened

2. Return JSON like:
{ "incident": "...", "location": "...", "time": "..." }

3. Then respond with a short, friendly message confirming the report.

4. If outside Esikado, say:
“Thanks! Just a heads up — SAFEBOT is currently focused on UMaT Esikado and nearby areas.”

5. If irrelevant:
{ "incident": null, "location": null, "time": null }
And say: “I’m here to help with crime or safety-related reports. Could you rephrase?”

Be concise, helpful, and return both the JSON and user message.
`;

app.post('/webhook', async (req, res) => {
  const userInput = req.body.queryResult?.queryText || 'No input';

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'groq/mixtral-8x7b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userInput }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.REFERER_URL,
          'X-Title': 'SAFEBOT-UMaT'
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    res.json({
      fulfillmentText: reply
    });
  } catch (error) {
    console.error('OpenRouter Error:', error.response?.data || error.message);
    res.json({
      fulfillmentText: "Sorry, I had trouble processing your report. Please try again shortly."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SAFEBOT webhook running on port ${PORT}`));
