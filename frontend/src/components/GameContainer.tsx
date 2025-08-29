import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Row, Col, Alert } from 'antd';
import { useGameState } from '../hooks/useGameState';
import PlayerInitializer from './PlayerInitializer';
import CookieDisplay from './CookieDisplay';
import StatsPanel from './StatsPanel';
import UpgradeShop from './UpgradeShop';
import AutoClickerPanel from './AutoClickerPanel';
import TransactionStatus from './TransactionStatus';
import PrestigePanel from './PrestigePanel';

const GameContainer: React.FC = () => {
  const { connected } = useWallet();
  const { isInitialized, error, loading } = useGameState();

  if (!connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-8">🍪</div>
        <h2 className="text-3xl text-white mb-4">
          Welcome to Cookie Clicker Aptos!
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Experience the world's first cookie clicker game with orderless transaction processing.
          Connect your wallet to start clicking and earning cookies on the Aptos blockchain!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 text-left">
          <div className="glass-card p-6 rounded-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Orderless Transactions</h3>
            <p className="text-gray-300">
              Click rapidly without waiting! Multiple transactions process simultaneously 
              thanks to Aptos aggregators.
            </p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">On-Chain Everything</h3>
            <p className="text-gray-300">
              Every click, upgrade, and achievement is recorded on the Aptos blockchain.
              True decentralized gaming!
            </p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-white mb-2">Prestige System</h3>
            <p className="text-gray-300">
              Earn prestige points and permanent multipliers by reaching cookie milestones.
              The more you play, the stronger you become!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized && !loading) {
    return <PlayerInitializer />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <Alert
          message="Game Error"
          description={error}
          type="error"
          closable
          className="mb-6"
        />
      )}
      
      <TransactionStatus />
      
      <Row gutter={[24, 24]} className="mt-6">
        {/* Left Column - Cookie Display and Stats */}
        <Col xs={24} lg={12} xl={10}>
          <div className="space-y-6">
            <CookieDisplay />
            <StatsPanel />
            <PrestigePanel />
          </div>
        </Col>
        
        {/* Right Column - Upgrades and Auto-Clickers */}
        <Col xs={24} lg={12} xl={14}>
          <div className="space-y-6">
            <UpgradeShop />
            <AutoClickerPanel />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default GameContainer;