# 🌊 ScanHack — Gasless On-Chain Rewards for Hackathons

**Built on Internet Computer Protocol (ICP) | Zero Gas Fees | Web2 UX | Web3 Security**

---

## 🎯 Vision

**90% of hackathon participants never claim their rewards.**

Why? Wallet setup friction kills adoption. Users spend 10 minutes installing extensions, saving seed phrases, understanding gas fees — then give up.

**ScanHack eliminates ALL friction:**
- ✅ **Login with Internet Identity** — No wallet needed
- ✅ **Zero gas fees** — ICP cycles, no transaction costs
- ✅ **Instant rewards** — Automatic micro-grant distribution
- ✅ **Soulbound credentials** — Permanent proof of achievement (SBT)

**This is the future of Web3 events.**

---

## 💡 Problem

### For Participants:
- ❌ **Wallet setup friction** — 5-10 minutes to install extension, save seed phrase
- ❌ **Gas fees** — Often cost more than the reward itself
- ❌ **Crypto knowledge required** — Excludes 90% of hackathon attendees
- ❌ **No proof of achievement** — After event ends, no verifiable credential
- ❌ **Delayed payouts** — Manual processing takes weeks or months

**Impact:** Only 10% of participants successfully claim rewards. 90% drop off at wallet setup.

### For Organizers:
- ❌ **Manual payment processing** — Hours spent on transfers
- ❌ **Spreadsheet hell** — Tracking participation manually
- ❌ **No transparency** — Sponsors can't verify fund distribution
- ❌ **Fraud risk** — Hard to prevent double-claiming

**Impact:** Organizers either skip rewards entirely or spend 10+ hours on manual distribution.

---

## 🚀 Solution

ScanHack is a **full-stack ICP-based platform** that makes blockchain rewards invisible — and that's when they become inevitable.

### **For Participants:**
- **Internet Identity onboarding** — No wallet, no seed phrases, no friction
- **QR code missions** — Scan to complete, earn instantly
- **HackPass SBT** — Soulbound token per event, non-transferable
- **Attestation SBTs** — NFT-like attestations for each completed mission
- **Gasless everything** — Zero fees, ICP cycles handled automatically

### **For Organizers:**
- **One-click event setup** — Create events, add missions, fund vaults
- **Automated distribution** — No manual payments, instant execution
- **Real-time analytics** — Track participation, rewards, engagement
- **Fraud prevention** — Anti-double-claim, signed QR codes, on-chain verification

### **For Sponsors:**
- **On-chain visibility** — Transparent fund distribution
- **Verifiable metrics** — Real-time engagement tracking
- **Measurable ROI** — Proof of impact on blockchain

---

## 🏗️ Architecture

### **ICP Canisters:**

1. **Registry Canister**
   - User registration
   - HackPass SBT minting (soulbound, non-transferable)
   - User data management

2. **Missions Canister**
   - Mission creation and management
   - QR validation (nonce + signature)
   - Attestation SBT minting
   - Anti-double-claim protection

3. **GrantVault Canister**
   - Micro-grant vaults per event
   - Cycle distribution
   - Grant tracking

4. **Backend Canister**
   - API orchestrator
   - QR payload generation (signed)
   - Mission completion flow
   - Inter-canister coordination

### **Frontend (Next.js 14 + React 19):**
- **Pages:** Login, Dashboard, Scan, Admin, Passport
- **Features:** QR scanner, QR generator (admin), Internet Identity integration
- **UI:** Mobile-first, hackathon-ready, dark theme

### **QR System:**
- **Generator:** ECDSA-signed QR codes with nonce
- **Validator:** Nonce tracking, signature verification, anti-replay
- **Security:** Expiration, unique nonces, cryptographic signatures

---

## 🔄 User Flow

1. **Login** → User connects with Internet Identity (no wallet needed)
2. **Register** → User automatically registered in Registry canister
3. **Mint HackPass** → Soulbound SBT minted for event (one per event)
4. **View Missions** → User sees available missions for event
5. **Scan QR** → User scans QR code at mission location
6. **Validate** → Backend validates QR (nonce + signature + expiration)
7. **Mint Attestation** → Attestation SBT minted (soulbound, non-transferable)
8. **Distribute Grant** → Micro-grant distributed from vault (if reward > 0)
9. **View Passport** → User sees all HackPasses and Attestations

---

## 🛠️ Tech Stack

### **Blockchain:**
- **Internet Computer Protocol (ICP)** — Decentralized cloud
- **Motoko** — Smart contract language
- **Canisters** — Scalable, autonomous smart contracts
- **Internet Identity** — Web2-friendly authentication

### **Frontend:**
- **Next.js 14** — React framework
- **React 19** — UI library
- **Tailwind CSS** — Styling
- **@dfinity/agent** — ICP SDK
- **html5-qrcode** — QR scanner

### **Backend:**
- **Motoko Canisters** — On-chain logic
- **TypeScript** — Type safety
- **ECDSA** — Cryptographic signatures

---

## 📦 Installation

### **Prerequisites:**
- Node.js 18+ ([Download](https://nodejs.org/))
- DFX SDK (ICP development kit)
- Git

### **Quick Start:**

```bash
# 1. Clone repository
git clone <repo-url>
cd scanhack

# 2. Run setup script (installs dependencies)
./scripts/setup.sh

# 3. Deploy canisters (builds frontend and deploys all canisters)
./scripts/deploy.sh

# 4. Start frontend dev server
cd frontend
npm run dev
```

### **Manual Setup:**

```bash
# 1. Install DFX SDK
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# 2. Start local ICP network
dfx start --background

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Deploy canisters
dfx deploy

# 5. Update frontend/.env.local with canister IDs
# (deploy.sh does this automatically)

# 6. Start frontend
cd frontend
npm run dev
```

### **Environment Variables:**

After deployment, update `frontend/.env.local`:

```env
NEXT_PUBLIC_REGISTRY_CANISTER_ID=<canister-id>
NEXT_PUBLIC_MISSIONS_CANISTER_ID=<canister-id>
NEXT_PUBLIC_GRANTVAULT_CANISTER_ID=<canister-id>
NEXT_PUBLIC_BACKEND_CANISTER_ID=<canister-id>
NEXT_PUBLIC_IC_HOST=http://localhost:8000
NEXT_PUBLIC_IC_IDENTITY_PROVIDER=http://localhost:8080?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai
```

Get canister IDs with:
```bash
dfx canister id registry
dfx canister id missions
dfx canister id grantvault
dfx canister id backend
```

---

## 🎬 Demo Flow

### **For Participants:**

1. **Login** (10s)
   - Click "Login with Internet Identity"
   - Authenticate with Face ID / Touch ID / Passkey
   - No wallet, no seed phrase, zero friction

2. **Dashboard** (10s)
   - View available missions
   - See HackPass (auto-minted on first mission)
   - Check attestation count and rewards

3. **Scan QR** (20s)
   - Click "Scan QR" button
   - Point camera at mission QR code
   - QR code validated (nonce + signature + expiration)

4. **Mission Complete** (10s)
   - Attestation SBT minted (soulbound, non-transferable)
   - Micro-grant distributed (if reward > 0)
   - Success message displayed

5. **View Passport** (10s)
   - See all HackPasses and Attestations
   - View on-chain proof
   - Check total rewards earned

### **For Organizers:**

1. **Admin Panel** — Create event with initial vault funding
2. **Create Missions** — Add missions with descriptions and rewards
3. **Generate QR** — Generate signed QR codes for each mission
4. **Monitor** — Track completions and grant distribution in real-time

---

## 🔒 Security Features

- ✅ **Nonce tracking** — Anti-replay protection
- ✅ **ECDSA signatures** — Cryptographic QR validation
- ✅ **Expiration** — Time-limited QR codes
- ✅ **Soulbound tokens** — Non-transferable SBTs
- ✅ **Double-claim prevention** — On-chain checks
- ✅ **Inter-canister auth** — Secure canister communication

---

## 📊 Project Stats

- **Canisters:** 4 (Registry, Missions, GrantVault, Backend)
- **Frontend Pages:** 5 (Login, Dashboard, Scan, Admin, Passport)
- **QR System:** Signed generation + validation
- **SBTs:** HackPass + Attestations (soulbound)
- **Lines of Code:** 5,000+ (Motoko + TypeScript + React)

---

## 🏆 Why This Wins

1. **Solves Real Pain Point** — Hackathon reward friction is universal
2. **Only Possible on ICP** — Internet Identity + Canisters + Cycles
3. **Production-Ready** — Real code, real canisters, real security
4. **Complete Integration** — Full ICP stack, no external dependencies
5. **Beautiful UX** — Web2 simplicity meets Web3 security

---

## 🛠️ Development

### **Project Structure:**

```
scanhack/
├── canisters/          # Motoko canisters
│   ├── registry/       # User & HackPass SBT
│   ├── missions/       # Missions & Attestations SBT
│   └── grantvault/     # Micro-grant distribution
├── backend/            # Backend canister (orchestrator)
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/       # Pages (dashboard, scan, admin, passport)
│   │   ├── components/# UI components
│   │   └── lib/       # ICP integration & utilities
│   └── package.json
├── qr/                # QR generation utilities
├── scripts/           # Deployment scripts
├── docs/              # Documentation
└── dfx.json           # ICP canister configuration
```

### **Scripts:**

- `./scripts/setup.sh` — Install dependencies and setup
- `./scripts/deploy.sh` — Deploy all canisters
- `./scripts/build.sh` — Build frontend
- `./scripts/reset.sh` — Reset canisters (WARNING: deletes data)

### **Building:**

```bash
# Build frontend
cd frontend
npm run build

# Deploy to ICP
dfx deploy
```

### **Testing:**

```bash
# Test canisters locally
dfx canister call registry register

# Test frontend locally
cd frontend
npm run dev
```

## 🔗 Links

- **GitHub:** [Repository URL]
- **Live Demo:** [Demo URL]
- **ICP Explorer:** [Canister URLs]
- **Documentation:** See `docs/` directory

---

## 👥 Team

**Built for DoraHacks Hackathon**

**Tech Stack:**
- **Blockchain:** Internet Computer Protocol (ICP)
- **Smart Contracts:** Motoko
- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Authentication:** Internet Identity
- **QR System:** html5-qrcode + ECDSA signatures

---

## 📝 License

MIT License

---

**Built with ❤️ for DoraHacks**

*Making blockchain rewards invisible—and inevitable.*

