# 🌊 LémanFlow — Automated, Gasless Web3 Rewards for Hackathons & Events (Built on Sui)

**LémanFlow** is a frictionless reward & attestation platform for hackathons, conferences, and tech events.

Participants sign in with **zkLogin**, complete missions, scan QR codes, mint **Soulbound Passports**, claim **Attestations**, and receive **micro-grants** — all **gasless**, powered by **Sui sponsored transactions**.

## 🆕 Nouvelles Fonctionnalités

### 🏆 Hackfolio - Portfolio Web3 Vérifié
Votre portfolio personnel avec :
- Stats en temps réel (récompenses, missions, événements)
- Liens directs vers SuiVision pour vérification on-chain
- Export JSON avec toutes les preuves
- Partage social de vos réalisations

👉 **[Guide Hackfolio Complet](./HACKFOLIO_GUIDE.md)**

### 🤖 Agents IA - Automatisation Complète
Automatisez vos workflows avec des agents intelligents :
- **Agent Check-In** : Validation automatique des scans
- **Agent Récompenses** : Distribution intelligente des rewards
- **Agent Missions** : Gestion des parcours multi-étapes
- **Agent Analytics** : Détection de fraude et rapports

👉 **[Guide Agents IA Complet](./AI_AGENTS_GUIDE.md)**

### ✨ UI Moderne avec Animations
- Animations fluides (fade, slide, scale)
- Effets de hover sophistiqués
- Gradient animations
- Glass morphism
- Design responsive mobile-first

## 🎯 Caractéristiques Principales

✔ **No wallet** — Connexion avec zkLogin  
✔ **No seed phrase** — Authentification Web2  
✔ **No gas** — Transactions sponsorisées  
✔ **Fully on-chain** — Preuves vérifiables  
✔ **Scalable** — Architecture Dynamic Fields  
✔ **AI-Powered** — Automatisation intelligente  
✔ **Hackfolio** — Portfolio Web3 personnel

---

## 🚀 1. Why LémanFlow Exists

Hackathon reward distribution today is slow, manual, fragmented, and opaque:

* Delayed grant payouts
* Spreadsheets & manual verification
* No proof of participation
* High friction for newcomers (wallets, gas, seed phrases)
* Poor visibility for sponsors
* No scalable way to issue badges/attestations

**LémanFlow automates everything.**

Participants onboard instantly using **Google/GitHub via zkLogin**, complete missions, and receive verified on-chain rewards — without understanding crypto.

---

## 🧠 2. Why Sui (and only Sui) Makes This Possible

LémanFlow leverages Sui-native primitives that no other chain can match:

### ⭐ zkLogin

Web2 onboarding → mass adoption  
No wallets, no keys → perfect for events

### ⭐ Sponsored Transactions

UX without gas fees  
Organizers/sponsors pay gas invisibly

### ⭐ Dynamic Fields

Massively scalable mission & reward storage  
Perfect for event logic

### ⭐ Object Model

Passports & Attestations as true on-chain objects  
Soulbound, verifiable, immutable

### ⭐ Parallel Execution

Fast mission claims even under heavy load

👉 LémanFlow is not just "on Sui" — **it is only *possible* on Sui**.

---

## 🏗️ 3. Architecture Overview

```
┌────────────────────────┐      ┌─────────────────────────┐
│   Frontend (React+Vite)│ ----▶│    Backend (Fastify)    │
│  zkLogin, QR Scan, UI  │◀---- │API, ECDSA signer,       │
└────────────────────────┘      │Sui sponsoring engine     │
         │                      └───────────▲─────────────┘
         │                                    │
         ▼                                    │ Sponsored TX
┌──────────────────────────────┐             │
│    Sui Smart Contracts        │◀────────────┘
│ Passport SBT, Missions,       │
│ Attestations, GrantPools      │
│ Dynamic Fields Architecture   │
└──────────────────────────────┘
```

---

## 📦 4. Features

### 👤 Participant Experience

* zkLogin (Google/GitHub)
* Automatic SBT Passport minting
* Mission list
* QR code mission validation
* Claim Attestation via sponsored transaction
* Automatic micro-grants
* Fully gasless

### 🛠️ Organizer Dashboard

* Event creation
* Mission management
* Live analytics
* GrantPool creation
* Automatic distributions
* Fraud detection (anti-double claim)
* ECDSA QR system

### 💼 Sponsor Benefits

* On-chain visibility
* Verifiable fund distribution
* Real-time engagement metrics
* Permanent participation records

---

## 🔗 5. Smart Contracts (Move)

### **Passport (SBT)**

Proof of event participation  
Soulbound – cannot be transferred

### **Mission**

Tasks (scan QR, attend workshop…)  
Stored via Dynamic Fields for scalability

### **Attestation (SBT)**

Given when a mission is completed  
Includes timestamp & mission ID

### **Event & GrantPool**

Automated micro-grant distribution to participants  
Sponsoring integrated at contract level

### **Security Logic**

* Anti-double-claim checked on-chain
* Timestamps for fraud prevention
* Strict Move types (no unwanted abilities)
* Unit tests for mint/claim/distribute

**Modules:**
- `event.move` — Event management + grant pool
- `mission.move` — Mission logic + rewards
- `passport.move` — Soulbound passport (SBT)
- `multisig_admin.move` — Threshold governance

---

## 🖥️ 6. Backend (Fastify + Sui Integration)

* zkLogin session validation
* ECDSA QR signing system
* Sponsored transaction builder
* Mission validation API
* Attestation mint API
* Grant distribution orchestrator
* Admin API (events, missions, pools)

**Key Routes:**
- `POST /api/login` — zkLogin callback
- `GET /api/me` — User profile + passport status
- `GET /api/missions` — List missions for event
- `POST /api/claim` — Claim mission (sponsored tx)
- `POST /api/admin/events` — Create event
- `POST /api/admin/events/:id/fund` — Fund grant pool

---

## 🌐 7. Frontend (React + Vite)

* `/login` → zkLogin onboarding
* `/dashboard` → Live mission list
* `/scan` → QR validation
* `/passport` → Passport + Attestations
* `/admin` → Mission & pool management

Designed for **Web2 simplicity + Web3 authenticity**.

**Tech Stack:**
- React 18 + Vite
- TailwindCSS + shadcn/ui
- React Router
- React Query
- @zxing/browser (QR scanner)

---

## 🚀 8. Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

```bash
# Lancer la démo complète
./START_DEMO.sh

# Arrêter la démo
./STOP_DEMO.sh
```

Le script automatique :
- ✓ Vérifie les dépendances
- ✓ Installe les packages
- ✓ Configure les environnements
- ✓ Lance backend + frontend
- ✓ Ouvre le navigateur
- ✓ Mode MOCK activé (pas de blockchain)

### Option 2 : Manuel

```bash
# Backend
cd backend
npm install
npm run dev
# Runs on http://localhost:4000

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Option 3 : Production (Blockchain Réelle)

```bash
# 1. Déployer les smart contracts
cd move
sui move build
sui client publish --gas-budget 100000000

# 2. Configurer backend/.env
MOCK_MODE=false
PACKAGE_ID=<votre_package_id>
SPONSOR_PRIVATE_KEY=<votre_clé>
SPONSOR_ADDRESS=<votre_adresse>

# 3. Lancer
cd backend && npm run dev
cd frontend && npm run dev
```

## 🧪 9. Testing

* Move unit tests (`sui move test`)
* End-to-end mission → attestation → grant flow
* QR signature validation tests
* Sponsored transaction simulation
* Admin flow tests

**Run Tests:**
```bash
# Move contracts
cd move
sui move test

# Backend (mock mode)
cd backend
MOCK_MODE=true npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 📸 10. Screenshots & Démo

### Nouvelles Pages

```
/screenshots
 ├── 01-landing.png        # Login page with zkLogin
 ├── 02-dashboard.png      # Mission list
 ├── 03-qr-scanner.png     # QR code scanning
 ├── 04-claim-success.png  # Transaction confirmation
 ├── 05-passport.png       # Attestation portfolio
 ├── 06-hackfolio.png      # 🆕 Hackfolio avec stats
 ├── 07-ai-agents.png      # 🆕 Gestion des agents IA
 ├── 08-admin.png          # Event/mission creation
 ├── 09-suivision.png      # On-chain proof
 └── demo-video.mp4        # 5-minute demo video
```

### Guides de Démo

- **[Guide Démo Finale](./DEMO_FINALE.md)** - Script de présentation 5 minutes
- **[Guide Hackfolio](./HACKFOLIO_GUIDE.md)** - Portfolio Web3 vérifié
- **[Guide Agents IA](./AI_AGENTS_GUIDE.md)** - Automatisation complète
- **[Screenshot Checklist](./SCREENSHOT_CHECKLIST.md)** - Assets visuels

---

## 🧩 10. Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Sui CLI](https://docs.sui.io/build/install)
- [Docker](https://www.docker.com/) (optional)

### Clone the repo

```bash
git clone https://github.com/<you>/lemanflow
cd lemanflow
```

### Install Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Install Backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Deploy Move Contracts

```bash
cd move
sui move build
sui client publish --gas-budget 100000000
# Save PACKAGE_ID from output
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env and set:
# - PACKAGE_ID (from deployment)
# - SPONSOR_PRIVATE_KEY
# - SPONSOR_ADDRESS
```

### Fund Sponsor Account

```bash
# Testnet
sui client faucet

# Check balance
sui client balance
```

---

## 🧭 11. Roadmap

### **V1 — Hackathons (current)**

* Passports SBT
* Mission Attestations
* GrantPools
* QR verification
* Sponsored TX
* zkLogin

### **V2 — Conferences**

* Feedback-to-earn
* Booth visit verification
* Speaker rewards
* Premium analytics

### **V3 — Education**

* Course attestations
* Student reward systems
* Study missions

### **V4 — Global Events & DAO**

* Multi-event platform
* DAO governance
* Cross-chain attestation bridges
* Marketplace for badges & missions

---

## 💼 12. Business Potential

Events & hackathons = **$5.1B market by 2031** (CAGR 15%)

LémanFlow provides:

* Enterprise onboarding
* Sponsor analytics
* Transaction proofs
* Community engagement
* Automatic reward distribution

This is not just a hackathon project — **it is the future infrastructure of Web3 events**.

**Target Market:**
- Hackathons: 10,000+ annually
- Conferences: $50B+ market
- Education: $250B+ market
- Corporate training: $300B+ market

---

## 📚 13. Documentation

### For Judges & Reviewers
- 📄 **[SUBMISSION.md](./SUBMISSION.md)** - Complete hackathon submission
- ❓ **[JUDGE_QA.md](./JUDGE_QA.md)** - Technical Q&A cheat sheet
- 🎯 **[ELEVATOR_PITCH.md](./ELEVATOR_PITCH.md)** - 30/60/90-second pitches
- 🔬 **[TECHNICAL_INNOVATION.md](./TECHNICAL_INNOVATION.md)** - Technical deep-dive

### For Demo Day
- 🎬 **[DEMO_GUIDE.md](./DEMO_GUIDE.md)** - 60-90 second demo script
- 📸 **[SCREENSHOT_CHECKLIST.md](./SCREENSHOT_CHECKLIST.md)** - Visual assets guide

### Technical Documentation
- 🔗 **[SUI_FEATURES.md](./SUI_FEATURES.md)** - All 8 Sui-native features
- 🛠️ **[NATIVE_FEATURES.md](./NATIVE_FEATURES.md)** - Deep-dive integration guide
- 📦 **[Move Contracts](./move/sources/lemanflow/)** - Smart contracts
- 🔌 **[API Routes](./backend/src/routes/)** - Backend implementation

### Modules (Hackathon Winning Package)
- 📋 **[MODULE1.md](./MODULE1.md)** - Project Overview
- 🎤 **[MODULE2.md](./MODULE2.md)** - Full Pitch Deck
- 🎯 **[MODULE3.md](./MODULE3.md)** - Elevator Pitches
- 🏗️ **[MODULE4.md](./MODULE4.md)** - Architecture Diagrams
- 🧱 **[MODULE5.md](./MODULE5.md)** - Move Architecture
- 🌐 **[MODULE6.md](./MODULE6.md)** - Backend/API Structure
- 🎨 **[MODULE7.md](./MODULE7.md)** - Frontend/UI Structure
- 🎬 **[MODULE8.md](./MODULE8.md)** - Fail-Proof Demo Flow
- 📄 **[MODULE9.md](./MODULE9.md)** - Devpost/DoraHacks Submission
- ❓ **[MODULE10.md](./MODULE10.md)** - Judge Q&A Cheat Sheet
- 📚 **[MODULES_INDEX.md](./MODULES_INDEX.md)** - Complete modules guide

---

## 🔗 14. External Resources

- [Sui Documentation](https://docs.sui.io/)
- [Move Language Book](https://move-language.github.io/move/)
- [zkLogin Guide](https://docs.sui.io/build/zk-login)
- [Sponsored Transactions](https://docs.sui.io/guides/developer/sui-101/sponsored-transactions)
- [Dynamic Fields](https://docs.sui.io/guides/developer/sui-101/using-objects#dynamic-fields)

---

## 📝 15. License

MIT

---

## 🤝 Contributing

Contributions welcome! Open issues or PRs.

---

## 💡 Support

For questions:
- Open GitHub issue
- Discord: [SUI Discord](https://discord.gg/sui)

---

**Built with ❤️ for SUI Hackathon 2025**

*Making blockchain rewards invisible—and inevitable.*
