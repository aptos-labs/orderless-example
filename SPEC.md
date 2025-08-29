# Aptos Cookie Clicker Dapp Specification

## Overview
A decentralized cookie clicker game built on Aptos blockchain featuring on-chain clicks, aggregator-based tracking, private entry functions, and orderless transaction processing for optimal performance.

## Game Mechanics

### Core Gameplay
- Click a cookie to earn cookies (1 cookie per click initially)
- Purchase upgrades to increase cookies per click
- Buy auto-clickers that generate cookies over time
- Prestige system to reset progress for permanent bonuses

### Cookie Economics
- Base cookie generation: 1 cookie per manual click
- Upgrades multiply click value (2x, 5x, 10x, etc.)
- Auto-clickers generate cookies passively (1-100+ cookies/second)
- Prestige points provide permanent multipliers

### Upgrade System
- **Click Multipliers:** Double Cursor (2x clicks), Golden Touch (5x clicks), Divine Finger (10x clicks)
- **Auto-Clickers:** Grandma (1 cookie/sec), Factory (10 cookies/sec), Bank (100 cookies/sec)
- **Prestige Upgrades:** Permanent multipliers unlocked with prestige points

## Smart Contract Requirements

### On-Chain Clicks with Aggregators
```move
struct ClickAggregator has key {
    aggregator: aggregator::Aggregator,
    click_multiplier: u64,
}

struct PlayerAggregators has key {
    total_cookies: aggregator::Aggregator,
    lifetime_clicks: aggregator::Aggregator,
    cookies_per_second_agg: aggregator::Aggregator,
}
```

### Player Data Structure
```move
struct Player has key {
    // Core aggregated stats
    click_multiplier: u64,
    last_passive_collection: u64,
    prestige_level: u64,
    prestige_points: u64,
    
    // Upgrade tracking
    upgrades: vector<bool>,
    auto_clickers: vector<u64>,
    
    // Aggregator handles stored separately
    aggregators_initialized: bool,
}
```

### Private Entry Functions Only
All functions are private entry - no public functions exposed:

```move
entry fun click_cookie(account: &signer) acquires Player, PlayerAggregators, ClickAggregator

entry fun buy_upgrade(account: &signer, upgrade_id: u8) acquires Player, PlayerAggregators

entry fun buy_auto_clicker(account: &signer, type_id: u8, quantity: u64) acquires Player, PlayerAggregators

entry fun collect_passive_cookies(account: &signer) acquires Player, PlayerAggregators

entry fun prestige(account: &signer) acquires Player, PlayerAggregators, ClickAggregator

entry fun initialize_player(account: &signer)

// View functions accessible through resource reads
#[view]
fun get_player_cookies(addr: address): u64 acquires PlayerAggregators

#[view] 
fun get_player_stats(addr: address): (u64, u64, u64, u64) acquires Player, PlayerAggregators
```

### Orderless Transaction Architecture

Each click generates an independent transaction that can be processed in any order:

```move
// Each click is atomic and order-independent using aggregators
entry fun click_cookie(account: &signer) acquires Player, PlayerAggregators, ClickAggregator {
    let addr = signer::address_of(account);
    
    // Aggregator automatically handles concurrent updates
    let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
    let click_agg = borrow_global<ClickAggregator>(addr);
    
    // Atomic aggregator increment - orderless safe
    aggregator::add(&mut player_aggs.total_cookies, click_agg.click_multiplier);
    aggregator::add(&mut player_aggs.lifetime_clicks, 1);
    
    // Emit event for frontend feedback
    emit_click_event(addr, click_agg.click_multiplier);
}
```

### Economic Balance
- Exponential pricing for upgrades (base_cost * multiplier^owned)
- Time-based passive cookie accumulation
- Prestige requirement: minimum cookie threshold

### Orderless Design Benefits
- **Rapid Clicking:** Multiple click transactions can be submitted simultaneously
- **No Race Conditions:** Aggregators handle concurrent modifications safely  
- **Parallel Processing:** Clicks processed out-of-order without conflicts
- **Better UX:** No waiting for previous transaction confirmation

## Frontend Requirements

### Core UI Components
- **Cookie Display:** Large clickable cookie animation with click effects
- **Stats Panel:** Current cookies, cookies/click, cookies/second, prestige level
- **Upgrade Shop:** Grid of purchasable upgrades with costs and owned quantities
- **Auto-Clicker Panel:** List of passive generators with purchase buttons

### User Experience
- Real-time cookie counter updates
- Visual feedback for clicks (particle effects, animations)
- Progress bars for expensive purchases
- Sound effects for clicks and purchases
- Responsive design for mobile and desktop

### Wallet Integration
- Aptos wallet connection (Petra, Martian, Pontem)
- Transaction confirmation dialogs
- Loading states during blockchain interactions
- Error handling for failed transactions

### Frontend Transaction Handling
```typescript
// Multiple clicks can be sent simultaneously
const handleRapidClick = async () => {
  // Don't wait for previous transaction - send immediately
  const clickPromises = Array(clickCount).fill(null).map(() => 
    submitTransaction({
      function: `${MODULE_ADDRESS}::cookie_clicker::click_cookie`,
      arguments: []
    })
  );
  
  // Update UI optimistically, sync with events
  updateUIOptimistically(clickCount);
  
  // Handle results asynchronously
  Promise.allSettled(clickPromises).then(handleResults);
};
```

## Technical Architecture

### Smart Contract Stack
- **Language:** Move on Aptos
- **Development:** Aptos CLI, Move compiler
- **Testing:** Move unit tests and integration tests
- **Deployment:** Aptos testnet/mainnet
- **Dependencies:** `use aptos_framework::aggregator_v2` for concurrent updates

### Enhanced Smart Contract Features
- **Aggregator Integration:** `aptos_framework::aggregator_v2` for concurrent updates
- **Event-Driven Updates:** Events emitted for each action to update frontend immediately
- **Resource Separation:** Player data and aggregators stored in separate resources
- **Orderless Optimization:** All state changes designed for parallel execution

### Frontend Stack
- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS or styled-components
- **Blockchain Integration:** Aptos TypeScript SDK
- **Wallet:** Aptos Wallet Adapter
- **State Management:** React Context or Zustand

### Performance Optimizations
- **Batch View Calls:** Use multi-resource reads for dashboard updates
- **Event Listening:** Real-time UI updates via blockchain events
- **Transaction Queuing:** Client-side queue for rapid interactions
- **Optimistic Updates:** Immediate UI feedback before confirmation

### Development Workflow
1. Smart contract development and testing on local Aptos node
2. Contract deployment to testnet
3. Frontend integration with testnet contract
4. UI/UX polishing and game balancing
5. Stress testing for concurrent click scenarios
6. Mainnet deployment and launch

### Project Structure
```
cookie-clicker-aptos/
├── contracts/
│   ├── sources/
│   │   └── cookie_clicker.move
│   ├── tests/
│   └── Move.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.tsx
│   └── package.json
└── SPEC.md
```

## Key Requirements Summary
✅ **On-Chain Clicks:** Every click is a blockchain transaction using aggregators  
✅ **Aggregator Tracking:** Concurrent-safe cookie counting with `aggregator_v2`  
✅ **Private Entry Functions:** No public functions, only private entry points  
✅ **Orderless Transactions:** Parallel click processing without race conditions  

This specification supports high-frequency clicking with orderless transaction processing, making it perfect for a responsive cookie clicker experience on Aptos blockchain.