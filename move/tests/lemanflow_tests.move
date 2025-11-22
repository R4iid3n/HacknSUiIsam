// LémanFlow Tests
// Unit tests for event, mission, and passport modules

#[test_only]
module sui_hackathon::lemanflow_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui_hackathon::event::{Self, Event, EventAdminCap};
    use sui_hackathon::mission::{Self};
    use sui_hackathon::passport::{Self, Passport};

    // Test addresses
    const ORGANIZER: address = @0xA;
    const USER1: address = @0xB;
    const USER2: address = @0xC;

    // Helper: Create test scenario
    fun setup_test(): Scenario {
        ts::begin(ORGANIZER)
    }

    // Helper: Create event
    fun create_test_event(scenario: &mut Scenario): (address, address) {
        ts::next_tx(scenario, ORGANIZER);
        {
            event::create_event(
                b"Test Hackathon",
                b"A test event for unit tests",
                0,
                1000000,
                ts::ctx(scenario)
            );
        };

        // Get created objects
        ts::next_tx(scenario, ORGANIZER);
        let event_id = {
            let event = ts::take_shared<Event>(scenario);
            let id = object::id_address(&event);
            ts::return_shared(event);
            id
        };

        let admin_cap_id = {
            let admin_cap = ts::take_from_sender<EventAdminCap>(scenario);
            let id = object::id_address(&admin_cap);
            ts::return_to_sender(scenario, admin_cap);
            id
        };

        (event_id, admin_cap_id)
    }

    #[test]
    fun test_create_event() {
        let mut scenario = setup_test();

        // Create event
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            event::create_event(
                b"SUI Hackathon 2025",
                b"Build on SUI blockchain",
                1000,
                2000,
                ts::ctx(&mut scenario)
            );
        };

        // Verify event was created
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let event = ts::take_shared<Event>(&scenario);

            assert!(event::get_name(&event) == std::string::utf8(b"SUI Hackathon 2025"), 0);
            assert!(event::get_organizer(&event) == ORGANIZER, 1);
            assert!(event::is_active(&event) == true, 2);
            assert!(event::get_total_missions(&event) == 0, 3);
            assert!(event::get_grant_pool_balance(&event) == 0, 4);

            ts::return_shared(event);
        };

        // Verify admin cap was created
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_fund_event() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Fund event with 1 SUI
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1_000_000_000, ts::ctx(&mut scenario));

            event::fund_event(&mut event, payment);

            assert!(event::get_grant_pool_balance(&event) == 1_000_000_000, 0);

            ts::return_shared(event);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_register_passport() {
        let mut scenario = setup_test();

        // Register passport for USER1
        ts::next_tx(&mut scenario, USER1);
        {
            passport::register_passport(
                USER1,
                12345, // timestamp
                ts::ctx(&mut scenario)
            );
        };

        // Verify passport was created and transferred to USER1
        ts::next_tx(&mut scenario, USER1);
        {
            let user_passport = ts::take_from_sender<Passport>(&scenario);

            assert!(passport::get_owner(&user_passport) == USER1, 0);
            assert!(passport::get_created_at(&user_passport) == 12345, 1);
            assert!(passport::get_attestation_count(&user_passport) == 0, 2);

            ts::return_to_sender(&scenario, user_passport);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_create_mission() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Create mission
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            let mut event = ts::take_shared<Event>(&scenario);

            mission::create_mission(
                &admin_cap,
                &mut event,
                b"Check-in Mission",
                b"Scan QR code at entrance",
                100_000_000, // 0.1 SUI reward
                b"secret_hash_12345678901234567890", // 32 bytes
                ts::ctx(&mut scenario)
            );

            assert!(event::get_total_missions(&event) == 1, 0);

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(event);
        };

        // Verify mission exists
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let event = ts::take_shared<Event>(&scenario);

            assert!(mission::mission_exists(&event, 0), 0);

            let mission_ref = mission::get_mission(&event, 0);
            // Mission data is checked via the mission module's getters

            ts::return_shared(event);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_complete_mission_and_reward() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Fund event
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let payment = coin::mint_for_testing<SUI>(10_000_000_000, ts::ctx(&mut scenario));
            event::fund_event(&mut event, payment);
            ts::return_shared(event);
        };

        // Create mission
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            let mut event = ts::take_shared<Event>(&scenario);

            mission::create_mission(
                &admin_cap,
                &mut event,
                b"Workshop Mission",
                b"Attend the Move workshop",
                200_000_000, // 0.2 SUI
                b"secret_hash_12345678901234567890",
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(event);
        };

        // Register passport for USER1
        ts::next_tx(&mut scenario, USER1);
        {
            passport::register_passport(
                USER1,
                1000,
                ts::ctx(&mut scenario)
            );
        };

        // Create clock
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            clock::create_for_testing(ts::ctx(&mut scenario));
        };

        // Complete mission
        ts::next_tx(&mut scenario, USER1);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut user_passport = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            let initial_balance = event::get_grant_pool_balance(&event);

            mission::complete_mission_and_reward(
                &mut event,
                &mut user_passport,
                USER1,
                0, // mission_id
                b"qr_proof_data",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            // Check attestation was added
            assert!(passport::get_attestation_count(&user_passport) == 1, 0);

            // Check grant pool decreased
            let new_balance = event::get_grant_pool_balance(&event);
            assert!(new_balance == initial_balance - 200_000_000, 1);

            ts::return_shared(event);
            ts::return_to_sender(&scenario, user_passport);
            ts::return_shared(clock_obj);
        };

        // Verify USER1 received the reward coin
        ts::next_tx(&mut scenario, USER1);
        {
            let reward = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert!(coin::value(&reward) == 200_000_000, 0);
            ts::return_to_sender(&scenario, reward);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = mission::EAlreadyCompleted)]
    fun test_double_claim_failure() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Fund event
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let payment = coin::mint_for_testing<SUI>(10_000_000_000, ts::ctx(&mut scenario));
            event::fund_event(&mut event, payment);
            ts::return_shared(event);
        };

        // Create mission
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            let mut event = ts::take_shared<Event>(&scenario);

            mission::create_mission(
                &admin_cap,
                &mut event,
                b"Double Claim Test",
                b"Should fail on second claim",
                100_000_000,
                b"secret_hash_12345678901234567890",
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(event);
        };

        // Register passport
        ts::next_tx(&mut scenario, USER1);
        {
            passport::register_passport(USER1, 1000, ts::ctx(&mut scenario));
        };

        // Create clock
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            clock::create_for_testing(ts::ctx(&mut scenario));
        };

        // First claim (should succeed)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut user_passport = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            mission::complete_mission_and_reward(
                &mut event,
                &mut user_passport,
                USER1,
                0,
                b"qr_proof",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(event);
            ts::return_to_sender(&scenario, user_passport);
            ts::return_shared(clock_obj);
        };

        // Second claim (should FAIL with EAlreadyCompleted)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut user_passport = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            // This should abort with EAlreadyCompleted
            mission::complete_mission_and_reward(
                &mut event,
                &mut user_passport,
                USER1,
                0,
                b"qr_proof",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(event);
            ts::return_to_sender(&scenario, user_passport);
            ts::return_shared(clock_obj);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = event::EInsufficientFunds)]
    fun test_insufficient_funds() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Fund event with only 0.05 SUI (not enough for 0.1 SUI reward)
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let payment = coin::mint_for_testing<SUI>(50_000_000, ts::ctx(&mut scenario));
            event::fund_event(&mut event, payment);
            ts::return_shared(event);
        };

        // Create mission with 0.1 SUI reward
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            let mut event = ts::take_shared<Event>(&scenario);

            mission::create_mission(
                &admin_cap,
                &mut event,
                b"Expensive Mission",
                b"Costs more than available",
                100_000_000, // 0.1 SUI
                b"secret_hash_12345678901234567890",
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(event);
        };

        // Register passport
        ts::next_tx(&mut scenario, USER1);
        {
            passport::register_passport(USER1, 1000, ts::ctx(&mut scenario));
        };

        // Create clock
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            clock::create_for_testing(ts::ctx(&mut scenario));
        };

        // Try to complete mission (should FAIL with EInsufficientFunds)
        ts::next_tx(&mut scenario, USER1);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut user_passport = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            mission::complete_mission_and_reward(
                &mut event,
                &mut user_passport,
                USER1,
                0,
                b"qr_proof",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(event);
            ts::return_to_sender(&scenario, user_passport);
            ts::return_shared(clock_obj);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_multiple_users() {
        let mut scenario = setup_test();
        create_test_event(&mut scenario);

        // Fund event
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let payment = coin::mint_for_testing<SUI>(10_000_000_000, ts::ctx(&mut scenario));
            event::fund_event(&mut event, payment);
            ts::return_shared(event);
        };

        // Create mission
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            let admin_cap = ts::take_from_sender<EventAdminCap>(&scenario);
            let mut event = ts::take_shared<Event>(&scenario);

            mission::create_mission(
                &admin_cap,
                &mut event,
                b"Multi-user Mission",
                b"Can be completed by multiple users",
                100_000_000,
                b"secret_hash_12345678901234567890",
                ts::ctx(&mut scenario)
            );

            ts::return_to_sender(&scenario, admin_cap);
            ts::return_shared(event);
        };

        // Create clock
        ts::next_tx(&mut scenario, ORGANIZER);
        {
            clock::create_for_testing(ts::ctx(&mut scenario));
        };

        // USER1 registers and completes
        ts::next_tx(&mut scenario, USER1);
        {
            passport::register_passport(USER1, 1000, ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut passport1 = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            mission::complete_mission_and_reward(
                &mut event,
                &mut passport1,
                USER1,
                0,
                b"qr1",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(event);
            ts::return_to_sender(&scenario, passport1);
            ts::return_shared(clock_obj);
        };

        // USER2 registers and completes (should succeed)
        ts::next_tx(&mut scenario, USER2);
        {
            passport::register_passport(USER2, 2000, ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut event = ts::take_shared<Event>(&scenario);
            let mut passport2 = ts::take_from_sender<Passport>(&scenario);
            let clock_obj = ts::take_shared<Clock>(&scenario);

            mission::complete_mission_and_reward(
                &mut event,
                &mut passport2,
                USER2,
                0,
                b"qr2",
                &clock_obj,
                ts::ctx(&mut scenario)
            );

            assert!(passport::get_attestation_count(&passport2) == 1, 0);

            ts::return_shared(event);
            ts::return_to_sender(&scenario, passport2);
            ts::return_shared(clock_obj);
        };

        ts::end(scenario);
    }
}
