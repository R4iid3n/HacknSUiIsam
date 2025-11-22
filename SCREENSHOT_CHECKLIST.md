# 📸 Screenshot & Visual Assets Checklist

**For Hackathon Submission Portal, Pitch Deck, and Judge Review**

This checklist ensures you capture all critical visuals before demo day. Screenshots make your submission **10x more convincing** to judges who review projects before live demos.

---

## 🎯 Priority 1: Must-Have Screenshots

These are **non-negotiable** for your submission:

### 1. ✅ Landing Page / Login Page
**File:** `screenshots/01-landing.png`

**What to show:**
- Dark hero section with "LémanFlow" branding
- Clear value proposition: "Gasless Rewards for Hackathon Missions"
- "Connect Wallet" or "Login with Google" buttons
- Clean, modern UI (dark theme)

**How to capture:**
1. Navigate to `http://localhost:5173/login`
2. Make sure wallet is disconnected (logout first)
3. Full-page screenshot (Cmd+Shift+3 on Mac, Win+Shift+S on Windows)
4. Save as `01-landing.png`

---

### 2. ✅ Dashboard - Missions View
**File:** `screenshots/02-dashboard.png`

**What to show:**
- List of available missions with rewards
- Mission cards showing:
  - Title (e.g., "Workshop Attendance")
  - Description
  - Reward amount (e.g., "0.5 SUI")
  - "Scan QR" or "Claim" button
- User's passport summary (attestation count, total rewards)
- Navigation bar at top

**How to capture:**
1. Login and navigate to `/dashboard`
2. Make sure at least 2-3 missions are visible
3. Full-page screenshot
4. Save as `02-dashboard.png`

---

### 3. ✅ QR Scanner Page (Active)
**File:** `screenshots/03-qr-scanner.png`

**What to show:**
- Camera preview window (or placeholder)
- "Scan QR Code to Claim Mission" instruction text
- QR code scanner UI
- Optional: "Simulate Claim (Demo)" button visible

**How to capture:**
1. Navigate to `/scan`
2. Click "Start Scanning" to activate camera
3. Screenshot before scanning (show active camera view)
4. Save as `03-qr-scanner.png`

**Alternative:** If camera doesn't work, show the QR simulation UI

---

### 4. ✅ Successful Claim Result
**File:** `screenshots/04-claim-success.png`

**What to show:**
- Success message: "Mission claimed successfully!"
- Reward amount displayed
- Transaction digest / confirmation
- Green checkmark or success icon
- Option to view on explorer or go to passport

**How to capture:**
1. Complete a mission claim (real or simulated)
2. Capture the success modal/alert immediately
3. Save as `04-claim-success.png`

---

### 5. ✅ Passport Page - Attestations Grid
**File:** `screenshots/05-passport.png`

**What to show:**
- User's soulbound Passport with stats:
  - Total rewards earned
  - Missions completed count
  - Member since date
- Grid of attestation cards (NFT-style)
- Each card showing:
  - Mission title
  - Completion date
  - Reward amount
  - Transaction link (optional)

**How to capture:**
1. Navigate to `/passport`
2. Make sure you have at least 2-3 completed attestations
3. Full-page screenshot showing stats + attestation grid
4. Save as `05-passport.png`

---

### 6. ✅ Admin Panel - Event Creation
**File:** `screenshots/06-admin-create-event.png`

**What to show:**
- Event creation form with fields:
  - Event name
  - Description
  - Initial funding (SUI)
  - Start/end dates (if shown)
- "Create Event" button
- Clean form UI (shadcn components)

**How to capture:**
1. Navigate to `/admin`
2. Fill out event form (don't submit yet)
3. Screenshot showing filled form
4. Save as `06-admin-create-event.png`

---

### 7. ✅ Admin Panel - Mission Creation
**File:** `screenshots/07-admin-create-mission.png`

**What to show:**
- Mission creation form:
  - Event ID dropdown/input
  - Mission title
  - Description
  - Reward amount
- "Add Mission" button

**How to capture:**
1. Scroll to mission creation section on `/admin`
2. Fill out mission form (don't submit)
3. Screenshot
4. Save as `07-admin-create-mission.png`

---

### 8. ✅ Sui Explorer Transaction
**File:** `screenshots/08-explorer-proof.png`

**What to show:**
- SuiScan/Sui Explorer page for a successful claim transaction
- Transaction details showing:
  - Sponsored transaction (gas paid by sponsor)
  - Passport object modified
  - Event object modified
  - Timestamp, status: "Success"

**How to capture:**
1. Complete a mission claim
2. Copy transaction digest
3. Open `https://suiscan.xyz/testnet/tx/[digest]`
4. Full-page screenshot
5. Save as `08-explorer-proof.png`

---

## 🎨 Priority 2: Nice-to-Have Screenshots

These improve your submission but aren't critical:

### 9. ✅ Demo Helper Page
**File:** `screenshots/09-demo-helper.png`

**What to show:**
- Pre-demo checklist with status indicators
- Green checkmarks for passing checks
- Quick links section
- Demo tips card

**How to capture:**
1. Navigate to `/demo-helper`
2. Wait for all checks to complete
3. Screenshot
4. Save as `09-demo-helper.png`

---

### 10. ✅ Mobile Responsive View
**File:** `screenshots/10-mobile.png`

**What to show:**
- Dashboard or scan page on mobile viewport
- Shows responsive design

**How to capture:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M)
3. Select iPhone 12 Pro or similar
4. Navigate to `/dashboard` or `/scan`
5. Screenshot
6. Save as `10-mobile.png`

---

### 11. ✅ QR Code Example
**File:** `screenshots/11-qr-code.png`

**What to show:**
- Generated QR code for a mission
- Mission details above/below QR
- Optional: QR code in printable format

**How to capture:**
1. Navigate to `/admin`
2. Create a mission and generate QR code
3. Screenshot the QR code modal/page
4. Save as `11-qr-code.png`

---

### 12. ✅ Architecture Diagram
**File:** `screenshots/12-architecture.png`

**What to show:**
- Visual diagram of system flow:
  - User → Backend → Sui Blockchain
  - Arrows showing gasless transaction flow
  - Components labeled (zkLogin, Sponsor, Move Contracts)

**How to create:**
1. Use Excalidraw, Figma, or draw.io
2. Create simple flowchart showing:
   - Login (zkLogin)
   - Claim Mission (Backend builds TX)
   - Sponsor signs TX
   - Blockchain executes
   - User receives reward
3. Export as PNG
4. Save as `12-architecture.png`

**Alternative:** Screenshot the ASCII diagram from README.md

---

## 📹 Priority 3: Video Demo (Mandatory)

Most hackathons require a video demo (2-5 minutes).

### Video Content Checklist:

- [ ] **Intro (10 sec):** Team name, project name, tagline
- [ ] **Problem statement (15 sec):** Why hackathon rewards are broken
- [ ] **Solution overview (15 sec):** Gasless rewards on Sui
- [ ] **Live demo (90 sec):**
  - [ ] Login with Google/wallet
  - [ ] Show dashboard
  - [ ] Scan QR code (or simulate)
  - [ ] Show successful claim
  - [ ] Navigate to passport page
  - [ ] Show attestation
- [ ] **Tech highlights (30 sec):** zkLogin, sponsored txns, Dynamic Fields
- [ ] **Roadmap (10 sec):** Next steps
- [ ] **Closing (10 sec):** Thank judges, show GitHub link

**Total:** ~3 minutes

### Video Recording Tips:

- Use **Loom** or **OBS Studio** for screen recording
- Enable **Do Not Disturb** mode
- Close unnecessary tabs
- Use **full-screen mode** for demo (hide dev tools)
- Add **cursor highlights** (Loom has this built-in)
- Add **background music** (low volume, copyright-free)
- Export in **1080p MP4** format

---

## 🎨 Visual Polish Tips

### Before Taking Screenshots:

1. **Clear browser cache** (fresh load)
2. **Zoom to 100%** (Cmd+0 / Ctrl+0)
3. **Hide dev tools** (F12 to close)
4. **Use dark theme** (matches your design)
5. **Disable browser extensions** (avoid clutter in UI)
6. **Use Incognito/Private mode** (clean browser chrome)
7. **Check spelling** (typos in screenshots look bad)

### After Capturing:

1. **Crop to remove OS taskbar/menu** (focus on app)
2. **Add subtle drop shadow** (makes images pop)
3. **Annotate key features** (arrows, highlights) using:
   - Skitch
   - Snagit
   - Markup (macOS)
4. **Compress images** (use TinyPNG or ImageOptim)
5. **Keep aspect ratio consistent** (all 16:9 or 4:3)

---

## 📂 File Organization

Create this folder structure:

```
screenshots/
├── 01-landing.png
├── 02-dashboard.png
├── 03-qr-scanner.png
├── 04-claim-success.png
├── 05-passport.png
├── 06-admin-create-event.png
├── 07-admin-create-mission.png
├── 08-explorer-proof.png
├── 09-demo-helper.png          (optional)
├── 10-mobile.png               (optional)
├── 11-qr-code.png              (optional)
├── 12-architecture.png         (optional)
└── demo-video.mp4              (required)
```

---

## 🚀 Submission Portal Upload Order

When uploading to Devpost/DoraHacks:

1. **Main screenshot:** `02-dashboard.png` (shows core value)
2. **Additional images (order):**
   - `01-landing.png`
   - `05-passport.png`
   - `04-claim-success.png`
   - `08-explorer-proof.png`
   - `06-admin-create-event.png`
   - `12-architecture.png`
3. **Video:** `demo-video.mp4` (upload to YouTube, embed link)

---

## ✅ Final Pre-Submission Checklist

- [ ] All Priority 1 screenshots captured (8 images)
- [ ] Screenshots are high-resolution (1920x1080 or higher)
- [ ] No typos or broken UI visible in screenshots
- [ ] All images compressed (<500KB each)
- [ ] Architecture diagram created
- [ ] Video demo recorded and uploaded
- [ ] All screenshots organized in `/screenshots` folder
- [ ] Added screenshots to README.md (optional)
- [ ] Verified all links work (GitHub, video, demo site)

---

## 🎬 Pro Tips for Winning Visuals

### Make Your Screenshots Tell a Story:
Order matters. Judges should be able to understand your project just from screenshots:
1. **Landing** (what is this?)
2. **Dashboard** (how does it work?)
3. **Scanner** (how do users interact?)
4. **Success** (proof it works!)
5. **Passport** (what's the value?)
6. **Admin** (who's it for?)
7. **Explorer** (on-chain proof!)

### Visual Consistency:
- Use same browser size for all screenshots
- Keep dark theme consistent
- Show same user journey across images
- Use similar zoom level (100%)

### Highlight Innovation:
- Circle or arrow-point Sui-specific features
- Add text overlays: "zkLogin - No Wallet Needed!" "Gasless!"
- Show transaction speed (timestamps)
- Compare before/after (traditional vs LémanFlow)

---

**Remember:** Judges review 50+ projects. Your screenshots are often their **first impression**. Make them count!

🎯 **Goal:** Judges should think "I need to see this demo live" after seeing your screenshots.
