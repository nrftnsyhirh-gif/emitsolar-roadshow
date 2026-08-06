// server.js
// -----------------------------------------------------------------
// A small Express server that sits between your public form and
// Airtable. It reads secrets from environment variables (loaded
// from a local .env file during development, or set directly as
// environment variables when deployed to Google Cloud Run).
//
// The Airtable token NEVER goes to the browser — only this server
// process ever sees it.
// -----------------------------------------------------------------

require('dotenv').config(); // loads variables from .env into process.env (local dev only)

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());               // allow your frontend domain to call this API
app.use(express.json());       // parse JSON request bodies

const PORT = process.env.PORT || 8080; // Cloud Run injects PORT automatically

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Roadshow Requests';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.warn('WARNING: AIRTABLE_TOKEN or AIRTABLE_BASE_ID is not set. Check your .env file.');
}

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('WARNING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set. Telegram notifications will be skipped.');
}

// Fire-and-forget notification — never blocks or fails the caller's request.
async function notifyTelegram(fields) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text =
    `New Roadshow Request\n` +
    `ID: ${fields['Request ID']}\n` +
    `Company: ${fields['Company Name']}\n` +
    `Email: ${fields['Contact Email']}\n` +
    `Dates: ${fields['Start Date']} to ${fields['End Date']}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
  } catch (err) {
    console.warn('Telegram notification failed:', err.message);
  }
}

// Simple health check — useful to confirm the server is alive
app.get('/', (req, res) => {
  res.send('Roadshow submit proxy is running.');
});

// The endpoint your frontend form will call
app.post('/api/submit-request', async (req, res) => {
  try {
    const payload = req.body; // expects { fields: { ... } } already shaped for Airtable

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({ error: data });
    }

    notifyTelegram(payload.fields);
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
