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

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  console.warn('WARNING: AIRTABLE_TOKEN or AIRTABLE_BASE_ID is not set. Check your .env file.');
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

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
