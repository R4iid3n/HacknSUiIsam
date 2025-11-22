# LémanFlow - Gasless Hackathon Rewards Platform

> **Login with Google. Scan QR codes. Earn SUI. Zero gas fees.**

**LémanFlow** eliminates the friction of blockchain rewards by combining Sui's zkLogin, sponsored transactions, and object model into a seamless Web2-like experience. Participants complete missions, earn instant SUI rewards, and build soulbound credential portfolios—all without wallets, gas fees, or crypto knowledge.

🏆 **Built for Sui Hackathon 2025** | 🚀 **Production-Ready** | 🔗 **8 Sui-Native Features Integrated**

---

## 💡 The Problem

Traditional hackathon rewards require:
- ❌ Wallet setup (5-10 minutes of friction)
- ❌ Gas fees (costs more than the reward)
- ❌ Crypto knowledge (excludes 90% of participants)
- ❌ Manual payments (hours of organizer work)

**LémanFlow solves this with Sui's unique primitives.**

## 🌟 Key Features

### For Participants
- **Zero gas fees**: All transactions sponsored by organizers
- **No wallet needed**: Login with Google/GitHub via zkLogin
- **Instant rewards**: Automatic SUI distribution upon mission completion
- **Soulbound passport**: Immutable proof of participation (NFT)
- **Web2-like UX**: Familiar onboarding, no seed phrases

### For Organizers
- **Automated distribution**: No manual payments, instant execution
- **QR-based verification**: Secure, anti-replay mission validation
- **Real-time analytics**: Track participation and rewards
- **Fraud prevention**: Anti-double-claim, timestamps, signatures

### For Sponsors
- **On-chain visibility**: Transparent grant distribution
- **Engagement tracking**: Verifiable impact metrics
- **Blockchain attestations**: Permanent participation records

---

## 🔥 Why Sui?

LémanFlow leverages **8 Sui-native features** that make this impossible on other chains:

1. **zkLogin** - Social login without wallet setup
2. **Sponsored Transactions** - Organizers pay gas, participants pay nothing
3. **Dynamic Fields** - Scalable credential storage (O(1) access)
4. **Object Model** - Type-safe soulbound tokens enforced by Move
5. **Programmable Transaction Blocks (PTBs)** - Atomic multi-step operations
6. **Native Randomness** - Fair mission selection (future feature)
7. **Multisig** - Secure admin operations
8. **Walrus Storage** - Decentralized QR code and image hosting

**On Ethereum:** Would require EIP-4337 (Account Abstraction) + custom relayer infrastructure + meta-transaction frameworks

**On Solana:** No native zkLogin equivalent, complex fee payer patterns

**On Sui:** Built-in at protocol level, works out of the box ✅

👉 See [`SUI_FEATURES.md`](./SUI_FEATURES.md) and [`NATIVE_FEATURES.md`](./NATIVE_FEATURES.md) for detailed technical breakdown.

---

## 📁 Project Structure

```
lemanflow/
├── move/                          # Sui Move smart contracts
│   ├── sources/
│   │   ├── lemanflow/
│   │   │   ├── event.move         # Event management + grant pool
│   │   │   ├── mission.move       # Mission logic + rewards
│   │   │   ├── passport.move      # Soulbound passport (SBT)
│   │   └── counter.move           # Example contract
│   ├── tests/                     # Move tests
│   └── Move.toml
│
├── backend/                       # Fastify API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts            # zkLogin + wallet auth
│   │   │   ├── missions.ts        # Mission queries, QR generation
│   │   │   ├── passport.ts        # Passport registration, claim
│   │   │   └── admin.ts           # Event/mission creation
│   │   ├── services/
│   │   │   ├── sponsoredTx.ts     # Gasless transactions
│   │   │   ├── zkLogin.ts         # zkLogin verification
│   │   │   ├── qrService.ts       # QR signing/verification
│   │   │   └── suiClient.ts       # Sui blockchain client
│   │   ├── config.ts              # Configuration
│   │   └── server.ts              # Fastify server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── lemanflow/
│   │   │   │   ├── MissionCard.tsx
│   │   │   │   ├── PassportCard.tsx
│   │   │   │   └── QRDialog.tsx
│   │   │   └── ui/                # Shadcn UI components
│   │   ├── pages/
│   │   │   └── LemanFlowDashboard.tsx
│   │   ├── services/
│   │   │   └── walrusService.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── scripts/                       # CLI utilities
│   ├── deploy.sh                  # Deploy Move contracts
│   ├── init-event.sh              # Initialize event
│   └── create-mission.sh          # Create mission
│
├── .env.example                   # Environment template
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [SUI CLI](https://docs.sui.io/build/install)
- [Docker](https://www.docker.com/) (optional)

### 1. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Deploy Smart Contracts

```bash
# Use deployment script
./scripts/deploy.sh

# Or manually
cd move
sui client publish --gas-budget 100000000
```

**Save the Package ID from output!**

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and set:
# - PACKAGE_ID (from deployment)
# - SPONSOR_PRIVATE_KEY (create with: sui keytool generate ed25519)
# - SPONSOR_ADDRESS
```

### 4. Fund Sponsor Account

```bash
# Testnet
sui client faucet

# Check balance
sui client balance
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:4000`

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📡 API Endpoints

### Authentication

- `POST /api/login` - zkLogin (Google/GitHub)
- `POST /api/login/wallet` - Wallet login
- `GET /api/session` - Get current session
- `POST /api/logout` - Logout

### Missions

- `GET /api/missions?eventId=<id>` - List missions
- `GET /api/missions/:id/qr?eventId=<id>` - Generate QR code
- `POST /api/scan` - Verify QR code

### Passport

- `GET /api/passport` - Get user passport
- `POST /api/passport/register` - Register passport (gasless)
- `POST /api/claim` - Claim mission reward (gasless)

### Admin

- `POST /api/admin/init` - Create event
- `POST /api/admin/missions` - Create mission
- `POST /api/admin/fund` - Fund event
- `GET /api/admin/sponsor/balance` - Check sponsor balance

## 🎯 Usage Flow

### For Organizers

```bash
# 1. Deploy contracts
./scripts/deploy.sh

# 2. Create event
./scripts/init-event.sh
# -> Save EVENT_ID and ADMIN_CAP_ID

# 3. Create missions
./scripts/create-mission.sh
# -> Generates QR codes for each mission

# 4. Print QR codes for venue

# 5. Monitor dashboard
```

### For Participants

1. Visit event website
2. Connect wallet OR login with Google/GitHub (zkLogin)
3. Register passport (one-click, gasless)
4. Complete missions by scanning QR codes
5. Receive instant SUI rewards (gasless)
6. View attestations in passport

## 🔐 Security Features

### Smart Contracts

- **Soulbound tokens**: Passports non-transferable (proof of identity)
- **Anti-double-claim**: Each mission claimable once per passport
- **Timestamps**: Event-based validation
- **Access control**: Admin-only functions (EventAdminCap)
- **Dynamic fields**: Scalable mission storage

### Backend

- **QR signing**: JWT-signed QR codes with ECDSA
- **Nonce anti-replay**: Used QR codes invalidated
- **Session management**: Secure HTTP-only cookies
- **Sponsored transactions**: Isolated sponsor keypair

## 🧪 Testing

### Move Contracts

```bash
cd move
sui move test
```

### Backend API (Mock Mode)

```bash
# Set MOCK_MODE=true in .env
cd backend
npm run dev

# All endpoints work without blockchain
curl http://localhost:4000/health
```

### Frontend

```bash
cd frontend
npm run dev

# Connect wallet or use mock login
```

## 📊 Architecture

### Gasless Transactions Flow

```
User                Backend              Sui Blockchain
 |                     |                        |
 |--1. Login---------->|                        |
 |<---Session----------|                        |
 |                     |                        |
 |--2. Claim Mission-->|                        |
 |                     |--3. Build TX---------->|
 |                     |    (sponsor signs)     |
 |                     |<--4. TX Receipt--------|
 |<---5. Reward--------|                        |
```

**Key:** Sponsor pays gas, user receives reward directly

### Smart Contract Architecture

```
Event (shared object)
├── grant_pool: Balance<SUI>
├── missions (dynamic fields):
│   ├── Mission #0
│   ├── Mission #1
│   └── Mission #2
└── EventAdminCap (capability)

Passport (soulbound, owned by user)
└── attestations (dynamic fields):
    ├── Attestation(event_id=0x1, mission_id=0)
    ├── Attestation(event_id=0x1, mission_id=1)
    └── ...
```

## 🌐 Deployment

### Production Checklist

- [ ] Deploy contracts to mainnet/testnet
- [ ] Fund sponsor account (>10 SUI recommended)
- [ ] Set `MOCK_MODE=false`
- [ ] Configure OAuth credentials (Google/GitHub)
- [ ] Set strong secrets (`QR_SECRET`, `SESSION_SECRET`)
- [ ] Enable HTTPS (nginx reverse proxy)
- [ ] Set `CORS_ORIGIN` to frontend domain
- [ ] Monitor sponsor balance
- [ ] Set up analytics/logging

### Docker Deployment

```bash
docker-compose up -d
```

Includes: Frontend (nginx) + Backend (Node.js)

## 📈 Market & Impact

### Target Market (TAM/SAM)

- **Global hackathon market**: $5.1B (2031 projection)
- **Hackathon software**: $3.5B (2033)
- **CAGR**: 15%+

### Use Cases Beyond Hackathons

- **Conferences**: Attendance badges, speaker rewards
- **Festivals**: Volunteer rewards, artist SBTs
- **Education**: Course completion attestations
- **Open innovation**: Automated bounties

## 🛠️ Development

### Mock Mode

Set `MOCK_MODE=true` for development without blockchain:

```bash
# .env
MOCK_MODE=true
```

All API endpoints return mock data, no transactions executed.

### Adding New Mission Types

1. Update `mission.move` with new validation logic
2. Add endpoint in `backend/src/routes/missions.ts`
3. Update frontend components

---

## 📸 Screenshots & Demo

### Live Demo

🎥 **[Watch 2-Minute Demo Video](#)** _(Coming soon)_

🔗 **[Try Live Demo](#)** _(Testnet deployment)_

### Screenshots

_Comprehensive screenshots available in `/screenshots` folder. See [`SCREENSHOT_CHECKLIST.md`](./SCREENSHOT_CHECKLIST.md) for the complete visual guide._

Key screens:
1. **Landing Page** - Dark hero with zkLogin CTA
2. **Dashboard** - Available missions with rewards
3. **QR Scanner** - Real-time camera scanning
4. **Claim Success** - Transaction confirmation
5. **Passport** - Soulbound attestation gallery
6. **Admin Panel** - Event/mission creation
7. **Sui Explorer** - On-chain proof

---

## 📚 Documentation

### For Judges & Reviewers
- 📄 **[SUBMISSION.md](./SUBMISSION.md)** - Complete hackathon submission text
- ❓ **[JUDGE_QA.md](./JUDGE_QA.md)** - Technical Q&A cheat sheet
- 🎯 **[ELEVATOR_PITCH.md](./ELEVATOR_PITCH.md)** - 30/60/90-second pitches
- 🔬 **[TECHNICAL_INNOVATION.md](./TECHNICAL_INNOVATION.md)** - Why this is technically impressive

### For Demo Day
- 🎬 **[DEMO_GUIDE.md](./DEMO_GUIDE.md)** - 60-90 second demo script with fallbacks
- 🚀 **[Demo Helper Page](http://localhost:5173/demo-helper)** - Pre-demo verification dashboard
- 📸 **[SCREENSHOT_CHECKLIST.md](./SCREENSHOT_CHECKLIST.md)** - Visual assets guide

### Technical Documentation
- 🔗 **[SUI_FEATURES.md](./SUI_FEATURES.md)** - All 8 Sui-native features explained
- 🛠️ **[NATIVE_FEATURES.md](./NATIVE_FEATURES.md)** - Deep-dive integration guide
- 📦 **[Move Contracts](./move/sources/lemanflow/)** - Fully documented smart contracts
- 🔌 **[API Routes](./backend/src/routes/)** - Backend implementation

---

## 🔗 External Resources

- [Sui Documentation](https://docs.sui.io/)
- [Move Language Book](https://move-language.github.io/move/)
- [zkLogin Guide](https://docs.sui.io/build/zk-login)
- [Sponsored Transactions](https://docs.sui.io/guides/developer/sui-101/sponsored-transactions)

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Open issues or PRs.

## 💡 Support

For questions:
- Open GitHub issue
- Discord: [SUI Discord](https://discord.gg/sui)

---

**Built with ❤️ for SUI Hackathon 2025**
