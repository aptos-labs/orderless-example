# Cookie Clicker Aptos - Orderless Transaction DApp

A decentralized cookie clicker game built on Aptos blockchain featuring on-chain clicks, aggregator-based tracking, private entry functions, and **orderless transaction processing** for optimal performance.

## 🚀 Key Features

### Orderless Transaction Processing
- **Rapid Clicking**: Click as fast as you want! Multiple click transactions can be submitted simultaneously
- **No Race Conditions**: Aptos aggregators handle concurrent modifications safely  
- **Parallel Processing**: Clicks processed out-of-order without conflicts
- **Better UX**: No waiting for previous transaction confirmation

### On-Chain Everything
- Every click is a blockchain transaction using aggregators
- Concurrent-safe cookie counting with `aggregator_v2`
- Private entry functions only (no public functions exposed)
- True decentralized gaming experience

### Game Features
- **Click to Earn**: Start with 1 cookie per click
- **Upgrades**: Buy multipliers (2x, 5x, 10x clicks)
- **Auto-Clickers**: Passive cookie generation (Grandma, Factory, Bank)
- **Prestige System**: Reset progress for permanent bonuses

## 🏗️ Architecture

### Smart Contract (Move)
- **Language**: Move on Aptos
- **Key Feature**: Aggregator-based orderless transactions
- **Structure**: Private entry functions only
- **Testing**: Comprehensive unit tests

### Frontend (React + TypeScript)
- **Wallet Integration**: Petra, Martian, Pontem
- **Real-time Updates**: Event-driven UI updates
- **Optimistic Updates**: Immediate feedback
- **Transaction Management**: Queue system for parallel processing

## 📁 Project Structure

```
cookie-clicker-aptos/
├── contracts/
│   ├── sources/
│   │   └── cookie_clicker.move      # Main smart contract
│   ├── tests/
│   │   └── cookie_clicker_tests.move # Unit tests
│   └── Move.toml                     # Move configuration
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Game state management
│   │   ├── utils/                   # Aptos integration
│   │   └── App.tsx                  # Main app
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🛠️ Setup & Deployment

### Prerequisites
- [Aptos CLI](https://aptos.dev/tools/aptos-cli/)
- [Node.js](https://nodejs.org/) (v16+)
- [Aptos Wallet](https://petra.app/) (Petra, Martian, or Pontem)

### Smart Contract Deployment

1. **Navigate to contracts directory**:
   ```bash
   cd contracts
   ```

2. **Initialize Aptos account** (if you haven't):
   ```bash
   aptos init --network testnet
   ```

3. **Compile the contract**:
   ```bash
   aptos move compile
   ```

4. **Run tests**:
   ```bash
   aptos move test
   ```

5. **Deploy to testnet**:
   ```bash
   aptos move publish --named-addresses cookie_clicker=default
   ```

6. **Note the deployed address** and update `MODULE_ADDRESS` in `/frontend/src/utils/aptosClient.ts`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update contract address** in `src/utils/aptosClient.ts`:
   ```typescript
   const MODULE_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

5. **Open browser** to `http://localhost:3000`

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and choose your Aptos wallet
2. **Initialize Player**: Click "Start Cookie Adventure!" to create your on-chain profile
3. **Click Cookies**: Click the big cookie to earn cookies (each click is a blockchain transaction!)
4. **Buy Upgrades**: Increase your click multiplier with upgrades
5. **Purchase Auto-Clickers**: Generate passive cookie income
6. **Prestige**: Reset progress for permanent bonuses when you reach 1M cookies

## ⚡ Orderless Transaction Benefits

### Traditional Blockchain Games
- Wait for each transaction to confirm
- Race conditions with rapid clicking
- Sequential processing bottlenecks
- Poor user experience

### Cookie Clicker Aptos
- ✅ Submit multiple clicks instantly
- ✅ Aggregators prevent race conditions
- ✅ Parallel transaction processing
- ✅ Smooth, responsive gameplay

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
aptos move test
```

### Frontend Development
```bash
cd frontend
npm test
```

## 📊 Game Economics

### Upgrades
- **Double Cursor**: 100 cookies → 2x multiplier
- **Golden Touch**: 1,000 cookies → 5x multiplier  
- **Divine Finger**: 10,000 cookies → 10x multiplier

### Auto-Clickers
- **Grandma**: 50 cookies → 1 cookie/sec
- **Factory**: 500 cookies → 10 cookies/sec
- **Bank**: 5,000 cookies → 100 cookies/sec

### Prestige System
- **Threshold**: 1,000,000 cookies
- **Reward**: 1 prestige point per 1M cookies
- **Benefit**: +1x base click multiplier per prestige point

## 🔧 Technical Details

### Aggregator Usage
```move
// Orderless click processing
entry fun click_cookie(account: &signer) {
    let player_aggs = borrow_global_mut<PlayerAggregators>(addr);
    let click_agg = borrow_global<ClickAggregator>(addr);
    
    // Atomic, concurrent-safe operations
    aggregator::add(&mut player_aggs.total_cookies, click_agg.click_multiplier);
    aggregator::add(&mut player_aggs.lifetime_clicks, 1);
}
```

### Frontend Transaction Queue
```typescript
// Multiple clicks submitted simultaneously
const handleRapidClick = async () => {
  const clickPromises = Array(clickCount).fill(null).map(() => 
    submitTransaction({
      function: `${MODULE_ADDRESS}::cookie_clicker::click_cookie`,
      arguments: []
    })
  );
  
  // Process all clicks in parallel
  Promise.allSettled(clickPromises);
};
```

## 🚨 Important Notes

- **Testnet Only**: This implementation is configured for Aptos testnet
- **Gas Fees**: Each click requires a small amount of APT for gas
- **Wallet Connection**: Ensure your wallet is connected to Aptos testnet
- **Contract Address**: Update the MODULE_ADDRESS after deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- [ ] Mainnet deployment
- [ ] Additional upgrade tiers
- [ ] Leaderboard system  
- [ ] NFT achievements
- [ ] Mobile optimization
- [ ] Sound effects and animations

---

**Experience the future of blockchain gaming with orderless transactions on Aptos!** 🍪⚡
