# 🚀 LémanFlow - Hackathon Deployment Guide

## Quick Deployment Steps for Demo

### 1. Setup Environment (5 min)

```bash
# Clone and install
git clone <repo>
cd lemanflow
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Deploy Smart Contracts (3 min)

```bash
cd move

# Deploy to testnet
sui client publish --gas-budget 100000000

# ⚠️ IMPORTANT: Copy the Package ID from output
# Example: 0xe13b43211fca648ff5a3198b3282d15a3c9c976ed922d418231f76680755710d
```

### 3. Create Sponsor Account (2 min)

```bash
# Generate keypair
sui keytool generate ed25519

# ⚠️ SAVE:
# - Private key (suiPrivateKey field)
# - Address

# Fund account (testnet)
sui client faucet

# Verify balance
sui client balance
```

### 4. Configure Environment (2 min)

```bash
cd ..
cp .env.example .env

# Edit .env with:
nano .env
```

**Required fields:**
```env
PACKAGE_ID=0x... # From step 2
SPONSOR_PRIVATE_KEY=... # From step 3
SPONSOR_ADDRESS=... # From step 3
MOCK_MODE=false # Set to true for demo without blockchain
```

### 5. Initialize Event (2 min)

Start backend first:

```bash
cd backend
npm run dev
```

In another terminal, create event:

```bash
curl -X POST http://localhost:4000/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUI Hackathon 2025",
    "description": "Build on SUI blockchain",
    "startTime": 1704067200000,
    "endTime": 1704153600000,
    "initialFunding": 0
  }'

# ⚠️ SAVE: eventId and adminCapId from response
```

### 6. Fund Event (1 min)

```bash
# Fund with 10 SUI (10,000,000,000 MIST)
curl -X POST http://localhost:4000/api/admin/fund \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x...",
    "amount": 10000000000
  }'
```

### 7. Create Missions (3 min)

```bash
# Mission 1: Check-in
curl -X POST http://localhost:4000/api/admin/missions \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x...",
    "adminCapId": "0x...",
    "title": "Check-in at Hackathon",
    "description": "Scan QR code at entrance",
    "rewardAmount": 100000000
  }'

# Mission 2: Workshop
curl -X POST http://localhost:4000/api/admin/missions \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x...",
    "adminCapId": "0x...",
    "title": "Attend Workshop",
    "description": "Participate in Move workshop",
    "rewardAmount": 200000000
  }'

# Mission 3: Project Submission
curl -X POST http://localhost:4000/api/admin/missions \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x...",
    "adminCapId": "0x...",
    "title": "Submit Project",
    "description": "Submit your hackathon project",
    "rewardAmount": 500000000
  }'
```

### 8. Start Frontend (1 min)

```bash
cd ../frontend

# Update frontend/src/pages/LemanFlowDashboard.tsx
# Change DEFAULT_EVENT_ID to your eventId from step 5

npm run dev
```

### 9. Test Complete Flow (5 min)

1. Open http://localhost:5173
2. Click "LémanFlow" tab
3. Connect wallet (or use wallet login)
4. Click "Register Passport" (gasless!)
5. Click "Claim Reward" on a mission (gasless!)
6. Verify reward received in wallet
7. Check attestation in passport

---

## 🎯 Demo Script for Judges

### Pitch (2 min)

> "LémanFlow automates micro-grant distribution at hackathons using gasless transactions on Sui. Participants complete missions, scan QR codes, and receive instant SUI rewards—all without paying gas fees."

### Live Demo (3 min)

**Show:**
1. **Participant View:**
   - Connect wallet / zkLogin
   - Register passport (gasless)
   - View available missions
   - Claim mission reward (gasless)
   - Show reward in wallet
   - Show attestation in passport

2. **Organizer View:**
   - Show event configuration
   - Show mission creation
   - Show grant pool balance
   - Show analytics (completions)

3. **Smart Contract View (optional):**
   - Show transaction on Sui Explorer
   - Highlight sponsored gas payment
   - Show passport SBT
   - Show attestation dynamic fields

### Key Points to Highlight

- ✅ **Zero gas fees** - All transactions sponsored
- ✅ **Web2-like UX** - zkLogin, no seed phrases
- ✅ **Instant rewards** - Automatic distribution
- ✅ **Anti-fraud** - Anti-double-claim, QR signing
- ✅ **Soulbound proof** - Immutable participation records
- ✅ **Production-ready** - Tests, error handling, mock mode

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check sponsor balance
curl http://localhost:4000/api/admin/sponsor/balance

# Enable mock mode for demo
echo "MOCK_MODE=true" >> .env
```

### Frontend can't connect
```bash
# Check CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5173

# Restart backend
```

### Transactions failing
```bash
# Check event is funded
curl "http://localhost:4000/api/missions?eventId=0x..."

# Check sponsor balance
curl http://localhost:4000/api/admin/sponsor/balance
```

### No missions showing
```bash
# Verify eventId in frontend code
# Check: frontend/src/pages/LemanFlowDashboard.tsx
# Line 12: const DEFAULT_EVENT_ID = '0x...'
```

---

## 🎁 Demo Data (Mock Mode)

If blockchain isn't working, enable mock mode:

```env
MOCK_MODE=true
```

Mock mode provides:
- 3 pre-configured missions
- Instant "claim" simulation
- No blockchain transactions
- Full UI/UX demo

Perfect for:
- Network issues
- Quick demonstrations
- Frontend development

---

## 📊 Expected Results

After successful deployment:

### Health Check
```bash
curl http://localhost:4000/health
# → { status: "ok", mode: "production", network: "testnet" }
```

### Mission List
```bash
curl "http://localhost:4000/api/missions?eventId=0x..."
# → { missions: [ { missionId: 0, title: "...", rewardAmount: 100000000, ... } ] }
```

### Sponsor Balance
```bash
curl http://localhost:4000/api/admin/sponsor/balance
# → { balanceSui: "9.8500" }
```

---

## 🏆 Success Criteria

- ✅ Backend running on port 4000
- ✅ Frontend running on port 5173
- ✅ Smart contracts deployed to testnet
- ✅ Event created and funded
- ✅ 3+ missions created
- ✅ User can register passport (gasless)
- ✅ User can claim mission (gasless)
- ✅ Reward appears in user wallet
- ✅ Attestation visible in passport
- ✅ Anti-double-claim works

---

## 📈 Next Steps After Hackathon

1. **zkLogin Integration**: Implement real Google/GitHub OAuth
2. **QR Scanner**: Add camera-based QR scanning
3. **Analytics Dashboard**: Real-time participation metrics
4. **Multi-event Support**: Multiple concurrent events
5. **Notification System**: Email/push notifications
6. **Mobile App**: React Native version
7. **Mainnet Deployment**: Production launch

---

## 🆘 Emergency Contacts

- **Sui Discord**: https://discord.gg/sui
- **Move Language**: https://move-language.github.io/move/
- **Sui Docs**: https://docs.sui.io/

---

**Built with ❤️ for SUI Hackathon 2025**

Good luck! 🚀
