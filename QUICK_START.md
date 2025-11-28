# ⚡ Quick Start - LémanFlow (Blockchain Mode)

## 🎯 Prerequisites

- [Sui CLI](https://docs.sui.io/build/install) installed
- Node.js 18+ installed
- Sui wallet with testnet SUI

---

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
cd ..
```

### 2. Configure Backend

```bash
# Copy template
cp backend/.env.example backend/.env

# Edit backend/.env
nano backend/.env
```

**Required settings:**

```env
# Backend Port
PORT=4000

# CORS - MUST match frontend URL
CORS_ORIGIN=http://localhost:5173

# Blockchain mode
MOCK_MODE=false

# Your deployed contract (from: sui client publish)
PACKAGE_ID=0x...

# Your sponsor account (from: sui keytool generate ed25519)
SPONSOR_PRIVATE_KEY=suiprivekey...
SPONSOR_ADDRESS=0x...

# Sui Network
SUI_NETWORK=testnet
```

### 3. Configure Frontend

```bash
# Copy template
cp frontend/.env.example frontend/.env

# Edit frontend/.env
nano frontend/.env
```

**Required settings:**

```env
# Backend URL - MUST match backend PORT
VITE_API_BASE=http://localhost:4000

# Event ID (get from backend after creating event)
VITE_EVENT_ID=0x...
```

### 4. Deploy Smart Contracts

```bash
cd move
sui client publish --gas-budget 100000000
```

**⚠️ Save the Package ID** and update `backend/.env`:
```env
PACKAGE_ID=0x<your_package_id>
```

### 5. Fund Sponsor Account

```bash
# Request testnet SUI
sui client faucet

# Verify balance
sui client balance
```

### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# ✅ Should show:
# 📋 Configuration loaded:
#    Network: testnet
#    Mock Mode: NO (production)
#    Package ID: 0x...
# 🚀 Server: http://0.0.0.0:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# ✅ Should show:
# VITE ready at http://localhost:5173
```

### 7. Create Event & Missions

**Open new terminal:**

```bash
# Create event
curl -X POST http://localhost:4000/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUI Hackathon 2025",
    "description": "Build on SUI blockchain",
    "startTime": 1704067200000,
    "endTime": 1704153600000
  }'

# ⚠️ Save eventId and adminCapId from response!
```

Update `frontend/.env`:
```env
VITE_EVENT_ID=0x<your_event_id>
```

```bash
# Fund event (10 SUI = 10,000,000,000 MIST)
curl -X POST http://localhost:4000/api/admin/fund \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x<your_event_id>",
    "amount": 10000000000
  }'

# Create mission
curl -X POST http://localhost:4000/api/admin/missions \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "0x<your_event_id>",
    "adminCapId": "0x<your_admin_cap_id>",
    "title": "Check-in Mission",
    "description": "Scan QR at entrance",
    "rewardAmount": 100000000
  }'
```

### 8. Test!

1. Open http://localhost:5173
2. Click "LémanFlow" tab
3. Connect wallet
4. Register passport (gasless transaction!)
5. Claim mission (gasless transaction!)
6. ✅ Verify reward in wallet

---

## ❌ Common Issues

### CORS Error

**Error:** "blocked by CORS policy"

**Fix:**
```env
# backend/.env
CORS_ORIGIN=http://localhost:5173  # Must match frontend URL exactly!
```

Restart backend after change.

### Connection Refused

**Error:** "ERR_CONNECTION_REFUSED"

**Fix:**
```env
# frontend/.env
VITE_API_BASE=http://localhost:4000  # Must match backend PORT exactly!
```

Restart frontend after change.

### Backend Shows "MOCK mode"

**Error:** Backend logs show "Mock Mode: YES"

**Fix:**
```env
# backend/.env
MOCK_MODE=false
SPONSOR_PRIVATE_KEY=suiprivekey...  # Must be set!
```

### Transaction Fails

**Error:** "Insufficient funds" or transaction rejected

**Fix:**
```bash
# Check sponsor balance
sui client balance

# Request more SUI
sui client faucet

# Check event is funded
curl http://localhost:4000/api/admin/sponsor/balance
```

---

## 🎯 Verification

After setup, verify everything works:

### 1. Backend Health Check
```bash
curl http://localhost:4000/health
```
**Expected:**
```json
{
  "status": "ok",
  "mode": "production",  // NOT "mock"!
  "network": "testnet",
  "packageId": "0x..."
}
```

### 2. Check Sponsor Balance
```bash
curl http://localhost:4000/api/admin/sponsor/balance
```
**Expected:**
```json
{
  "balanceSui": "9.5000"  // Should be > 0
}
```

### 3. Browser Console (F12)

**Expected:**
- ✅ No CORS errors
- ✅ No connection errors
- ✅ Successful API responses

---

## 📁 Configuration Summary

| File | Key Settings | Purpose |
|------|-------------|---------|
| `backend/.env` | `PORT=4000`<br>`CORS_ORIGIN=http://localhost:5173`<br>`MOCK_MODE=false`<br>`PACKAGE_ID=0x...`<br>`SPONSOR_PRIVATE_KEY=...` | Backend configuration |
| `frontend/.env` | `VITE_API_BASE=http://localhost:4000`<br>`VITE_EVENT_ID=0x...` | Frontend configuration |

**⚠️ CRITICAL:** Backend `CORS_ORIGIN` must match frontend URL!
**⚠️ CRITICAL:** Frontend `VITE_API_BASE` must match backend URL!

---

## 🆘 Need Help?

See [CORS_PORTS_SETUP.md](./CORS_PORTS_SETUP.md) for detailed troubleshooting.

---

**Ready to hack! 🚀**
