import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

// Import other canisters
import Missions "canister:missions";

actor GrantVault {
  // Types
  public type EventId = Text;
  public type UserId = Principal;
  public type GrantId = Text;
  
  public type Vault = {
    eventId: EventId;
    totalCycles: Nat;
    distributedCycles: Nat;
    createdAt: Nat64;
  };

  public type Grant = {
    id: GrantId;
    userId: UserId;
    eventId: EventId;
    amount: Nat;
    missionId: Text;
    distributedAt: Nat64;
  };

  // Storage
  private var vaults = HashMap.HashMap<EventId, Vault>(0, Text.equal, Text.hash);
  private var grants = HashMap.HashMap<GrantId, Grant>(0, Text.equal, Text.hash);
  private var userGrants = HashMap.HashMap<UserId, [GrantId]>(0, Principal.equal, Principal.hash);

  // Create vault for event
  public shared(msg) func createVault(eventId: EventId, initialCycles: Nat): async Result.Result<Vault, Text> {
    // In production, verify admin
    switch (vaults.get(eventId)) {
      case (?existing) {
        return #err("Vault already exists for this event");
      };
      case null {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let vault: Vault = {
          eventId = eventId;
          totalCycles = initialCycles;
          distributedCycles = 0;
          createdAt = now;
        };
        
        vaults.put(eventId, vault);
        return #ok(vault);
      };
    };
  };

  // Fund vault (add cycles)
  public shared(msg) func fundVault(eventId: EventId, amount: Nat): async Result.Result<Vault, Text> {
    switch (vaults.get(eventId)) {
      case (?vault) {
        let updated: Vault = {
          eventId = vault.eventId;
          totalCycles = vault.totalCycles + amount;
          distributedCycles = vault.distributedCycles;
          createdAt = vault.createdAt;
        };
        vaults.put(eventId, updated);
        return #ok(updated);
      };
      case null {
        return #err("Vault not found");
      };
    };
  };

  // Distribute grant (called after attestation minted)
  public shared(msg) func distributeGrant(
    userId: UserId,
    eventId: EventId,
    missionId: Text,
    amount: Nat
  ): async Result.Result<Grant, Text> {
    // Verify caller is missions canister (in production, add proper auth)
    
    // Get vault
    let vault = switch (vaults.get(eventId)) {
      case (?v) { v };
      case null {
        return #err("Vault not found for this event");
      };
    };
    
    // Check sufficient balance
    let available = vault.totalCycles - vault.distributedCycles;
    if (available < amount) {
      return #err("Insufficient cycles in vault");
    };
    
    // Create grant
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let grantId = Principal.toText(userId) # "_" # eventId # "_" # missionId # "_" # Nat64.toText(now);
    
    let grant: Grant = {
      id = grantId;
      userId = userId;
      eventId = eventId;
      amount = amount;
      missionId = missionId;
      distributedAt = now;
    };
    
    grants.put(grantId, grant);
    
    // Update user grants
    let existingGrants = switch (userGrants.get(userId)) {
      case (?g) { g };
      case null { [] };
    };
    userGrants.put(userId, Array.append(existingGrants, [grantId]));
    
    // Update vault
    let updatedVault: Vault = {
      eventId = vault.eventId;
      totalCycles = vault.totalCycles;
      distributedCycles = vault.distributedCycles + amount;
      createdAt = vault.createdAt;
    };
    vaults.put(eventId, updatedVault);
    
    return #ok(grant);
  };

  // Get vault balance
  public query func getVaultBalance(eventId: EventId): async ?Nat {
    switch (vaults.get(eventId)) {
      case (?vault) {
        return ?(vault.totalCycles - vault.distributedCycles);
      };
      case null {
        return null;
      };
    };
  };

  // Get user grants
  public query func getUserGrants(userId: UserId): async [Grant] {
    let grantIds = switch (userGrants.get(userId)) {
      case (?ids) { ids };
      case null { [] };
    };
    
    Array.mapFilter(
      grantIds,
      func(id: GrantId): ?Grant { grants.get(id) }
    )
  };

  // Get vault
  public query func getVault(eventId: EventId): async ?Vault {
    vaults.get(eventId)
  };
};

