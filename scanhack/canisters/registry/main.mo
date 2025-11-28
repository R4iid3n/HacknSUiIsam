import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Iter "mo:base/Iter";

actor Registry {
  // Types
  public type UserId = Principal;
  public type EventId = Text;
  public type HackPassId = Text;
  
  public type User = {
    id: UserId;
    createdAt: Nat64;
    hackPasses: [HackPassId];
  };

  public type HackPass = {
    id: HackPassId;
    userId: UserId;
    eventId: EventId;
    createdAt: Nat64;
    attestationCount: Nat;
    // Soulbound: non-transferable
  };

  // Storage
  private var users = HashMap.HashMap<UserId, User>(0, Principal.equal, Principal.hash);
  private var hackPasses = HashMap.HashMap<HackPassId, HackPass>(0, Text.equal, Text.hash);
  private var userHackPasses = HashMap.HashMap<UserId, [HackPassId]>(0, Principal.equal, Principal.hash);

  // Events
  public type UserRegistered = {
    userId: UserId;
    timestamp: Nat64;
  };

  public type HackPassMinted = {
    hackPassId: HackPassId;
    userId: UserId;
    eventId: EventId;
    timestamp: Nat64;
  };

  // Register user (called on first interaction)
  public shared(msg) func register(): async Result.Result<User, Text> {
    let userId = msg.caller;
    
    switch (users.get(userId)) {
      case (?existing) {
        return #ok(existing);
      };
      case null {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let user: User = {
          id = userId;
          createdAt = now;
          hackPasses = [];
        };
        
        users.put(userId, user);
        userHackPasses.put(userId, []);
        
        return #ok(user);
      };
    };
  };

  // Get or create user
  public shared(msg) func getOrCreateUser(): async User {
    let userId = msg.caller;
    
    switch (users.get(userId)) {
      case (?user) { return user; };
      case null {
        let result = await register();
        switch (result) {
          case (#ok(user)) { return user; };
          case (#err(_)) { 
            // Should not happen, but return minimal user
            let now = Nat64.fromNat(Int.abs(Time.now()));
            return {
              id = userId;
              createdAt = now;
              hackPasses = [];
            };
          };
        };
      };
    };
  };

  // Mint HackPass (SBT) for an event
  public shared(msg) func mintHackPass(eventId: EventId): async Result.Result<HackPass, Text> {
    let userId = msg.caller;
    
    // Ensure user exists
    let user = await getOrCreateUser();
    
    // Check if HackPass already exists for this event
    let existingPasses = switch (userHackPasses.get(userId)) {
      case (?passes) { passes };
      case null { [] };
    };
    
    // Check if user already has a HackPass for this event
    for (passId in existingPasses.vals()) {
      switch (hackPasses.get(passId)) {
        case (?pass) {
          if (pass.eventId == eventId) {
            return #err("HackPass already exists for this event");
          };
        };
        case null {};
      };
    };
    
    // Create new HackPass
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let hackPassId = Principal.toText(userId) # "_" # eventId # "_" # Nat64.toText(now);
    
    let hackPass: HackPass = {
      id = hackPassId;
      userId = userId;
      eventId = eventId;
      createdAt = now;
      attestationCount = 0;
    };
    
    hackPasses.put(hackPassId, hackPass);
    
    // Update user's HackPass list
    let updatedPasses = Array.append(existingPasses, [hackPassId]);
    userHackPasses.put(userId, updatedPasses);
    
    // Update user
    let updatedUser: User = {
      id = user.id;
      createdAt = user.createdAt;
      hackPasses = updatedPasses;
    };
    users.put(userId, updatedUser);
    
    return #ok(hackPass);
  };

  // Get user's HackPass for an event
  public query func getHackPass(userId: UserId, eventId: EventId): async ?HackPass {
    let passes = switch (userHackPasses.get(userId)) {
      case (?p) { p };
      case null { return null };
    };
    
    for (passId in passes.vals()) {
      switch (hackPasses.get(passId)) {
        case (?pass) {
          if (pass.eventId == eventId) {
            return ?pass;
          };
        };
        case null {};
      };
    };
    
    return null;
  };

  // Get user
  public query func getUser(userId: UserId): async ?User {
    return users.get(userId);
  };

  // Increment attestation count (called by missions canister)
  public shared(msg) func incrementAttestationCount(hackPassId: HackPassId): async Result.Result<(), Text> {
    switch (hackPasses.get(hackPassId)) {
      case (?pass) {
        // Verify caller is missions canister (in production, add proper auth)
        let updatedPass: HackPass = {
          id = pass.id;
          userId = pass.userId;
          eventId = pass.eventId;
          createdAt = pass.createdAt;
          attestationCount = pass.attestationCount + 1;
        };
        hackPasses.put(hackPassId, updatedPass);
        return #ok(());
      };
      case null {
        return #err("HackPass not found");
      };
    };
  };

  // Query functions
  public query func getAllUsers(): async [User] {
    Iter.toArray(users.vals())
  };

  public query func getAllHackPasses(): async [HackPass] {
    Iter.toArray(hackPasses.vals())
  };
};

