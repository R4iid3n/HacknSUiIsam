# 🔄 ScanHack User Flow

**Complete user journey documentation**

---

## 👤 Participant Flow

### **1. First-Time User**

```
1. User visits ScanHack
   ↓
2. Clicks "Login with Internet Identity"
   ↓
3. Internet Identity popup appears
   ↓
4. User authenticates (Face ID / Touch ID / Passkey)
   ↓
5. User automatically registered in Registry canister
   ↓
6. Redirected to Dashboard
```

**Time:** ~10 seconds  
**Friction:** Zero (no wallet, no seed phrase)

---

### **2. Event Participation**

```
1. User selects event from Dashboard
   ↓
2. System checks for HackPass
   ↓
3. If no HackPass → Mint HackPass SBT automatically
   ↓
4. Display missions for event
   ↓
5. User sees mission list with status
```

**HackPass:**
- Soulbound SBT (non-transferable)
- One per user per event
- Contains attestation count
- Permanent on-chain record

---

### **3. Mission Completion**

```
1. User goes to mission location
   ↓
2. Organizer shows QR code (printed or screen)
   ↓
3. User opens ScanHack app
   ↓
4. User clicks "Scan QR"
   ↓
5. Camera opens
   ↓
6. User points camera at QR code
   ↓
7. QR code detected and decoded
   ↓
8. Frontend extracts QR payload:
   - eventId
   - missionId
   - nonce
   - signature
   - expiresAt
   ↓
9. Frontend calls Backend.completeMission(qrPayload)
   ↓
10. Backend validates:
    - Nonce not used
    - Signature valid
    - Not expired
    ↓
11. Backend gets/creates HackPass
   ↓
12. Backend calls Missions.validateAndComplete()
   ↓
13. Missions canister:
    - Validates nonce (anti-replay)
    - Validates signature
    - Checks expiration
    - Prevents double-claim
    - Mints Attestation SBT
    ↓
14. Backend calls GrantVault.distributeGrant()
   ↓
15. Grant distributed (if reward > 0)
   ↓
16. Success message displayed
   ↓
17. User sees new Attestation in Passport
```

**Time:** ~5-10 seconds  
**Friction:** Zero (just scan)

---

### **4. View Passport**

```
1. User clicks "My Passport"
   ↓
2. System fetches:
   - User data
   - HackPasses
   - Attestations
   - Grants
   ↓
3. Display:
   - All HackPasses (one per event)
   - All Attestations (missions completed)
   - Total rewards earned
   - On-chain proof links
```

**Features:**
- NFT-style cards
- Event grouping
- Timestamp display
- Reward amounts
- Explorer links

---

## 👨‍💼 Organizer Flow

### **1. Create Event**

```
1. Organizer logs in (admin)
   ↓
2. Clicks "Create Event"
   ↓
3. Fills form:
   - Event name
   - Description
   - Start date
   - End date
   - Initial vault funding
   ↓
4. Backend creates:
   - Event record
   - GrantVault with cycles
   ↓
5. Event created, ready for missions
```

---

### **2. Create Mission**

```
1. Organizer selects event
   ↓
2. Clicks "Add Mission"
   ↓
3. Fills form:
   - Mission title
   - Description
   - Reward amount (cycles)
   ↓
4. Mission created in Missions canister
   ↓
5. Mission appears in list
```

---

### **3. Generate QR Code**

```
1. Organizer selects mission
   ↓
2. Clicks "Generate QR"
   ↓
3. Backend generates:
   - Unique nonce
   - ECDSA signature
   - Expiration timestamp
   ↓
4. QR code displayed
   ↓
5. Organizer:
   - Downloads QR (PNG)
   - Prints QR
   - Displays at mission location
```

**QR Properties:**
- Signed with ECDSA
- Unique nonce (anti-replay)
- Expires after 1 hour (configurable)
- Contains: eventId, missionId, nonce, signature

---

### **4. Monitor Event**

```
1. Organizer views Dashboard
   ↓
2. Sees:
   - Total participants
   - Missions completed
   - Grants distributed
   - Vault balance
   - Real-time stats
```

---

## 🔐 Security Flow

### **QR Validation:**

```
1. QR scanned
   ↓
2. Extract payload
   ↓
3. Check expiration (expiresAt > now)
   ↓
4. Check nonce not used (Missions canister)
   ↓
5. Verify signature (ECDSA)
   ↓
6. Validate eventId matches mission
   ↓
7. All checks pass → Proceed
```

**Failures:**
- Expired → Error: "QR code expired"
- Nonce used → Error: "QR code already used"
- Invalid signature → Error: "Invalid QR code"
- Event mismatch → Error: "Event ID mismatch"

---

## 📊 Analytics Flow

### **Real-Time Metrics:**

```
1. User completes mission
   ↓
2. Attestation minted
   ↓
3. Grant distributed
   ↓
4. Events emitted:
   - MissionCompleted
   - AttestationMinted
   - GrantDistributed
   ↓
5. Dashboard updates:
   - Completion count
   - Reward distribution
   - User statistics
```

---

## 🎯 Key User Experience Points

### **Zero Friction:**
- ✅ No wallet setup
- ✅ No seed phrases
- ✅ No gas fees
- ✅ Instant rewards
- ✅ Simple QR scan

### **Transparency:**
- ✅ On-chain attestations
- ✅ Verifiable credentials
- ✅ Explorer links
- ✅ Permanent records

### **Security:**
- ✅ Cryptographic signatures
- ✅ Anti-replay protection
- ✅ Double-claim prevention
- ✅ Soulbound tokens

---

**User flow designed for maximum adoption with zero friction.**

