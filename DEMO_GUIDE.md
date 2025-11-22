# 🎬 LémanFlow - Hackathon Demo Guide

## MODULE 8 - Fail-Proof Demo Flow

This guide ensures a smooth, impressive demo for hackathon judges in **60-90 seconds**.

---

## 📋 Pre-Demo Checklist (30 minutes before)

### 1. Backend Status
```bash
cd backend
npm run dev
# ✓ Backend running on http://localhost:4000
# ✓ Health check: curl http://localhost:4000/health
```

**Verify:**
- [ ] Backend responds to `GET /health`
- [ ] Mock mode status clear (`production` or `mock`)
- [ ] Sponsor balance sufficient (if production mode)
- [ ] No TypeScript/runtime errors in console

### 2. Frontend Status
```bash
cd frontend
npm run dev
# ✓ Frontend running on http://localhost:5173
```

**Verify:**
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] No console errors in browser DevTools

### 3. Sui Network Connectivity
```bash
# Check network
curl https://fullnode.devnet.sui.io:443 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"sui_getLatestSuiSystemState","params":[]}'
```

**Verify:**
- [ ] Network responds (devnet/testnet/mainnet)
- [ ] Package deployed and verified
- [ ] Explorer accessible: https://suiscan.xyz/devnet/home

### 4. Demo Data Prepared

**Create Event:**
```bash
# Use Admin panel or API
POST /api/admin/init
{
  "name": "SUI Hackathon 2025 - DEMO",
  "description": "Gasless rewards demonstration",
  "initialFunding": 10000000000  // 10 SUI
}
# → Save eventId and adminCapId
```

**Create 2-3 Missions:**
```bash
POST /api/admin/missions
{
  "eventId": "0x...",
  "adminCapId": "0x...",
  "title": "Check-in Mission",
  "description": "Scan QR at entrance",
  "rewardAmount": 100000000  // 0.1 SUI
}
# Repeat for "Workshop Attendance" and "Project Submission"
```

**Verify:**
- [ ] Event created successfully
- [ ] 2-3 missions visible in Dashboard
- [ ] Grant pool funded
- [ ] QR codes generated for each mission

### 5. Test Users Ready

**Pre-register 1-2 test users:**
```bash
# Option 1: Register via frontend
# Connect wallet → Click "Register Passport"

# Option 2: API call
POST /api/passport/register
# (with valid session)
```

**Verify:**
- [ ] Test user 1: Passport registered, 0 attestations
- [ ] Test user 2: Passport registered, 1-2 attestations (for comparison)

### 6. QR Codes Available

**Generate and prepare QR codes:**
```bash
# For each mission:
GET /api/missions/:missionId/qr?eventId=:eventId
# → Download QR code image
```

**Options:**
- [ ] Print QR codes on paper (recommended)
- [ ] Display on second monitor/phone
- [ ] Save QR images in folder for quick access

---

## 🎬 Live Demo Script (60-90 seconds)

### Opening (10 seconds)
**Say:**
> "LémanFlow is a gasless reward distribution platform built on SUI. Let me show you how attendees earn rewards at hackathons without paying any gas fees."

**Show:** Login page (`http://localhost:5173/login`)

---

### Step 1: Login (15 seconds)
**Say:**
> "We start with a simple login using zkLogin — no wallet setup needed. I'll connect my SUI wallet."

**Do:**
1. Click **Connect Wallet** button
2. Select Sui Wallet (or demo with mock)
3. Approve connection

**Result:** Auto-redirect to Dashboard

**Fallback:** If wallet fails, say *"In production, this would use Google OAuth via zkLogin"* and manually navigate to `/dashboard`

---

### Step 2: Show Dashboard & Passport (15 seconds)
**Say:**
> "This is my soulbound Passport on SUI — it stores all my mission completions as NFT-like attestations. I currently have [X] attestations."

**Show:**
- Dashboard with mission list
- Passport card showing attestation count
- Available missions

**Point out:**
- "All transactions are sponsored — zero gas fees for users"
- "Missions designed by event organizers"

---

### Step 3: Show Missions (10 seconds)
**Say:**
> "Here are the available missions. Let's complete the 'Check-in Mission' to earn 0.1 SUI."

**Show:**
- Mission cards with titles, descriptions, rewards
- "Scan QR" or "Claim Reward" button

**Highlight:** Reward badge showing SUI amount

---

### Step 4: Scan QR Code (20 seconds)
**Say:**
> "To claim this mission, I scan the QR code at the event location."

**Do:**
1. Click **"Scan QR"** button (or navigate to `/scan`)
2. Show camera preview
3. Hold printed QR code to camera
4. Wait for automatic detection

**Result:**
- QR detected → API call → Transaction submitted
- Success message appears

**Fallback:** If QR fails, click **"Simulate Claim"** button:
> "For the demo, I'll simulate the scan. In production, this would be a physical QR code."

---

### Step 5: Show Attestation & Grant (15 seconds)
**Say:**
> "The mission is now complete! The backend built a sponsored transaction and submitted it to SUI. Let me show you the proof."

**Do:**
1. Navigate to **"My Passport"** (`/passport`)
2. Show new attestation card in grid
3. Point out:
   - Mission title
   - Completion timestamp
   - Reward amount (0.1 SUI)
   - Transaction digest

**Highlight:**
- "This is an NFT-like attestation stored on-chain"
- "The reward was transferred gaslessly"

---

### Step 6: Explorer Link (Optional, 10 seconds)
**Say:**
> "Here's the proof on SUI Explorer — fully verifiable on-chain."

**Do:**
1. Click transaction digest or copy hash
2. Open SUI Explorer: `https://suiscan.xyz/devnet/tx/[digest]`
3. Show transaction details

**Point out:**
- Sponsored transaction (sponsor paid gas)
- Event object updated
- Passport attestation added

---

### Closing (5 seconds)
**Say:**
> "That's LémanFlow — gasless rewards for hackathons, powered by SUI's sponsored transactions, PTBs, and native randomness. We've integrated 8 SUI ecosystem features including Walrus storage and Enoki zkLogin."

**Show:** Quick scroll through:
- SUI_FEATURES.md (if time)
- Admin panel (event creation)
- Architecture diagram

---

## 🔧 Fallback Mechanisms

### Fallback 1: QR Scan Fails
**Problem:** Camera not accessible, QR code won't scan

**Solution:**
1. Click **"Simulate Claim"** button (added to ScanPage)
2. Backend generates QR token and auto-claims
3. Say: *"For the demo, I'm simulating the scan. In production, users would scan physical QR codes at the event."*

**Implementation:**
```tsx
<Button onClick={handleSimulateClaim} variant="outline">
  Simulate Claim (Demo)
</Button>
```

---

### Fallback 2: Sui Network Slow
**Problem:** Transaction takes >10 seconds

**Solution:**
1. Pre-run a mission completion before demo
2. Show cached result immediately
3. Say: *"I completed this mission earlier — here's the on-chain proof."*
4. Navigate directly to `/passport` to show existing attestation

**Alternative:**
- Use **Mock Mode** (`MOCK_MODE=true`)
- Backend returns instant success without blockchain
- Say: *"This is running in demo mode. In production, this would hit the SUI blockchain."*

---

### Fallback 3: zkLogin Glitch
**Problem:** OAuth flow fails or takes too long

**Solution:**
1. Use wallet connection instead
2. Say: *"I'm connecting via wallet. In production, users would use Google/Facebook OAuth through zkLogin."*
3. Continue with standard wallet auth

**Alternative:**
- Pre-authenticate before demo
- Refresh page — session persists via cookie
- Say: *"I'm already authenticated via zkLogin."*

---

### Fallback 4: Mission Not Visible
**Problem:** Missions don't load on Dashboard

**Solution:**
1. Check `VITE_EVENT_ID` in `.env`
2. Manually set eventId in Dashboard component
3. Hard refresh browser (`Cmd+Shift+R`)
4. Say: *"Let me refresh the mission list."*

**Emergency:**
- Show screenshots/video of working demo
- Navigate to Admin panel to show event creation
- Open `/health` to verify backend status

---

## 📊 Demo Success Metrics

After demo, judges should understand:

✅ **Problem:** Traditional hackathons require gas fees for rewards
✅ **Solution:** LémanFlow sponsors all transactions — zero fees for users
✅ **Tech:** SUI blockchain with PTBs, native randomness, Walrus, Enoki
✅ **UX:** Simple login → scan QR → earn rewards → view attestations
✅ **Proof:** On-chain verification via SUI Explorer

---

## 🎯 Quick Reference

| **Action** | **URL** | **Shortcut** |
|------------|---------|--------------|
| Login | `http://localhost:5173/login` | `Cmd+L` then `/login` |
| Dashboard | `http://localhost:5173/dashboard` | `Cmd+L` then `/dashboard` |
| Scan QR | `http://localhost:5173/scan` | Click "Scan QR" button |
| Passport | `http://localhost:5173/passport` | Click "My Passport" |
| Admin | `http://localhost:5173/admin` | Click "Admin" in nav |
| Health | `http://localhost:4000/health` | Backend status check |

---

## 🚨 Emergency Contacts

**During Demo:**
- Backend not responding → Check `npm run dev` in terminal
- Frontend white screen → Check browser console for errors
- Database issue → Restart backend, check `.env`

**Post-Demo:**
- Judges ask for code → Point to GitHub repo
- Questions about SUI features → Reference `SUI_FEATURES.md` and `NATIVE_FEATURES.md`

---

## ✅ Final Checklist (2 minutes before demo)

- [ ] Backend running (`http://localhost:4000/health` returns OK)
- [ ] Frontend running (`http://localhost:5173` loads)
- [ ] Event created with 2-3 missions
- [ ] Grant pool funded
- [ ] QR codes ready (printed or on second device)
- [ ] Test user logged in (or wallet connected)
- [ ] Browser tabs open:
  - [ ] Dashboard
  - [ ] Scan page
  - [ ] Passport page
  - [ ] SUI Explorer (optional)
- [ ] Demo script printed/memorized
- [ ] Fallback plan ready

---

**Good luck! 🚀**

**Remember:** Confidence > perfection. If something fails, use the fallback and keep moving. The judges care about the idea and implementation, not a flawless demo.
