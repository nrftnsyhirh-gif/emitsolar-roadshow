<<<<<<< HEAD
# Roadshow Backend — Beginner's Setup Guide

A complete reference for setting up, running, and deploying the secure
Node.js backend that keeps your Airtable token hidden from visitors.

**Bookmark this file** — it covers everything from zero to a working
local server, plus every mistake we hit along the way and how to fix it.

---

## Part 0 — What We're Building (the big picture)

```
Before:  Browser → Airtable directly (token visible to anyone who inspects the page)
After:   Browser → Your own server → Airtable (token hidden, only your server sees it)
```

Your `server.js` is a small program that sits in the middle. It:
1. Receives the form data from your website
2. Adds your secret Airtable token (which only IT knows, stored in `.env`)
3. Forwards the request to Airtable
4. Sends the result back to your website

The browser **never sees the token** — only your server does.

---

## Part 1 — Install Node.js (one-time setup)

Node.js is the program that lets your computer run `server.js`.

1. Go to **[nodejs.org](https://nodejs.org)**
2. Download the **LTS version**, **Windows Installer (.msi)** — not the ZIP
3. Right-click the downloaded file → **"Run as administrator"**
4. Enter your IT-provided admin password when prompted
5. Click through with default options (keep "Add to PATH" checked)
6. Finish installation
7. **Close VS Code completely and reopen it** (important — this lets it see the update)

### Verify it worked

Open a terminal in VS Code (`` Ctrl+` ``) and run:
```powershell
node -v
npm -v
```
Both should print version numbers (e.g. `v20.18.0` and `10.2.4`). If they do, you're done with Part 1 forever — no need to repeat this.

---

## Part 2 — If you hit a PowerShell "scripts disabled" error

If `npm -v` shows a red error mentioning **"running scripts is disabled on this system"**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Type `Y` and press Enter when asked. Then try `npm -v` again.

If that command itself gets blocked by IT policy, switch to **Command Prompt** instead of PowerShell:
1. Click the dropdown arrow next to `+` in VS Code's terminal panel
2. Select **"Command Prompt"**
3. Try `node -v` / `npm -v` there instead — cmd doesn't have this restriction

---

## Part 3 — Set Up the Project Folder

1. Create a folder, e.g. `D:\Project`
2. Save these 8 files directly inside it (not in any subfolder):
   - `server.js`
   - `package.json`
   - `.env.example`
   - `.gitignore`
   - `.dockerignore`
   - `Dockerfile`
   - `index.html` (your form — originally named `roadshow-request-gcp.html`)
   - `README.md`
3. In VS Code: **File → Open Folder** → select `D:\Project`

### Confirm the files are there
```powershell
cd D:\Project
dir
```
You should see all 8 files listed.

---

## Part 4 — Install Dependencies & Configure Secrets

### 1. Install the packages your server needs
```powershell
npm install
```
This reads `package.json` and downloads Express, dotenv, and cors into a new `node_modules` folder. This can take a minute — that's normal.

### 2. Create your real `.env` file
```powershell
copy .env.example .env
```
Open `.env` in VS Code and fill in your **real** values:
```
AIRTABLE_TOKEN=pat_your_real_token_here
AIRTABLE_BASE_ID=app_your_real_base_id_here
AIRTABLE_TABLE_NAME=Roadshow Requests
PORT=8080
```
Save the file.

⚠️ `.env` is already excluded via `.gitignore` — it will never be accidentally shared or committed to Git.

---

## Part 5 — Run the Server Locally

```powershell
npm start
```
You should see:
```
Server listening on port 8080
```
**Leave this terminal open** — closing it stops the server. If you need to run other commands, open a **second** terminal (the `+` icon in the terminal panel) rather than closing this one.

### Confirm it's alive
Open a browser and go to:
```
http://localhost:8080
```
You should see: **"Roadshow submit proxy is running."**

---

## Part 6 — Test the Backend Directly (Thunder Client)

Before testing with the real form, confirm the server can actually reach Airtable.

1. Install the **Thunder Client** extension in VS Code (Extensions icon → search "Thunder Client" → Install)
2. Click the Thunder Client icon (lightning bolt, left sidebar)
3. **New Request** → Method: `POST` → URL: `http://localhost:8080/api/submit-request`
4. **Body** tab → **JSON** → paste:
   ```json
   {
     "fields": {
       "Request ID": "TEST-001",
       "Company Name": "Test Company",
       "Status": "Pending"
     }
   }
   ```
5. Click **Send**

**Success looks like:** a `200` response in Thunder Client, AND a new row appearing in your actual Airtable base.

---

## Part 7 — Test With the Real Form

1. Open `index.html` in VS Code
2. Confirm this line points to your local server:
   ```javascript
   const SUBMIT_PROXY_URL = 'http://localhost:8080/api/submit-request';
   ```
3. Right-click `index.html` → **Open with Live Server**
4. Fill out the form and click **Submit request**
5. Check your terminal (no red errors) and check Airtable for the new row

---

## Part 8 — Troubleshooting Log (mistakes we already hit, and their fixes)

### "npm is not recognized" / "node is not recognized"
Node.js isn't installed, or wasn't added to PATH correctly. Redo **Part 1**, using the `.msi` installer (not the portable ZIP — it's less reliable).

### "cd node.exe" gives "Cannot find path"
`cd` is for folders, not program files. You don't `cd` into `node.exe` — you either run it directly (`.\node.exe -v`) or add its folder to PATH.

### "npm ERR! ... no such file or directory, open 'package.json'"
You're in the wrong folder. `package.json` lives in `D:\Project`, not inside any Node.js installation folder. Run `cd D:\Project` first, then `dir` to confirm you see your project files before running `npm install`.

### "Could not determine Node.js install directory"
The portable ZIP version was extracted incompletely. Delete that folder and reinstall using the proper `.msi` installer instead (Part 1) — much more reliable.

### "Running scripts is disabled on this system"
See **Part 2** above — run `Set-ExecutionPolicy` or switch to Command Prompt.

### "Failed to fetch" in the browser when submitting the form
This is a generic error — the real cause shows in the browser Console (F12):
- **If it says "CORS policy" blocked** — make sure your server is running (`npm start` still active) and that `cors()` is enabled in `server.js` (it already is by default)
- **If it says "ERR_CONNECTION_REFUSED"** — your local server (`npm start`) isn't actually running. Check your terminal.
- **Always double-check** `SUBMIT_PROXY_URL` in your HTML file is set to the correct URL (`http://localhost:8080/api/submit-request` for local testing, or your real Cloud Run URL once deployed) — not still the placeholder text.

### Renamed the file to `index.html` and something broke
Renaming itself doesn't break anything — but after renaming:
1. **Stop** Live Server (bottom-right "Port: 5500" button → Stop Server)
2. **Restart** it (right-click `index.html` → Open with Live Server) — a stale session can cause confusing errors otherwise

---

## Part 9 — Deploying to Google Cloud Run (going live)

Once local testing works end-to-end, it's time to make it publicly accessible.

### 1. Install Google Cloud CLI
Download from **[cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)** and run the installer (admin password may be needed again).

### 2. Log in
```powershell
gcloud auth login
```
This opens a browser — log in with your Google account.

### 3. Create/select a project
```powershell
gcloud projects create roadshow-backend-proj --name="Roadshow Backend"
gcloud config set project roadshow-backend-proj
```

### 4. Enable required services
```powershell
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 5. Deploy
From inside `D:\Project`:
```powershell
gcloud run deploy roadshow-submit-proxy `
  --source . `
  --region asia-southeast1 `
  --allow-unauthenticated
```
*(In PowerShell, use the backtick `` ` `` for line continuation, as shown above.)*

### 6. Set your real secrets on Cloud Run
```powershell
gcloud run services update roadshow-submit-proxy `
  --region asia-southeast1 `
  --set-env-vars AIRTABLE_TOKEN=pat_your_real_token_here,AIRTABLE_BASE_ID=app_your_real_base_id_here,AIRTABLE_TABLE_NAME="Roadshow Requests"
```

### 7. Get your live URL
```powershell
gcloud run services describe roadshow-submit-proxy --region asia-southeast1 --format "value(status.url)"
```

### 8. Update your form with the real URL
In `index.html`:
```javascript
const SUBMIT_PROXY_URL = 'https://your-real-cloud-run-url.a.run.app/api/submit-request';
```

### 9. Upload the final `index.html` (+ your logo file) to Netlify as usual

---

## Quick Glossary

| Term | Meaning |
|---|---|
| **Terminal** | A text-based way to type commands to your computer |
| **npm** | The tool that installs and manages Node.js packages |
| **`node_modules`** | A folder npm creates, full of downloaded code your project needs |
| **`.env`** | A file holding secret values, never shared publicly |
| **PATH** | A list of folders Windows checks when you type a command name |
| **CORS** | A browser security rule about which websites can talk to which servers |
| **Cloud Run** | Google's service for running small servers like this one, live on the internet |
| **Live Server** | A VS Code extension that runs your HTML file with auto-refresh |
| **localhost** | Your own computer, when acting as a server (only reachable by you) |

---

## Your Checklist So Far

- [x] Node.js installed and verified (`node -v` / `npm -v` work)
- [x] Project files saved in `D:\Project`
- [x] `npm install` completed successfully
- [x] `.env` created with real Airtable values
- [x] `npm start` shows "Server listening on port 8080"
- [x] `http://localhost:8080` shows "Roadshow submit proxy is running"
- [ ] Thunder Client test returns 200 + new Airtable row
- [ ] Form submission via Live Server works end-to-end
- [ ] Deployed to Google Cloud Run
- [ ] Final `index.html` uploaded to Netlify with the live Cloud Run URL
=======
# emitsolar-roadshow
Request Approval System 
>>>>>>> 7ed8e966a7cf1c121333157ac2b417b1e104e1d2
