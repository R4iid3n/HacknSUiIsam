import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Array "mo:base/Array";

// Import canisters
import Registry "canister:registry";
import Missions "canister:missions";
import GrantVault "canister:grantvault";

actor Backend {
  // Types
  public type EventId = Text;
  public type MissionId = Text;
  public type UserId = Principal;
  public type Nonce = Text;
  public type Signature = Blob;

  public type QRPayload = {
    eventId: EventId;
    missionId: MissionId;
    nonce: Nonce;
    signature: Signature;
    expiresAt: Nat64;
  };

  // Private key for signing (in production, use secure key management)
  private let signingKey: Text = "scanhack_secret_key_change_in_production";

  // Generate QR payload with signature
  public shared(msg) func generateQRPayload(
    eventId: EventId,
    missionId: MissionId,
    expiresInSeconds: Nat64
  ): async Result.Result<QRPayload, Text> {
    // In production, verify admin/auth
    
    // Generate nonce
    let nonce = Principal.toText(msg.caller) # "_" # Nat64.toText(Nat64.fromNat(Int.abs(Time.now()))) # "_" # Text.concat(eventId, missionId);
    
    // Create signature (simplified - in production, use proper ECDSA)
    let signatureData = Text.concat(Text.concat(eventId, missionId), nonce);
    let signature = Blob.fromArray(Array.tabulate<Nat8>(signatureData.size(), func(i) {
      let char = Text.char(signatureData, i);
      // Simplified signature generation
      Principal.toBlob(msg.caller)[0]
    }));
    
    // Calculate expiration
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let expiresAt = now + (expiresInSeconds * 1_000_000_000); // Convert to nanoseconds
    
    let payload: QRPayload = {
      eventId = eventId;
      missionId = missionId;
      nonce = nonce;
      signature = signature;
      expiresAt = expiresAt;
    };
    
    return #ok(payload);
  };

  // Complete mission flow (orchestrator)
  public shared(msg) func completeMission(
    qrPayload: QRPayload
  ): async Result.Result<{
    attestation: Missions.Attestation;
    grant: ?GrantVault.Grant;
  }, Text> {
    let userId = msg.caller;
    
    // 1. Get or create user
    let user = await Registry.getOrCreateUser();
    
    // 2. Get or create HackPass for event
    let hackPassResult = await Registry.mintHackPass(qrPayload.eventId);
    let hackPassId = switch (hackPassResult) {
      case (#ok(hp)) { hp.id };
      case (#err(_)) {
        // Try to get existing
        switch (await Registry.getHackPass(userId, qrPayload.eventId)) {
          case (?hp) { hp.id };
          case null {
            return #err("Failed to get or create HackPass");
          };
        };
      };
    };
    
    // 3. Validate and complete mission
    let attestationResult = await Missions.validateAndComplete(qrPayload, hackPassId);
    
    switch (attestationResult) {
      case (#ok(attestation)) {
        // 4. Distribute grant if reward amount > 0
        var grant: ?GrantVault.Grant = null;
        if (attestation.rewardAmount > 0) {
          let grantResult = await GrantVault.distributeGrant(
            userId,
            qrPayload.eventId,
            attestation.missionId,
            attestation.rewardAmount
          );
          
          switch (grantResult) {
            case (#ok(g)) { grant := ?g };
            case (#err(_)) {
              // Grant distribution failed, but attestation is minted
              // Log error in production
            };
          };
        };
        
        return #ok({
          attestation = attestation;
          grant = grant;
        });
      };
      case (#err(err)) {
        return #err(err);
      };
    };
  };

  // Get user data (orchestrated)
  public shared(msg) func getUserData(eventId: ?EventId): async {
    user: Registry.User;
    hackPass: ?Registry.HackPass;
    attestations: [Missions.Attestation];
    grants: [GrantVault.Grant];
  } {
    let userId = msg.caller;
    
    // Get user
    let user = await Registry.getOrCreateUser();
    
    // Get HackPass if eventId provided
    var hackPass: ?Registry.HackPass = null;
    switch (eventId) {
      case (?eid) {
        hackPass := await Registry.getHackPass(userId, eid);
      };
      case null {};
    };
    
    // Get attestations
    let attestations = await Missions.getUserAttestations(userId);
    
    // Get grants
    let grants = await GrantVault.getUserGrants(userId);
    
    return {
      user = user;
      hackPass = hackPass;
      attestations = attestations;
      grants = grants;
    };
  };

  // Admin: Create event (simplified)
  public shared(msg) func createEvent(
    eventId: EventId,
    initialVaultCycles: Nat
  ): async Result.Result<(), Text> {
    // In production, verify admin
    
    // Create vault
    let vaultResult = await GrantVault.createVault(eventId, initialVaultCycles);
    
    switch (vaultResult) {
      case (#ok(_)) { return #ok(()); };
      case (#err(err)) { return #err(err); };
    };
  };
};

