# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Aptos cookie clicker dapp example demonstrating orderless transactions using the TypeScript SDK. The project showcases advanced Aptos blockchain features including aggregators for concurrent updates, private entry functions, and orderless transaction processing.

## Architecture

### Core Design Principles
- **Orderless Transactions**: All game interactions (especially clicks) are designed to be processed in parallel without race conditions
- **Aggregator-Based State**: Uses `aptos_framework::aggregator_v2` for concurrent-safe state updates
- **Private Entry Functions**: All smart contract functions are private entry points, no public functions exposed
- **Event-Driven Frontend**: Real-time UI updates via blockchain events rather than polling

### Project Structure
The project follows a dual-stack architecture:
```
contracts/          # Move smart contracts
├── sources/        # Main Move source files
├── tests/          # Move unit and integration tests  
└── Move.toml       # Move package configuration

frontend/           # React TypeScript frontend
├── src/
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks for blockchain interaction
│   ├── utils/      # Utilities for Aptos SDK integration
│   └── App.tsx     # Main application component
└── package.json    # Node.js dependencies
```

## Development Commands

### Smart Contract Development
```bash
# Initialize Move package
aptos move init --name cookie_clicker

# Compile contracts
aptos move compile

# Run Move unit tests
aptos move test

# Deploy to testnet
aptos move publish --profile testnet

# Deploy to local development network
aptos move publish --profile local
```

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Key Technical Concepts

### Orderless Transaction Handling
The cookie clicker implements rapid-fire clicking through orderless transactions:
- Multiple click transactions can be submitted simultaneously
- Aggregators handle concurrent state updates safely
- No need to wait for transaction confirmation before sending next click
- Frontend implements optimistic updates with event-based synchronization

### Smart Contract Architecture
- **Player Resources**: Game state stored in Move resources per player address
- **Aggregator Separation**: Critical counters (cookies, clicks) use separate aggregator resources
- **Private Entry Points**: All game functions are `entry fun` with no public visibility
- **Event Emissions**: Each transaction emits events for frontend real-time updates

### Frontend Integration Patterns
- **Transaction Queuing**: Client-side management of multiple concurrent transactions
- **Optimistic Updates**: Immediate UI feedback before blockchain confirmation
- **Event Listening**: WebSocket or polling-based event synchronization
- **Error Recovery**: Graceful handling of failed transactions in rapid-fire scenarios

## Development Notes

### Move Contract Considerations
- Always use `acquires` clauses correctly for resource access
- Implement proper error handling with `assert!` statements
- Use aggregators (`aggregator_v2`) for any frequently updated counters
- Emit events for all state changes that affect the frontend
- Test concurrent transaction scenarios thoroughly

### Frontend Integration
- Use Aptos TypeScript SDK for all blockchain interactions
- Implement proper wallet connection handling (Petra, Martian, Pontem)
- Handle transaction status tracking for multiple concurrent submissions
- Implement exponential backoff for failed transaction retries
- Use React hooks pattern for blockchain state management

### Testing Strategy
- Move unit tests for individual function logic
- Integration tests for multi-transaction scenarios  
- Frontend tests for optimistic update behavior
- Load testing for concurrent click performance
- End-to-end tests covering full user workflows

The project demonstrates advanced Aptos blockchain development patterns specifically around high-frequency, orderless transaction processing suitable for interactive dapp experiences.