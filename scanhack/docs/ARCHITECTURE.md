# 🏗️ ScanHack Architecture

**Complete technical architecture documentation**

---

## 📐 System Overview

```
┌─────────────────────────┐
│   Frontend (Next.js)    │
│  Internet Identity Auth │
│   QR Scanner + Admin    │
└───────────┬─────────────┘
            │
            │ HTTP/HTTPS
            │
┌───────────▼─────────────┐
│   Backend Canister      │
│   (API Orchestrator)    │
└───────────┬─────────────┘
            │
    ┌───────┼───────┐
    │       │       │
┌───▼───┐ ┌─▼───┐ ┌─▼──────┐
│Registry│ │Missions│ │GrantVault│
│ Canister│ │Canister│ │ Canister │
└────────┘ └──────┘ └─────────┘
```

---

## 🔷 Canister Architecture

### **1. Registry Canister**

**Purpose:** User management and HackPass SBT minting

**Storage:**
- `users: HashMap<UserId, User>` — User registry
- `hackPasses: HashMap<HackPassId, HackPass>` — HackPass SBTs
- `userHackPasses: HashMap<UserId, [HackPassId]>` — User → HackPass mapping

**Key Functions:**
- `register()` — Register new user
- `getOrCreateUser()` — Get or create user
- `mintHackPass(eventId)` — Mint soulbound HackPass SBT
- `getHackPass(userId, eventId)` — Get user's HackPass for event
- `incrementAttestationCount()` — Update attestation count

**SBT Properties:**
- Non-transferable (soulbound)
- One per user per event
- Contains attestation count

---

### **2. Missions Canister**

**Purpose:** Mission management and attestation SBT minting

**Storage:**
- `missions: HashMap<MissionId, Mission>` — Mission definitions
- `attestations: HashMap<AttestationId, Attestation>` — Attestation SBTs
- `usedNonces: HashMap<Nonce, Bool>` — Anti-replay tracking
- `userAttestations: HashMap<UserId, [AttestationId]>` — User → Attestations
- `missionAttestations: HashMap<MissionId, [AttestationId]>` — Mission → Attestations

**Key Functions:**
- `createMission()` — Create new mission
- `validateAndComplete(qrPayload, hackPassId)` — Validate QR and mint attestation
- `getMissions(eventId)` — Get missions for event
- `getUserAttestations(userId)` — Get user's attestations
- `setMissionActive()` — Toggle mission status

**Security:**
- Nonce tracking (anti-replay)
- Signature verification
- Expiration checking
- Double-claim prevention

---

### **3. GrantVault Canister**

**Purpose:** Micro-grant distribution

**Storage:**
- `vaults: HashMap<EventId, Vault>` — Grant vaults per event
- `grants: HashMap<GrantId, Grant>` — Distributed grants
- `userGrants: HashMap<UserId, [GrantId]>` — User → Grants mapping

**Key Functions:**
- `createVault(eventId, initialCycles)` — Create vault for event
- `fundVault(eventId, amount)` — Add cycles to vault
- `distributeGrant(userId, eventId, missionId, amount)` — Distribute grant
- `getVaultBalance(eventId)` — Get available balance
- `getUserGrants(userId)` — Get user's grants

**Cycle Management:**
- Tracks total cycles
- Tracks distributed cycles
- Prevents over-distribution

---

### **4. Backend Canister**

**Purpose:** API orchestrator and QR generation

**Key Functions:**
- `generateQRPayload(eventId, missionId, expiresInSeconds)` — Generate signed QR
- `completeMission(qrPayload)` — Complete mission flow
- `getUserData(eventId?)` — Get orchestrated user data
- `createEvent(eventId, initialVaultCycles)` — Create event

**Orchestration:**
- Coordinates Registry, Missions, GrantVault
- Handles complete mission flow atomically
- Generates signed QR payloads

---

## 🔐 Security Architecture

### **QR Code Security:**

1. **Nonce Generation**
   - Unique per QR code
   - Format: `userId_timestamp_eventId_missionId`
   - Prevents replay attacks

2. **ECDSA Signing**
   - Backend signs QR payload
   - Signature includes: eventId, missionId, nonce
   - Frontend validates signature

3. **Expiration**
   - QR codes expire after set time (default: 1 hour)
   - Prevents use of old QR codes

4. **Nonce Tracking**
   - Missions canister tracks used nonces
   - Prevents double-claiming
   - Nonces cleaned up after expiration

### **SBT Security:**

1. **Soulbound Tokens**
   - HackPass: Non-transferable
   - Attestations: Non-transferable
   - Enforced at canister level

2. **Double-Claim Prevention**
   - On-chain checks before minting
   - User → Mission → Event uniqueness
   - Atomic operations

---

## 🔄 Data Flow

### **Mission Completion Flow:**

```
1. User scans QR code
   ↓
2. Frontend extracts QR payload
   ↓
3. Frontend calls Backend.completeMission(qrPayload)
   ↓
4. Backend validates QR (nonce, signature, expiration)
   ↓
5. Backend gets/creates user in Registry
   ↓
6. Backend gets/creates HackPass in Registry
   ↓
7. Backend calls Missions.validateAndComplete()
   ↓
8. Missions canister:
   - Validates nonce not used
   - Validates signature
   - Checks expiration
   - Prevents double-claim
   - Mints Attestation SBT
   ↓
9. Backend calls GrantVault.distributeGrant()
   ↓
10. GrantVault distributes cycles
   ↓
11. Backend returns result to frontend
   ↓
12. Frontend displays success
```

---

## 📊 Storage Patterns

### **HashMap Usage:**
- O(1) lookup time
- Efficient for canister storage
- No size limits (within canister limits)

### **Array Usage:**
- Used for lists (user attestations, etc.)
- Efficient for iteration
- Can grow dynamically

### **Principal as Key:**
- UserId = Principal (from Internet Identity)
- Unique per user
- Efficient hashing

---

## 🔗 Inter-Canister Calls

### **Registry → Missions:**
- Missions calls Registry.getHackPass()
- Missions calls Registry.incrementAttestationCount()

### **Backend → All:**
- Backend orchestrates all canisters
- Coordinates complete flows
- Handles errors gracefully

### **Missions → GrantVault:**
- Missions can trigger grant distribution
- Or Backend handles distribution

---

## 🚀 Performance Considerations

1. **Canister Storage:**
   - HashMaps for O(1) lookups
   - Arrays for iteration
   - Efficient data structures

2. **Inter-Canister Calls:**
   - Minimize calls where possible
   - Batch operations
   - Handle errors gracefully

3. **Frontend:**
   - Cache canister data
   - Optimistic UI updates
   - Error handling

---

## 📝 Best Practices

1. **Error Handling:**
   - Use Result types
   - Clear error messages
   - Graceful degradation

2. **Security:**
   - Validate all inputs
   - Check permissions
   - Prevent double-claims

3. **Testing:**
   - Unit tests for canisters
   - Integration tests for flows
   - E2E tests for frontend

---

**Architecture designed for scalability, security, and hackathon-ready deployment.**

