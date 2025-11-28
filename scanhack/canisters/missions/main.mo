import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Option "mo:base/Option";

// Import Registry canister
import Registry "canister:registry";

actor Missions {
  // Types
  public type MissionId = Text;
  public type EventId = Text;
  public type AttestationId = Text;
  public type UserId = Principal;
  public type HackPassId = Text;
  public type Nonce = Text;
  public type Signature = Blob;

  public type Mission = {
    id: MissionId;
    eventId: EventId;
    title: Text;
    description: Text;
    rewardAmount: Nat;
    active: Bool;
    completions: Nat;
    createdAt: Nat64;
  };

  public type Attestation = {
    id: AttestationId;
    userId: UserId;
    hackPassId: HackPassId;
    missionId: MissionId;
    eventId: EventId;
    completedAt: Nat64;
    rewardAmount: Nat;
    // SBT: non-transferable
  };

  public type QRPayload = {
    eventId: EventId;
    missionId: MissionId;
    nonce: Nonce;
    signature: Signature;
    expiresAt: Nat64;
  };

  // Storage
  private var missions = HashMap.HashMap<MissionId, Mission>(0, Text.equal, Text.hash);
  private var attestations = HashMap.HashMap<AttestationId, Attestation>(0, Text.equal, Text.hash);
  private var usedNonces = HashMap.HashMap<Nonce, Bool>(0, Text.equal, Text.hash);
  private var userAttestations = HashMap.HashMap<UserId, [AttestationId]>(0, Principal.equal, Principal.hash);
  private var missionAttestations = HashMap.HashMap<MissionId, [AttestationId]>(0, Text.equal, Text.hash);

  // Admin: Create event (simplified - in production, add proper admin auth)
  private let adminPrincipal: ?Principal = null; // Set in production

  // Create mission
  public shared(msg) func createMission(
    eventId: EventId,
    title: Text,
    description: Text,
    rewardAmount: Nat
  ): async Result.Result<Mission, Text> {
    // In production, verify admin
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let missionId = eventId # "_" # Nat64.toText(now) # "_" # Principal.toText(msg.caller);
    
    let mission: Mission = {
      id = missionId;
      eventId = eventId;
      title = title;
      description = description;
      rewardAmount = rewardAmount;
      active = true;
      completions = 0;
      createdAt = now;
    };
    
    missions.put(missionId, mission);
    missionAttestations.put(missionId, []);
    
    return #ok(mission);
  };

  // Validate QR and complete mission
  public shared(msg) func validateAndComplete(
    qrPayload: QRPayload,
    hackPassId: HackPassId
  ): async Result.Result<Attestation, Text> {
    let userId = msg.caller;
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    // 1. Check nonce not used (anti-replay)
    switch (usedNonces.get(qrPayload.nonce)) {
      case (?true) {
        return #err("Nonce already used");
      };
      case null {};
    };
    
    // 2. Check expiration
    if (now > qrPayload.expiresAt) {
      return #err("QR code expired");
    };
    
    // 3. Verify signature (simplified - in production, use proper ECDSA)
    // For now, we trust the backend that generated the QR
    
    // 4. Get mission
    let mission = switch (missions.get(qrPayload.missionId)) {
      case (?m) { m };
      case null {
        return #err("Mission not found");
      };
    };
    
    // 5. Verify mission is active
    if (not mission.active) {
      return #err("Mission is not active");
    };
    
    // 6. Verify eventId matches
    if (mission.eventId != qrPayload.eventId) {
      return #err("Event ID mismatch");
    };
    
    // 7. Get HackPass
    let hackPass = switch (await Registry.getHackPass(userId, qrPayload.eventId)) {
      case (?hp) { hp };
      case null {
        return #err("HackPass not found for this event");
      };
    };
    
    // 8. Check if attestation already exists (anti-double-claim)
    let existingAttestations = switch (userAttestations.get(userId)) {
      case (?atts) { atts };
      case null { [] };
    };
    
    for (attId in existingAttestations.vals()) {
      switch (attestations.get(attId)) {
        case (?att) {
          if (att.missionId == qrPayload.missionId and att.eventId == qrPayload.eventId) {
            return #err("Mission already completed");
          };
        };
        case null {};
      };
    };
    
    // 9. Create attestation
    let attestationId = hackPassId # "_" # qrPayload.missionId # "_" # Nat64.toText(now);
    
    let attestation: Attestation = {
      id = attestationId;
      userId = userId;
      hackPassId = hackPassId;
      missionId = qrPayload.missionId;
      eventId = qrPayload.eventId;
      completedAt = now;
      rewardAmount = mission.rewardAmount;
    };
    
    attestations.put(attestationId, attestation);
    
    // 10. Update nonce tracking
    usedNonces.put(qrPayload.nonce, true);
    
    // 11. Update user attestations
    let updatedUserAtts = Array.append(existingAttestations, [attestationId]);
    userAttestations.put(userId, updatedUserAtts);
    
    // 12. Update mission attestations
    let existingMissionAtts = switch (missionAttestations.get(qrPayload.missionId)) {
      case (?atts) { atts };
      case null { [] };
    };
    missionAttestations.put(qrPayload.missionId, Array.append(existingMissionAtts, [attestationId]));
    
    // 13. Update mission completions
    let updatedMission: Mission = {
      id = mission.id;
      eventId = mission.eventId;
      title = mission.title;
      description = mission.description;
      rewardAmount = mission.rewardAmount;
      active = mission.active;
      completions = mission.completions + 1;
      createdAt = mission.createdAt;
    };
    missions.put(qrPayload.missionId, updatedMission);
    
    // 14. Increment HackPass attestation count
    ignore await Registry.incrementAttestationCount(hackPassId);
    
    return #ok(attestation);
  };

  // Get missions for event
  public query func getMissions(eventId: EventId): async [Mission] {
    Array.filter(
      Iter.toArray(missions.vals()),
      func(m: Mission): Bool { m.eventId == eventId }
    )
  };

  // Get user attestations
  public query func getUserAttestations(userId: UserId): async [Attestation] {
    let attIds = switch (userAttestations.get(userId)) {
      case (?ids) { ids };
      case null { [] };
    };
    
    Array.mapFilter(
      attIds,
      func(id: AttestationId): ?Attestation { attestations.get(id) }
    )
  };

  // Get mission
  public query func getMission(missionId: MissionId): async ?Mission {
    missions.get(missionId)
  };

  // Admin: Toggle mission active status
  public shared(msg) func setMissionActive(missionId: MissionId, active: Bool): async Result.Result<(), Text> {
    // In production, verify admin
    switch (missions.get(missionId)) {
      case (?mission) {
        let updated: Mission = {
          id = mission.id;
          eventId = mission.eventId;
          title = mission.title;
          description = mission.description;
          rewardAmount = mission.rewardAmount;
          active = active;
          completions = mission.completions;
          createdAt = mission.createdAt;
        };
        missions.put(missionId, updated);
        return #ok(());
      };
      case null {
        return #err("Mission not found");
      };
    };
  };
};

