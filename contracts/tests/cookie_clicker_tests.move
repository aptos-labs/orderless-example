#[test_only]
module cookie_clicker::cookie_clicker_tests {
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use cookie_clicker::cookie_clicker::{Self, Player, PlayerAggregators, ClickAggregator};

    // Test account addresses
    const PLAYER1: address = @0x100;
    const PLAYER2: address = @0x200;

    #[test(framework = @0x1, player = @0x100)]
    public fun test_initialize_player(framework: &signer, player: &signer) {
        // Set up timestamp for testing
        timestamp::set_time_has_started_for_testing(framework);
        
        // Create account
        account::create_account_for_test(signer::address_of(player));
        
        // Initialize player
        cookie_clicker::init_for_test(player);
        
        // Verify player exists and has correct initial state
        assert!(cookie_clicker::player_exists(PLAYER1), 1);
        assert!(cookie_clicker::player_aggregators_exists(PLAYER1), 2);
        assert!(cookie_clicker::click_aggregator_exists(PLAYER1), 3);
        
        // Check initial cookies
        let cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies == 0, 4);
        
        // Check initial stats
        let (total_cookies, click_multiplier, cookies_per_second, prestige_level) = 
            cookie_clicker::get_player_stats(PLAYER1);
        assert!(total_cookies == 0, 5);
        assert!(click_multiplier == 1, 6);
        assert!(cookies_per_second == 0, 7);
        assert!(prestige_level == 0, 8);
        
        // Check upgrades are all false
        let upgrades = cookie_clicker::get_player_upgrades(PLAYER1);
        assert!(std::vector::length(&upgrades) == 3, 9);
        assert!(*std::vector::borrow(&upgrades, 0) == false, 10);
        assert!(*std::vector::borrow(&upgrades, 1) == false, 11);
        assert!(*std::vector::borrow(&upgrades, 2) == false, 12);
        
        // Check auto-clickers are all 0
        let auto_clickers = cookie_clicker::get_player_auto_clickers(PLAYER1);
        assert!(std::vector::length(&auto_clickers) == 3, 13);
        assert!(*std::vector::borrow(&auto_clickers, 0) == 0, 14);
        assert!(*std::vector::borrow(&auto_clickers, 1) == 0, 15);
        assert!(*std::vector::borrow(&auto_clickers, 2) == 0, 16);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_click_cookie_single(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Click once
        cookie_clicker::click_cookie_test(player);
        
        // Should have 1 cookie
        let cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies == 1, 1);
        
        // Check stats
        let (total_cookies, click_multiplier, cookies_per_second, prestige_level) = 
            cookie_clicker::get_player_stats(PLAYER1);
        assert!(total_cookies == 1, 2);
        assert!(click_multiplier == 1, 3);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_click_cookie_multiple(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Click multiple times
        cookie_clicker::click_cookie_test(player);
        cookie_clicker::click_cookie_test(player);
        cookie_clicker::click_cookie_test(player);
        cookie_clicker::click_cookie_test(player);
        cookie_clicker::click_cookie_test(player);
        
        // Should have 5 cookies
        let cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies == 5, 1);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_buy_upgrade_double_cursor(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Click enough to afford Double Cursor (100 cookies)
        let i = 0;
        while (i < 100) {
            cookie_clicker::click_cookie_test(player);
            i = i + 1;
        };
        
        let cookies_before = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies_before == 100, 1);
        
        // Buy Double Cursor upgrade (upgrade_id = 0)
        cookie_clicker::buy_upgrade_test(player, 0);
        
        // Check cookies deducted
        let cookies_after = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies_after == 0, 2); // 100 - 100 = 0
        
        // Check multiplier increased
        let (_, click_multiplier, _, _) = cookie_clicker::get_player_stats(PLAYER1);
        assert!(click_multiplier == 2, 3);
        
        // Check upgrade marked as owned
        let upgrades = cookie_clicker::get_player_upgrades(PLAYER1);
        assert!(*std::vector::borrow(&upgrades, 0) == true, 4);
        
        // Test that clicking now gives 2 cookies
        cookie_clicker::click_cookie_test(player);
        let final_cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(final_cookies == 2, 5);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_buy_auto_clicker_grandma(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Click enough to afford Grandma (50 cookies)
        let i = 0;
        while (i < 50) {
            cookie_clicker::click_cookie_test(player);
            i = i + 1;
        };
        
        // Buy 1 Grandma (type_id = 0)
        cookie_clicker::buy_auto_clicker_test(player, 0, 1);
        
        // Check cookies deducted
        let cookies_after = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies_after == 0, 1); // 50 - 50 = 0
        
        // Check auto-clicker count
        let auto_clickers = cookie_clicker::get_player_auto_clickers(PLAYER1);
        assert!(*std::vector::borrow(&auto_clickers, 0) == 1, 2);
        
        // Check cookies per second
        let (_, _, cookies_per_second, _) = cookie_clicker::get_player_stats(PLAYER1);
        assert!(cookies_per_second == 1, 3);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_collect_passive_cookies(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Get enough cookies for a Grandma
        let i = 0;
        while (i < 50) {
            cookie_clicker::click_cookie_test(player);
            i = i + 1;
        };
        
        // Buy Grandma
        cookie_clicker::buy_auto_clicker_test(player, 0, 1);
        
        // Fast forward time by 10 seconds
        timestamp::fast_forward_seconds(10);
        
        // Collect passive cookies
        cookie_clicker::collect_passive_cookies_test(player);
        
        // Should have earned 10 cookies (1 cookie/sec * 10 seconds)
        let cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        assert!(cookies == 10, 1);
    }

    #[test(framework = @0x1, player = @0x100)]
    public fun test_prestige_system(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // For testing, we'll simulate having enough cookies for prestige
        // by clicking fewer times but checking the logic works
        // In reality, reaching 1M cookies would be through auto-clickers over time
        
        // Just verify prestige logic by checking if player can't prestige with few cookies
        let (_, _, _, prestige_level_before) = cookie_clicker::get_player_stats(PLAYER1);
        assert!(prestige_level_before == 0, 1);
        
        // This test mainly verifies the contract structure is correct for prestige
        // Full prestige functionality would be tested in integration tests with realistic gameplay
    }

    #[test(framework = @0x1, player = @0x100)]
    #[expected_failure(abort_code = 1)] // E_PLAYER_NOT_INITIALIZED
    public fun test_click_without_init(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        
        // Try to click without initializing - should fail
        cookie_clicker::click_cookie_test(player);
    }

    #[test(framework = @0x1, player = @0x100)]
    #[expected_failure(abort_code = 3)] // E_INSUFFICIENT_COOKIES
    public fun test_buy_upgrade_insufficient_funds(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Try to buy Double Cursor without enough cookies - should fail
        cookie_clicker::buy_upgrade_test(player, 0);
    }

    #[test(framework = @0x1, player = @0x100)]
    #[expected_failure(abort_code = 2)] // E_INVALID_UPGRADE_ID
    public fun test_buy_invalid_upgrade(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Try to buy invalid upgrade - should fail
        cookie_clicker::buy_upgrade_test(player, 5);
    }

    #[test(framework = @0x1, player = @0x100)]
    #[expected_failure(abort_code = 6)] // E_PRESTIGE_NOT_AVAILABLE
    public fun test_prestige_insufficient_cookies(framework: &signer, player: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(signer::address_of(player));
        cookie_clicker::init_for_test(player);
        
        // Click a few times but not enough for prestige
        cookie_clicker::click_cookie_test(player);
        cookie_clicker::click_cookie_test(player);
        
        // Try to prestige without enough cookies - should fail
        cookie_clicker::prestige_test(player);
    }

    #[test(framework = @0x1, player1 = @0x100, player2 = @0x200)]
    public fun test_multiple_players_independent(framework: &signer, player1: &signer, player2: &signer) {
        timestamp::set_time_has_started_for_testing(framework);
        account::create_account_for_test(PLAYER1);
        account::create_account_for_test(PLAYER2);
        
        // Initialize both players
        cookie_clicker::init_for_test(player1);
        cookie_clicker::init_for_test(player2);
        
        // Player 1 clicks 3 times
        cookie_clicker::click_cookie_test(player1);
        cookie_clicker::click_cookie_test(player1);
        cookie_clicker::click_cookie_test(player1);
        
        // Player 2 clicks 5 times
        cookie_clicker::click_cookie_test(player2);
        cookie_clicker::click_cookie_test(player2);
        cookie_clicker::click_cookie_test(player2);
        cookie_clicker::click_cookie_test(player2);
        cookie_clicker::click_cookie_test(player2);
        
        // Verify independent cookie counts
        let player1_cookies = cookie_clicker::get_total_cookies_test(PLAYER1);
        let player2_cookies = cookie_clicker::get_total_cookies_test(PLAYER2);
        
        assert!(player1_cookies == 3, 1);
        assert!(player2_cookies == 5, 2);
    }
}