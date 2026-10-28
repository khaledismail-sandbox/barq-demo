# barq — Amplitude demo app

A static, mobile-style clone of **barq** (Barraq Finance Company's Saudi wallet and international
remittance app), built to showcase Amplitude Analytics, Session Replay, Guides & Surveys and Web
Experiment. Plain HTML/CSS/JS, one folder per screen, no build step, no backend.

- Live URL (after publishing): **https://khaledismail-sandbox.github.io/barq-demo/**
- Local preview: `cd ~/Desktop && python3 -m http.server 8000`, then open
  http://localhost:8000/barq-demo/

Optional event recorder for checking a run: in the browser console, type `BarqAmp.rec.on()`, walk
a journey, then `BarqAmp.rec.dump()`. `BarqAmp.sdkCheck()` lists which Amplitude SDKs loaded and
the Session Replay mask level set in Amplitude.

---

## 1. Demo script (click by click)

### A. Friction-free: verified returning sender

1. Open `/barq-demo/` → **Log in**.
2. Enter a name and demo number 1 → **Log in**. This fires `Logged In`.
3. On Home, tap the cashback wheel card → **Spin**. This fires `Cashback Wheel Spun`. Go back to
   Home.
4. Tap **Send**. Choose India (`SA_IN`), then the suggested beneficiary Ramesh Kumar.
5. On the Quote screen, review the rate and the 0 SAR fee → **Continue**.
6. On Send money → **Continue**. You go straight to **Review** (no KYC).
7. Tap **Confirm & send**. The success screen shows "Money sent successfully" and a Txn ID.

### B. Friction: new unverified user

1. Open `/barq-demo/` → **Create account**.
2. Enter a name, demo number 1 and a phone number → **Create account**. This fires
   `Account Created`.
3. On Home, tap **Send**. Choose Pakistan (`SA_PK`), then Ayesha Khan → Quote → **Continue** →
   Send money → **Continue**.
4. On Verify identity, the fields are prefilled and masked → **Next**.
5. On **Nafath approval**, tap **Verify with Nafath** 5–6 times quickly. Nothing responds. This
   fires `Nafath Verification Retried` and produces rage clicks.
6. Tap **Continue** 2–3 times. Nothing happens, producing dead clicks.
7. Scroll down, tick consent, then tap Continue again. It still goes nowhere.
8. Tap **Cancel transfer**. This fires `Transfer Abandoned` and returns you to Home.
9. In Amplitude: open the replay, show the rage-click and dead-click markers, and show the masked
   ID fields.

### C. The fix (show manually)

1. Open `/barq-demo/kyc-guided/` directly.
2. Walk the 4 balanced steps: progress bar, "N items to go", instant Verify feedback, and
   disabled buttons that explain why.

### Notes

- **Before recording, check the Session Replay mask level.** The code asks for `light`, but the
  Amplitude project setting overrides it and is currently **`medium`**. To keep labels readable in
  replays, change it in Amplitude → Session Replay settings → privacy / mask level to **Light**.
  National ID / Iqama, IBAN and card fields stay masked either way (`amp-mask`), and the selfie
  area is blocked (`amp-block`).
- `session_ended` fires on **every page exit**, not once per real session, because every screen
  is its own page. That is expected; the data treats it as a per-page-exit marker.
- Switching persona = log in or sign up as the other persona. That clears all `barq_*` state and
  calls `amplitude.reset()`. "Log out" lives in the **More** tab sheet.
- Referral codes that validate on Send money: `SAVEQX`, `BARQ10` (10 SAR), `FIRSTFREE` (15 SAR).
- `KYC Verified` is data-only: no live persona passes KYC, so nothing in the app fires it.

---

## 2. Publish through the GitHub WEBSITE (no terminal)

1. Go to **github.com** and sign in as **khaledismail-sandbox**.
2. Click **+** (top right) → **New repository**.
   - Name it **`barq-demo`** in lowercase, exactly.
   - Set it to **Public**.
   - Leave "Add a README" **unticked**.
   - Click **Create repository**.
3. On the empty repo page, click the **uploading an existing file** link.
4. In Finder, open `~/Desktop/barq-demo/`.
   - Press **Cmd + Shift + .** to show hidden files, so `.nojekyll` is visible.
   - Select **everything except `_reference/` and `_tools/`**.
   - **The GitHub website uploader ignores `.gitignore`**, so you must leave those two folders
     out yourself.
5. Drag the selection into the upload area. Folders keep their structure when dragged in
   Chrome or Safari.
   - Wait until every file is listed.
   - Write a commit message such as "barq demo".
   - Click **Commit changes**.
   - If more than 100 files are rejected, upload in two batches.
6. Confirm that `.nojekyll` is in the file list. If it is missing, click **Add file → Create new
   file**, name it `.nojekyll`, leave it empty, and click **Commit changes**.
7. Go to **Settings → Pages**. Under **Build and deployment**, set:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**

   Then click **Save**.
8. Wait 1–2 minutes and refresh the Pages settings. It will show **"Your site is live at
   https://khaledismail-sandbox.github.io/barq-demo/"**.
9. Open the live URL and check:
   - The page is **styled**. Unstyled HTML means an absolute path slipped through.
   - Walk both personas and confirm events arrive in Amplitude.
   - A session replay appears.
10. To change a file later: open it on github.com → click the **pencil (Edit)** → **Commit
    changes**. Or use **Add file → Upload files** with the same name to replace it.

---

## 3. Web Experiment

Optional. The flag key matching the generated data is **`nafath-verification-retried-reduction`**.
You can point the Amplitude visual editor at the live URL. GitHub Pages sets no COOP or CSP
headers, so the editor attaches with no configuration. No variant logic is wired in the app, and
`/kyc-guided/` is not connected to the experiment.
