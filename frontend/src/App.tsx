import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import GameContainer from './components/GameContainer';
import WalletConnector from './components/WalletConnector';
import LocalAccountManager from './components/LocalAccountManager';
import FallingCookies from './components/FallingCookies';
import { GameProvider, useGameState } from './hooks/useGameState';
import './App.css';

const AppContent: React.FC = () => {
  const { currentAccount, accountType, setLocalAccount } = useGameState();

  return (
    <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <FallingCookies />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="text-center mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4 drop-shadow-lg">
            🍪 Cookie Clicker Aptos
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Experience the power of orderless transactions on Aptos blockchain!
          </p>
          <WalletConnector />
        </header>
        
        {/* Show local account manager if no wallet connected or if using local account */}
        {(!currentAccount || accountType === 'local') && (
          <LocalAccountManager onAccountReady={setLocalAccount} />
        )}
        
        <GameContainer />
      </div>
    </div>
  );
};

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#D2691E',
          colorBgBase: '#1a1a1a',
        },
      }}
    >
      <AptosWalletAdapterProvider
        autoConnect={true}
        onError={(error) => {
          console.error('Wallet adapter error:', error);
        }}
      >
        <GameProvider>
          <AppContent />
        </GameProvider>
      </AptosWalletAdapterProvider>
    </ConfigProvider>
  );
}

export default App;