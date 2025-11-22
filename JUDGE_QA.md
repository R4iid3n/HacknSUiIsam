# ❓ MODULE 10 — Judge Q&A Cheat Sheet

**LémanFlow - Quick Reference for Hackathon Judge Questions**

This document provides pre-written, technically accurate answers to common questions judges ask during hackathon demos. Familiarize yourself with these answers before your presentation.

---

## Q1. Why did you choose Sui over other chains?

**Answer:**

Because Sui provides three primitives that are critical for this use case: **zkLogin** for Web2-friendly onboarding, **sponsored transactions** for fully gasless user experiences, and **Dynamic Fields** plus an object-centric model that perfectly fits Passports and Attestations.

Most chains don't offer this combination, or require much more complexity to achieve the same UX. For example:
- **Ethereum**: No native zkLogin equivalent; sponsored transactions require complex meta-transaction frameworks
- **Solana**: No object model; all state is account-based, making soulbound credentials harder to model
- **Sui**: Native support for all three, with Move safety guarantees built-in

**Key talking points:**
- zkLogin eliminates wallet setup friction (users login with Google/Facebook)
- Sponsored transactions mean zero gas fees for participants
- Object-centric model makes Passports natural NFT-like objects with Dynamic Fields for attestations

---

## Q2. How do you prevent users from cheating or double-claiming rewards?

**Answer:**

We combine **backend and on-chain protections** for defense-in-depth security:

### Backend Protection:
1. **Signed QR codes**: Each QR embeds a signed nonce + mission_id + event_id using ECDSA, making them cryptographically hard to forge
2. **Nonce tracking**: Backend tracks used nonces in-memory/database to prevent replay attacks
3. **Rate limiting**: API endpoints enforce rate limits to prevent spam

### On-Chain Protection:
Our Move module checks if an Attestation for `(passport, mission_id)` already exists using Dynamic Fields, and **fails the transaction if the attestation already exists**. This provides a final, trust-minimized anti-double-claim guarantee.

```move
// Simplified check in claim_mission function
public entry fun claim_mission(
    event: &mut Event,
    passport: &mut Passport,
    mission_id: u64,
    // ...
) {
    // Check if attestation already exists
    assert!(
        !dynamic_object_field::exists_(&passport.id, mission_id),
        EAttestationAlreadyExists
    );

    // Create attestation and attach to passport
    let attestation = Attestation { /* ... */ };
    dynamic_object_field::add(&mut passport.id, mission_id, attestation);
}
```

**Key talking points:**
- Multi-layer defense (backend + smart contract)
- On-chain verification is the source of truth
- Even if backend is compromised, blockchain prevents double-claims

---

## Q3. Is the Passport really soulbound? Can users transfer it?

**Answer:**

Yes, the Passport is **truly soulbound**. We never expose any `transfer` function for Passport, and all logic checks `TxContext::sender() == passport.owner` for sensitive calls.

```move
public struct Passport has key {
    id: UID,
    owner: address,  // Set at creation, never changed
    created_at: u64,
}

// No transfer function exists
// All operations verify ownership:
public entry fun claim_mission(
    passport: &mut Passport,
    // ...
    ctx: &mut TxContext
) {
    assert!(passport.owner == tx_context::sender(ctx), ENotOwner);
    // ...
}
```

**In practice, the Passport is soulbound because:**
- It can't be transferred by design (no transfer capability in Move)
- Owner address is immutable after creation
- All operations require the original owner's signature

**Optional extensions:**
- If needed for compliance reasons, we could add admin-level `revoke` or `burn` logic
- But we **never** add user-level transfer functionality
- This maintains the soulbound guarantee

**Key talking points:**
- Soulbound by design, not just policy
- Move's type system enforces this at compile time
- Attestations are permanently linked to the owner's identity

---

## Q4. What happens if the sponsor runs out of funds in the GrantPool?

**Answer:**

Our contract tracks `total_funds` and `distributed` in the GrantPool. Before distributing rewards, we check that:

```move
total_funds - distributed >= grant_amount
```

If not, **the transaction aborts** with an error code, preventing any reward distribution when funds are insufficient.

```move
public struct GrantPool has key, store {
    id: UID,
    total_funds: u64,      // Total SUI deposited
    distributed: u64,      // Total SUI already distributed
    sponsor_address: address,
}

public entry fun claim_mission(
    event: &mut Event,
    grant_pool: &mut GrantPool,
    // ...
) {
    let available = grant_pool.total_funds - grant_pool.distributed;
    assert!(available >= mission.reward_amount, EInsufficientFunds);

    // Distribute reward and update distributed amount
    grant_pool.distributed = grant_pool.distributed + mission.reward_amount;
    // ...
}
```

**Organizer notifications:**
- Dashboard shows real-time fund balance: `total_funds - distributed`
- Warning appears when balance drops below threshold (e.g., 20% remaining)
- Organizers can top up the GrantPool anytime via admin API route:
  ```bash
  POST /api/admin/fund-pool
  {
    "eventId": "0x...",
    "amount": 5000000000  // 5 SUI in MIST
  }
  ```

**Key talking points:**
- Fail-safe mechanism prevents over-distribution
- Real-time monitoring in dashboard
- Easy top-up process for organizers
- No user experience degradation (clear error message)

---

## Q5. Can this scale to large events with thousands of users and missions?

**Answer:**

**Yes.** We use **Dynamic Fields** under `Event` to store missions and under `Passport` to store attestations. Dynamic Fields are designed in Sui for scalable, key-addressable storage.

### Why this scales:

1. **Dynamic Fields avoid monolithic storage**
   - Instead of storing all missions in a single vector (O(n) reads), we use key-based access
   - Fetching a mission is O(1) lookup: `dynamic_object_field::borrow<u64, Mission>(&event.id, mission_id)`

2. **Parallel execution model**
   - Sui's object-centric execution allows many users to claim different missions concurrently
   - No contention on a single global state mapping (unlike account-based chains)
   - Each `Passport` object is independently owned, enabling parallel writes

3. **Gas efficiency**
   - Sponsored transactions batch operations efficiently using PTBs (Programmable Transaction Blocks)
   - Backend can submit multiple claims in a single PTB if needed

### Real-world performance estimates:
- **1,000 participants**: No issue, each has independent Passport object
- **100 missions per event**: Dynamic Fields handle this easily (key-value access)
- **10,000 attestations across all users**: Distributed across individual Passport objects
- **Concurrent claims**: Limited only by Sui network throughput (1,000+ TPS on testnet/mainnet)

**Key talking points:**
- Dynamic Fields enable horizontal scaling
- Sui's parallel execution prevents bottlenecks
- No single point of contention in smart contract design

---

## Q6. How hard is this to integrate for an organizer who has never touched Web3?

**Answer:**

**Very easy.** The organizer only interacts with the **Web dashboard or API** — all blockchain complexity is abstracted away.

### Organizer workflow (no Web3 knowledge required):

1. **Create Event** (via Web form):
   - Fill in event name, description, dates
   - Set initial funding amount (in SUI or USD equivalent)
   - Click "Create Event" → Backend handles blockchain deployment

2. **Create Missions** (via Web form):
   - Add mission title, description
   - Set reward amount (e.g., "0.5 SUI")
   - Click "Add Mission" → Automatically added to blockchain

3. **Download QR Codes**:
   - Click "Generate QR" for each mission
   - Download PNG/PDF files
   - Print or display at event locations

4. **Monitor Dashboard**:
   - Real-time stats: missions completed, funds remaining, participant count
   - No need to use blockchain explorers or wallets

### For participants (attendees):
- Login with **Google** (zkLogin, no wallet setup)
- Scan QR codes at event locations
- View earned rewards in "My Passport" page
- **Zero gas fees, zero wallet management**

### Technical abstraction:
- Backend uses **Sui SDK** to build and submit transactions
- Frontend uses **dApp Kit** for wallet connection (optional fallback)
- Smart contracts are pre-deployed and managed automatically
- All blockchain operations happen invisibly in the background

**Key talking points:**
- "It's like creating a Typeform or Eventbrite — just fill out forms"
- No crypto terminology exposed to organizers
- Participants never see "gas", "transactions", or "wallets"
- Web2 UX with Web3 security and verifiability

---

## Q7. What's your long-term vision beyond hackathons?

**Answer:**

LémanFlow is a **generic "on-chain engagement and proof-of-participation layer"**. While we started with hackathons, the same infrastructure extends naturally to many other use cases:

### Immediate Extensions:

1. **Conferences & Trade Shows**
   - Missions: Attend keynote, visit sponsor booths, network with speakers
   - Rewards: Conference swag tokens, raffle entries, premium content access
   - Proof: Verifiable attendance credentials for sponsors and organizers

2. **Universities & Educational Programs**
   - Missions: Complete course modules, submit projects, attend study groups
   - Rewards: Academic credits (as NFTs), scholarship eligibility, career badges
   - Proof: Tamper-proof academic transcripts on-chain

3. **Music Festivals & Cultural Events**
   - Missions: Volunteer shifts, artist meet-and-greets, stage performances
   - Rewards: VIP access tokens, artist merchandise, future event discounts
   - Proof: Verifiable volunteer hours for non-profits

4. **Corporate Innovation Programs**
   - Missions: Internal hackathons, training completion, KPI achievements
   - Rewards: Performance bonuses, promotion points, team budgets
   - Proof: Cross-company credential portability (like LinkedIn, but verifiable)

### Long-Term Vision:

**The Passport becomes a long-term credential portfolio**, similar to a verifiable resume:
- Aggregates achievements across all events and organizations
- Portable across platforms (Sui blockchain as source of truth)
- Enables reputation-based access (e.g., "Must have 5 hackathon attestations to apply")
- Composable with DeFi (e.g., use Passport as collateral for micro-loans)

**Sui becomes the backbone of verifiable participation**, enabling:
- **Trust-minimized hiring** (employers verify credentials on-chain)
- **Decentralized reputation systems** (no single platform controls your history)
- **Incentive alignment** (organizations reward meaningful engagement, not vanity metrics)

### Monetization Strategy:
- **Freemium model**: Free for small events (<100 participants), paid tiers for enterprises
- **Transaction fees**: Small percentage of GrantPool funds (e.g., 2-5%)
- **White-label licensing**: Branded versions for universities, corporations, DAOs
- **Data analytics**: Aggregated (privacy-preserving) insights for organizers

**Key talking points:**
- "We're building the LinkedIn of on-chain credentials"
- "Hackathons are just the entry point — total addressable market is all professional/educational engagement"
- "Sui's zkLogin + sponsored transactions make this accessible to billions of Web2 users"
- "This is infrastructure for the creator economy and future of work"

---

## 🎯 Quick Reference Card

Print this and keep it with you during the demo:

| **Question** | **30-Second Answer** |
|--------------|---------------------|
| Why Sui? | zkLogin + sponsored transactions + Dynamic Fields = perfect UX for soulbound credentials |
| Anti-cheat? | Signed QR codes (backend) + on-chain double-claim prevention (Move contract) |
| Soulbound? | No transfer function in Move, owner address immutable, enforced at type system level |
| Out of funds? | Contract checks `total_funds - distributed >= reward`, aborts if insufficient |
| Scalability? | Dynamic Fields + parallel execution = thousands of users, zero bottlenecks |
| Organizer UX? | Web forms only, no crypto knowledge needed, backend abstracts blockchain |
| Vision? | On-chain engagement layer for conferences, universities, festivals, corporations |

---

## 🚨 Difficult Questions & How to Handle Them

### Q: "Couldn't you just use a centralized database?"

**Answer:**
Yes, but you'd lose three critical properties:
1. **Verifiability**: Participants can prove their achievements to third parties without trusting us
2. **Portability**: Credentials live on Sui blockchain, not locked in our database
3. **Composability**: Other dApps can build on top of Passports (e.g., scholarship DAOs)

The point isn't to replace databases for data storage — it's to create **publicly verifiable, user-owned credentials** that persist beyond any single platform.

---

### Q: "What if Sui goes down or gets congested?"

**Answer:**
Sui has demonstrated high uptime on mainnet (>99.9%). If there's temporary congestion:
- Our backend queues transactions and retries with exponential backoff
- Users see "Transaction pending..." status, not errors
- We can enable **Mock Mode** during demos to simulate instant success

For production, we'd add:
- Multi-chain deployment (Sui as primary, fallback to Aptos/Movement)
- Off-chain caching of critical data (with on-chain sync)
- Progressive enhancement (app works in degraded mode if blockchain is down)

---

### Q: "How do you plan to make money?"

**Answer:**
See "Monetization Strategy" in Q7 above. TL;DR:
- Freemium model (free for small events, paid for enterprises)
- Small transaction fees (2-5% of GrantPool)
- White-label licensing for universities/corporations

We're currently focused on product-market fit for hackathons. Revenue will come from B2B sales to enterprises and universities who value verifiable credentials.

---

### Q: "What's your unfair advantage / moat?"

**Answer:**
1. **First-mover advantage on Sui**: We're one of the first production zkLogin + sponsored transaction apps
2. **Network effects**: As more events use LémanFlow, Passports become more valuable (credential aggregation)
3. **Technical expertise**: Deep understanding of Move, PTBs, Dynamic Fields, and Sui's object model
4. **Integration ecosystem**: Partnerships with hackathon platforms (MLH, Devpost, DoraHacks)

Our moat is **the Passport network**: once you have credentials from 5 events, you won't switch to a competitor's platform.

---

## 📚 Technical Deep-Dive References

If judges ask for more technical detail, point them to:

- **Move Smart Contracts**: `contracts/sources/lemanflow_v2.move`
- **Backend API**: `backend/src/routes/` (Fastify + Sui SDK)
- **Frontend**: `frontend/src/pages/` (React + dApp Kit)
- **SUI Features Doc**: `SUI_FEATURES.md` (8 native features we use)
- **Native Features Doc**: `NATIVE_FEATURES.md` (detailed integration guide)
- **Architecture**: See "How We Built It" section in `SUBMISSION.md`

---

## ✅ Pre-Demo Checklist

Review these answers 15 minutes before your presentation:

- [ ] Read Q1-Q7 answers at least once
- [ ] Memorize 30-second answers from Quick Reference Card
- [ ] Practice saying "zkLogin, sponsored transactions, Dynamic Fields" smoothly
- [ ] Know how to pull up `lemanflow_v2.move` if asked for code
- [ ] Have `SUBMISSION.md` open in a browser tab for reference
- [ ] Prepare 1-2 sentence personal story (why you built this)

---

## 🎬 Bonus: Handling Non-Technical Judges

If judges aren't technical (e.g., business-focused or designers):

**Reframe answers to focus on impact:**
- ❌ "We use Dynamic Fields for O(1) key-value access"
- ✅ "Each participant gets their own digital credential wallet, like a LinkedIn profile on the blockchain"

**Use analogies:**
- zkLogin = "Login with Google, but you actually own your account"
- Sponsored transactions = "Event organizer pays gas fees, like a company pays for Zoom"
- Soulbound Passport = "Like a diploma — you can't transfer it to someone else"

**Emphasize user experience:**
- "Participants never see crypto wallets or gas fees"
- "Organizers just fill out a web form, like Eventbrite"
- "Everything looks like a normal website, but credentials are verifiable forever"

---

**Good luck with your demo! 🚀**

Remember: **Confidence > perfection**. If you don't know an answer, say *"That's a great question — we haven't implemented that yet, but here's how I'd approach it..."* and propose a solution on the spot. Judges value problem-solving ability more than having every feature ready.
