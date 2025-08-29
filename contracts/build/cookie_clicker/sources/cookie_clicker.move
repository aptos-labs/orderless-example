module cookie_clicker::cookie_clicker {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::aggregator_v2::{Self, Aggregator};

    // Error codes
    const E_PLAYER_NOT_INITIALIZED: u64 = 1;
    const E_INVALID_UPGRADE_ID: u64 = 2;
    const E_INSUFFICIENT_COOKIES: u64 = 3;
    const E_INVALID_AUTO_CLICKER_TYPE: u64 = 4;
    const E_AGGREGATORS_NOT_INITIALIZED: u64 = 5;
    const E_PRESTIGE_NOT_AVAILABLE: u64 = 6;

    // Constants
    const UPGRADE_COUNT: u8 = 3;
    const AUTO_CLICKER_COUNT: u8 = 3;
    const PRESTIGE_THRESHOLD: u64 = 1000000; // 1 million cookies needed to prestige
    const SECONDS_IN_MICROSECONDS: u64 = 1000000;

    // Upgrade costs and multipliers
    const DOUBLE_CURSOR_COST: u64 = 100;
    const GOLDEN_TOUCH_COST: u64 = 1000;
    const DIVINE_FINGER_COST: u64 = 10000;

    // Auto-clicker costs and rates (cookies per second)
    const GRANDMA_COST: u64 = 50;
    const GRANDMA_RATE: u64 = 1;
    const FACTORY_COST: u64 = 500;
    const FACTORY_RATE: u64 = 10;
    const BANK_COST: u64 = 5000;
    const BANK_RATE: u64 = 100;

    /// Store click aggregator data with multiplier
    struct ClickAggregator has key {
        aggregator: Aggregator<u64>,
        click_multiplier: u64,
    }

    /// Store player aggregated statistics
    struct PlayerAggregators has key {
        total_cookies: Aggregator<u64>,
        lifetime_clicks: Aggregator<u64>,
        cookies_per_second_agg: Aggregator<u64>,
    }

    /// Core player data structure
    struct Player has key {
        // Core stats
        click_multiplier: u64,
        last_passive_collection: u64,
        prestige_level: u64,
        prestige_points: u64,
        
        // Upgrade tracking
        upgrades: vector<bool>,
        auto_clickers: vector<u64>,
        
        // Aggregator status
        aggregators_initialized: bool,
    }

    // Events
    #[event]
    struct ClickEvent has drop, store {
        player: address,
        cookies_earned: u64,
        total_cookies: u64,
        timestamp: u64,
    }

    #[event]
    struct UpgradeEvent has drop, store {
        player: address,
        upgrade_id: u8,
        cost: u64,
        new_multiplier: u64,
    }

    #[event]
    struct AutoClickerEvent has drop, store {
        player: address,
        type_id: u8,
        quantity: u64,
        cost: u64,
        new_cps: u64,
    }

    #[event]
    struct PassiveCollectionEvent has drop, store {
        player: address,
        cookies_earned: u64,
        time_elapsed: u64,
    }

    #[event]
    struct PrestigeEvent has drop, store {
        player: address,
        prestige_points_earned: u64,
        new_prestige_level: u64,
        cookies_sacrificed: u64,
    }

    /// Initialize a new player account with starting resources
    entry fun initialize_player(account: &signer) acquires Player {
        let addr = signer::address_of(account);
        
        // Create empty upgrade vector (3 upgrades: false, false, false)
        let upgrades = vector::empty<bool>();
        vector::push_back(&mut upgrades, false);
        vector::push_back(&mut upgrades, false);
        vector::push_back(&mut upgrades, false);
        
        // Create empty auto-clicker vector (3 types: 0, 0, 0)
        let auto_clickers = vector::empty<u64>();
        vector::push_back(&mut auto_clickers, 0);
        vector::push_back(&mut auto_clickers, 0);
        vector::push_back(&mut auto_clickers, 0);

        // Initialize player resource
        move_to(account, Player {
            click_multiplier: 1,
            last_passive_collection: timestamp::now_microseconds(),
            prestige_level: 0,
            prestige_points: 0,
            upgrades,
            auto_clickers,
            aggregators_initialized: false,
        });

        // Initialize aggregators
        move_to(account, PlayerAggregators {
            total_cookies: aggregator_v2::create_aggregator(1000000000000), // Max 1 trillion cookies
            lifetime_clicks: aggregator_v2::create_aggregator(1000000000000), // Max 1 trillion clicks
            cookies_per_second_agg: aggregator_v2::create_aggregator(1000000000), // Max 1 billion CPS
        });

        // Initialize click aggregator
        move_to(account, ClickAggregator {
            aggregator: aggregator_v2::create_aggregator(1000000000000), // Track total click value
            click_multiplier: 1,
        });

        // Mark aggregators as initialized
        let player = borrow_global_mut<Player>(addr);
        player.aggregators_initialized = true;
    }

    /// Click the cookie to earn cookies - orderless transaction safe
    entry fun click_cookie(account: &signer) acquires PlayerAggregators, ClickAggregator {
        let addr = signer::address_of(account);
        
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        assert!(exists<PlayerAggregators>(addr), E_AGGREGATORS_NOT_INITIALIZED);
        assert!(exists<ClickAggregator>(addr), E_AGGREGATORS_NOT_INITIALIZED);
        
        let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
        let click_agg = borrow_global<ClickAggregator>(addr);
        
        // Atomic aggregator increment - orderless safe
        aggregator_v2::add(&mut player_aggs.total_cookies, click_agg.click_multiplier);
        aggregator_v2::add(&mut player_aggs.lifetime_clicks, 1);
        
        // Get current total for event
        let total_cookies = aggregator_v2::read(&player_aggs.total_cookies);
        
        // Emit event for frontend feedback
        event::emit(ClickEvent {
            player: addr,
            cookies_earned: click_agg.click_multiplier,
            total_cookies,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Buy an upgrade to increase click multiplier
    entry fun buy_upgrade(account: &signer, upgrade_id: u8) acquires Player, PlayerAggregators, ClickAggregator {
        let addr = signer::address_of(account);
        
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        assert!(upgrade_id < UPGRADE_COUNT, E_INVALID_UPGRADE_ID);
        
        let player = borrow_global_mut<Player>(addr);
        let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
        let click_agg = borrow_global_mut<ClickAggregator>(addr);
        
        // Check if already owned
        let already_owned = *vector::borrow(&player.upgrades, (upgrade_id as u64));
        assert!(!already_owned, E_INSUFFICIENT_COOKIES);
        
        // Get upgrade cost and multiplier
        let (cost, multiplier) = get_upgrade_details(upgrade_id);
        let current_cookies = aggregator_v2::read(&player_aggs.total_cookies);
        
        assert!(current_cookies >= cost, E_INSUFFICIENT_COOKIES);
        
        // Deduct cost
        aggregator_v2::sub(&mut player_aggs.total_cookies, cost);
        
        // Apply upgrade
        *vector::borrow_mut(&mut player.upgrades, (upgrade_id as u64)) = true;
        player.click_multiplier = player.click_multiplier * multiplier;
        click_agg.click_multiplier = player.click_multiplier;
        
        event::emit(UpgradeEvent {
            player: addr,
            upgrade_id,
            cost,
            new_multiplier: player.click_multiplier,
        });
    }

    /// Buy auto-clickers for passive income
    entry fun buy_auto_clicker(account: &signer, type_id: u8, quantity: u64) acquires Player, PlayerAggregators {
        let addr = signer::address_of(account);
        
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        assert!(type_id < AUTO_CLICKER_COUNT, E_INVALID_AUTO_CLICKER_TYPE);
        assert!(quantity > 0, E_INSUFFICIENT_COOKIES);
        
        let player = borrow_global_mut<Player>(addr);
        let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
        
        // Get auto-clicker details
        let (base_cost, cps_rate) = get_auto_clicker_details(type_id);
        let current_owned = *vector::borrow(&player.auto_clickers, (type_id as u64));
        
        // Calculate total cost with exponential pricing
        let total_cost = calculate_auto_clicker_cost(base_cost, current_owned, quantity);
        let current_cookies = aggregator_v2::read(&player_aggs.total_cookies);
        
        assert!(current_cookies >= total_cost, E_INSUFFICIENT_COOKIES);
        
        // Deduct cost and add auto-clickers
        aggregator_v2::sub(&mut player_aggs.total_cookies, total_cost);
        *vector::borrow_mut(&mut player.auto_clickers, (type_id as u64)) = current_owned + quantity;
        
        // Update cookies per second
        let additional_cps = cps_rate * quantity;
        aggregator_v2::add(&mut player_aggs.cookies_per_second_agg, additional_cps);
        
        let new_total_cps = aggregator_v2::read(&player_aggs.cookies_per_second_agg);
        
        event::emit(AutoClickerEvent {
            player: addr,
            type_id,
            quantity,
            cost: total_cost,
            new_cps: new_total_cps,
        });
    }

    /// Collect passive cookies generated by auto-clickers
    entry fun collect_passive_cookies(account: &signer) acquires Player, PlayerAggregators {
        let addr = signer::address_of(account);
        
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        
        let player = borrow_global_mut<Player>(addr);
        let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
        
        let current_time = timestamp::now_microseconds();
        let time_elapsed = current_time - player.last_passive_collection;
        let time_elapsed_seconds = time_elapsed / SECONDS_IN_MICROSECONDS;
        
        if (time_elapsed_seconds > 0) {
            let cookies_per_second = aggregator_v2::read(&player_aggs.cookies_per_second_agg);
            let cookies_earned = cookies_per_second * time_elapsed_seconds;
            
            if (cookies_earned > 0) {
                aggregator_v2::add(&mut player_aggs.total_cookies, cookies_earned);
                
                event::emit(PassiveCollectionEvent {
                    player: addr,
                    cookies_earned,
                    time_elapsed: time_elapsed_seconds,
                });
            };
            
            player.last_passive_collection = current_time;
        }
    }

    /// Prestige to reset progress for permanent bonuses
    entry fun prestige(account: &signer) acquires Player, PlayerAggregators, ClickAggregator {
        let addr = signer::address_of(account);
        
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        
        let player = borrow_global_mut<Player>(addr);
        let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
        let click_agg = borrow_global_mut<ClickAggregator>(addr);
        
        let current_cookies = aggregator_v2::read(&player_aggs.total_cookies);
        assert!(current_cookies >= PRESTIGE_THRESHOLD, E_PRESTIGE_NOT_AVAILABLE);
        
        // Calculate prestige points earned (1 point per million cookies)
        let prestige_points_earned = current_cookies / 1000000;
        
        // Reset progress
        aggregator_v2::sub(&mut player_aggs.total_cookies, current_cookies);
        let lifetime_clicks = aggregator_v2::read(&player_aggs.lifetime_clicks);
        aggregator_v2::sub(&mut player_aggs.lifetime_clicks, lifetime_clicks);
        let current_cps = aggregator_v2::read(&player_aggs.cookies_per_second_agg);
        aggregator_v2::sub(&mut player_aggs.cookies_per_second_agg, current_cps);
        
        // Reset upgrades and auto-clickers
        let i = 0;
        while (i < UPGRADE_COUNT) {
            *vector::borrow_mut(&mut player.upgrades, (i as u64)) = false;
            i = i + 1;
        };
        
        let j = 0;
        while (j < AUTO_CLICKER_COUNT) {
            *vector::borrow_mut(&mut player.auto_clickers, (j as u64)) = 0;
            j = j + 1;
        };
        
        // Apply permanent bonuses
        player.prestige_level = player.prestige_level + 1;
        player.prestige_points = player.prestige_points + prestige_points_earned;
        player.click_multiplier = 1 + player.prestige_points; // 1 bonus multiplier per prestige point
        click_agg.click_multiplier = player.click_multiplier;
        
        event::emit(PrestigeEvent {
            player: addr,
            prestige_points_earned,
            new_prestige_level: player.prestige_level,
            cookies_sacrificed: current_cookies,
        });
    }

    // View functions

    #[view]
    public fun get_player_cookies(addr: address): u64 acquires PlayerAggregators {
        assert!(exists<PlayerAggregators>(addr), E_PLAYER_NOT_INITIALIZED);
        let player_aggs = borrow_global<PlayerAggregators>(addr);
        aggregator_v2::read(&player_aggs.total_cookies)
    }

    #[view]
    public fun get_player_stats(addr: address): (u64, u64, u64, u64) acquires Player, PlayerAggregators {
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        assert!(exists<PlayerAggregators>(addr), E_PLAYER_NOT_INITIALIZED);
        
        let player = borrow_global<Player>(addr);
        let player_aggs = borrow_global<PlayerAggregators>(addr);
        
        let total_cookies = aggregator_v2::read(&player_aggs.total_cookies);
        let lifetime_clicks = aggregator_v2::read(&player_aggs.lifetime_clicks);
        let cookies_per_second = aggregator_v2::read(&player_aggs.cookies_per_second_agg);
        
        (total_cookies, player.click_multiplier, cookies_per_second, player.prestige_level)
    }

    #[view]
    public fun get_player_upgrades(addr: address): vector<bool> acquires Player {
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        let player = borrow_global<Player>(addr);
        player.upgrades
    }

    #[view]
    public fun get_player_auto_clickers(addr: address): vector<u64> acquires Player {
        assert!(exists<Player>(addr), E_PLAYER_NOT_INITIALIZED);
        let player = borrow_global<Player>(addr);
        player.auto_clickers
    }

    // Helper functions

    fun get_upgrade_details(upgrade_id: u8): (u64, u64) {
        if (upgrade_id == 0) {
            (DOUBLE_CURSOR_COST, 2) // Double Cursor: 2x multiplier
        } else if (upgrade_id == 1) {
            (GOLDEN_TOUCH_COST, 5) // Golden Touch: 5x multiplier
        } else if (upgrade_id == 2) {
            (DIVINE_FINGER_COST, 10) // Divine Finger: 10x multiplier
        } else {
            (0, 1) // Should never reach here due to assertion
        }
    }

    fun get_auto_clicker_details(type_id: u8): (u64, u64) {
        if (type_id == 0) {
            (GRANDMA_COST, GRANDMA_RATE) // Grandma: 1 cookie/sec
        } else if (type_id == 1) {
            (FACTORY_COST, FACTORY_RATE) // Factory: 10 cookies/sec
        } else if (type_id == 2) {
            (BANK_COST, BANK_RATE) // Bank: 100 cookies/sec
        } else {
            (0, 0) // Should never reach here due to assertion
        }
    }

    fun calculate_auto_clicker_cost(base_cost: u64, current_owned: u64, quantity: u64): u64 {
        let total_cost = 0;
        let i = 0;
        
        while (i < quantity) {
            let individual_cost = base_cost * (((current_owned + i) / 10) + 1);
            total_cost = total_cost + individual_cost;
            i = i + 1;
        };
        
        total_cost
    }

    // Test helper functions
    #[test_only]
    public fun init_for_test(account: &signer) acquires Player {
        initialize_player(account);
    }

    #[test_only]
    public fun get_total_cookies_test(addr: address): u64 acquires PlayerAggregators {
        get_player_cookies(addr)
    }

    #[test_only]
    public fun click_cookie_test(account: &signer) acquires PlayerAggregators, ClickAggregator {
        click_cookie(account);
    }

    #[test_only]
    public fun buy_upgrade_test(account: &signer, upgrade_id: u8) acquires Player, PlayerAggregators, ClickAggregator {
        buy_upgrade(account, upgrade_id);
    }

    #[test_only]
    public fun buy_auto_clicker_test(account: &signer, type_id: u8, quantity: u64) acquires Player, PlayerAggregators {
        buy_auto_clicker(account, type_id, quantity);
    }

    #[test_only]
    public fun collect_passive_cookies_test(account: &signer) acquires Player, PlayerAggregators {
        collect_passive_cookies(account);
    }

    #[test_only]
    public fun prestige_test(account: &signer) acquires Player, PlayerAggregators, ClickAggregator {
        prestige(account);
    }

    #[test_only]
    public fun player_exists(addr: address): bool {
        exists<Player>(addr)
    }

    #[test_only]
    public fun player_aggregators_exists(addr: address): bool {
        exists<PlayerAggregators>(addr)
    }

    #[test_only]
    public fun click_aggregator_exists(addr: address): bool {
        exists<ClickAggregator>(addr)
    }
}